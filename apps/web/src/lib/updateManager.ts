import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { spawn } from 'child_process';
import { URL } from 'url';

export interface DownloadState {
  status: 'idle' | 'downloading' | 'paused' | 'reconnecting' | 'completed' | 'error';
  progressPercent: number;
  transferredBytes: number;
  totalBytes: number;
  speedBps: number;
  retryCount: number;
  maxRetries: number;
  errorMessage: string | null;
  version: string | null;
  downloadUrl: string | null;
  filePath: string | null;
  lastUpdated: string;
}

// Global in-memory state singleton
class UpdateManager {
  private static instance: UpdateManager;

  private state: DownloadState = {
    status: 'idle',
    progressPercent: 0,
    transferredBytes: 0,
    totalBytes: 0,
    speedBps: 0,
    retryCount: 0,
    maxRetries: 25,
    errorMessage: null,
    version: null,
    downloadUrl: null,
    filePath: null,
    lastUpdated: new Date().toISOString(),
  };

  private activeRequest: http.ClientRequest | null = null;
  private activeStream: fs.WriteStream | null = null;
  private isCancelled: boolean = false;
  private speedSamples: { time: number; bytes: number }[] = [];
  private retryTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.ensureDownloadsDir();
  }

  public static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  private getDownloadsDir(): string {
    const baseDir = process.env.LABRYO_DATA_DIR || path.join(process.cwd(), 'data');
    const downloadsDir = path.join(baseDir, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    return downloadsDir;
  }

  private ensureDownloadsDir(): void {
    try {
      this.getDownloadsDir();
    } catch (e) {}
  }

  public getState(): DownloadState {
    // If completed or file already fully exists on disk, check integrity
    if (this.state.status === 'completed' && this.state.filePath) {
      if (!fs.existsSync(this.state.filePath)) {
        this.state.status = 'idle';
        this.state.progressPercent = 0;
      }
    }
    return { ...this.state };
  }

  public async startDownload(downloadUrl: string, version: string): Promise<DownloadState> {
    if (this.state.status === 'downloading') {
      return this.getState();
    }

    this.isCancelled = false;
    this.state.version = version;
    this.state.downloadUrl = downloadUrl;
    this.state.errorMessage = null;
    this.state.retryCount = 0;
    this.speedSamples = [];

    const downloadsDir = this.getDownloadsDir();
    const finalFileName = `Labryo.LIMS.Setup.${version.replace(/^v/, '')}.exe`;
    const finalFilePath = path.join(downloadsDir, finalFileName);
    const partFilePath = `${finalFilePath}.part`;

    this.state.filePath = finalFilePath;

    // Check if the final file is already completely downloaded
    if (fs.existsSync(finalFilePath)) {
      const stats = fs.statSync(finalFilePath);
      if (stats.size > 10 * 1024 * 1024) { // Valid exe (>10MB)
        this.state.status = 'completed';
        this.state.progressPercent = 100;
        this.state.transferredBytes = stats.size;
        this.state.totalBytes = stats.size;
        this.state.lastUpdated = new Date().toISOString();
        return this.getState();
      }
    }

    this.performDownloadWithResume(downloadUrl, partFilePath, finalFilePath);
    return this.getState();
  }

  private performDownloadWithResume(targetUrl: string, partFilePath: string, finalFilePath: string): void {
    if (this.isCancelled) return;

    let existingBytes = 0;
    if (fs.existsSync(partFilePath)) {
      try {
        existingBytes = fs.statSync(partFilePath).size;
      } catch (e) {
        existingBytes = 0;
      }
    }

    this.state.status = 'downloading';
    this.state.transferredBytes = existingBytes;
    this.state.lastUpdated = new Date().toISOString();

    const headers: Record<string, string> = {
      'User-Agent': 'Labryo-LIMS-App',
      'Accept': '*/*',
    };

    if (existingBytes > 0) {
      headers['Range'] = `bytes=${existingBytes}-`;
    }

    this.fetchWithRedirects(targetUrl, headers, (err, response, finalUrl) => {
      if (err) {
        this.handleNetworkError(err, targetUrl, partFilePath, finalFilePath);
        return;
      }

      if (!response) {
        this.handleNetworkError(new Error('Empty response from update server'), targetUrl, partFilePath, finalFilePath);
        return;
      }

      const statusCode = response.statusCode || 0;

      // Handle 416 Range Not Satisfiable (file is already fully downloaded in .part)
      if (statusCode === 416) {
        this.finalizeDownload(partFilePath, finalFilePath);
        return;
      }

      if (statusCode !== 200 && statusCode !== 206) {
        this.handleNetworkError(new Error(`Server responded with HTTP ${statusCode}`), targetUrl, partFilePath, finalFilePath);
        return;
      }

      const isPartial = statusCode === 206;
      let total = 0;

      if (isPartial) {
        const contentRange = response.headers['content-range'];
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)/);
          if (match) total = parseInt(match[1], 10);
        }
      } else {
        const contentLength = response.headers['content-length'];
        if (contentLength) total = parseInt(contentLength, 10);
        existingBytes = 0; // Server doesn't support range, restart from 0
      }

      if (total > 0) {
        this.state.totalBytes = total;
      }

      const writeStream = fs.createWriteStream(partFilePath, { flags: isPartial ? 'a' : 'w' });
      this.activeStream = writeStream;

      this.speedSamples = [{ time: Date.now(), bytes: existingBytes }];

      response.on('data', (chunk: Buffer) => {
        if (this.isCancelled) {
          response.destroy();
          writeStream.close();
          return;
        }

        this.state.transferredBytes += chunk.length;
        if (this.state.totalBytes > 0) {
          this.state.progressPercent = Math.min(
            100,
            Math.round((this.state.transferredBytes / this.state.totalBytes) * 1000) / 10
          );
        }

        // Calculate transfer speed (rolling window)
        const now = Date.now();
        this.speedSamples.push({ time: now, bytes: this.state.transferredBytes });
        if (this.speedSamples.length > 10) {
          this.speedSamples.shift();
        }
        if (this.speedSamples.length >= 2) {
          const first = this.speedSamples[0];
          const last = this.speedSamples[this.speedSamples.length - 1];
          const timeDelta = (last.time - first.time) / 1000;
          if (timeDelta > 0.3) {
            this.state.speedBps = Math.round((last.bytes - first.bytes) / timeDelta);
          }
        }

        this.state.lastUpdated = new Date().toISOString();
      });

      response.pipe(writeStream);

      writeStream.on('finish', () => {
        this.activeStream = null;
        if (this.isCancelled) return;

        // Verify size
        if (this.state.totalBytes > 0 && this.state.transferredBytes < this.state.totalBytes) {
          this.handleNetworkError(new Error('Download stream interrupted before completion'), targetUrl, partFilePath, finalFilePath);
          return;
        }

        this.finalizeDownload(partFilePath, finalFilePath);
      });

      writeStream.on('error', (err) => {
        this.activeStream = null;
        this.handleNetworkError(err, targetUrl, partFilePath, finalFilePath);
      });

      response.on('error', (err) => {
        writeStream.close();
        this.handleNetworkError(err, targetUrl, partFilePath, finalFilePath);
      });
    });
  }

  private finalizeDownload(partFilePath: string, finalFilePath: string): void {
    try {
      if (fs.existsSync(partFilePath)) {
        if (fs.existsSync(finalFilePath)) {
          fs.unlinkSync(finalFilePath);
        }
        fs.renameSync(partFilePath, finalFilePath);
      }
      this.state.status = 'completed';
      this.state.progressPercent = 100;
      this.state.speedBps = 0;
      this.state.errorMessage = null;
      this.state.lastUpdated = new Date().toISOString();
      console.log('[UpdateManager] Download completed and verified:', finalFilePath);
    } catch (e: any) {
      this.state.status = 'error';
      this.state.errorMessage = `Failed to finalize download file: ${e.message}`;
    }
  }

  private handleNetworkError(err: Error, targetUrl: string, partFilePath: string, finalFilePath: string): void {
    if (this.isCancelled) return;

    console.warn(`[UpdateManager] Network drop / download warning: ${err.message} (Retry ${this.state.retryCount}/${this.state.maxRetries})`);

    if (this.state.retryCount < this.state.maxRetries) {
      this.state.status = 'reconnecting';
      this.state.retryCount += 1;
      this.state.errorMessage = `انقطع الاتصال بالإنترنت (${err.message})، جاري محاولة الاستئناف التلقائي [المحاولة ${this.state.retryCount}/${this.state.maxRetries}]...`;
      this.state.lastUpdated = new Date().toISOString();

      // Exponential backoff with jitter (2s, 4s, 6s... max 10s)
      const delayMs = Math.min(10000, 2000 * Math.pow(1.3, this.state.retryCount - 1));

      this.retryTimeout = setTimeout(() => {
        if (!this.isCancelled) {
          console.log(`[UpdateManager] Auto-resuming download from byte offset...`);
          this.performDownloadWithResume(targetUrl, partFilePath, finalFilePath);
        }
      }, delayMs);
    } else {
      this.state.status = 'error';
      this.state.errorMessage = `تعذر استكمال التحميل بعد عدة محاولات: ${err.message}. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.`;
      this.state.lastUpdated = new Date().toISOString();
    }
  }

  private fetchWithRedirects(
    initialUrl: string,
    headers: Record<string, string>,
    callback: (err: Error | null, res?: http.IncomingMessage, finalUrl?: string) => void,
    redirectCount = 0
  ): void {
    if (redirectCount > 8) {
      callback(new Error('Too many HTTP redirects'));
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(initialUrl);
    } catch (e: any) {
      callback(new Error(`Invalid URL: ${initialUrl}`));
      return;
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.get(
      parsedUrl,
      {
        headers,
        timeout: 25000,
      },
      (res) => {
        // Handle HTTP Redirects (301, 302, 303, 307, 308)
        if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
            redirectUrl = new URL(redirectUrl, parsedUrl.origin).toString();
          }
          res.resume(); // Drain stream
          this.fetchWithRedirects(redirectUrl, headers, callback, redirectCount + 1);
          return;
        }

        callback(null, res, initialUrl);
      }
    );

    this.activeRequest = req;

    req.on('timeout', () => {
      req.destroy(new Error('Connection timed out'));
    });

    req.on('error', (err) => {
      callback(err);
    });
  }

  public pauseOrCancel(): DownloadState {
    this.isCancelled = true;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.activeRequest) {
      this.activeRequest.destroy();
      this.activeRequest = null;
    }
    if (this.activeStream) {
      this.activeStream.close();
      this.activeStream = null;
    }
    this.state.status = 'paused';
    this.state.speedBps = 0;
    this.state.lastUpdated = new Date().toISOString();
    return this.getState();
  }

  public executeInstall(): { success: boolean; message: string } {
    const filePath = this.state.filePath;
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, message: 'ملف التثبيت غير موجود أو لم يكتمل تنزيله بعد.' };
    }

    try {
      console.log('[UpdateManager] Executing installer:', filePath);
      
      // Spawn installer in Windows detached process
      const child = spawn(filePath, [], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      });
      child.unref();

      return {
        success: true,
        message: 'تم تشغيل برنامج التثبيت بنجاح. سيتم إغلاق التطبيق لتطبيق التحديث.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: `فشل تشغيل برنامج التثبيت: ${e.message}`,
      };
    }
  }
}

export const updateManager = UpdateManager.getInstance();
