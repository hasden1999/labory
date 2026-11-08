import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

declare const __non_webpack_require__: any;

// Hidden from bundlers: native dynamic import used as a fallback for ESM-only
// packages on Node versions that do not support require(ESM) (e.g. Node 18).
const nativeImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<any>;

async function loadNodeModule(modName: string): Promise<any> {
  const baseReq = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
  let lastError: any = null;
  try {
    return baseReq(modName);
  } catch (err) {
    lastError = err;
    const Module = baseReq('module');
    const searchBases = new Set<string>();

    const addBaseAndAncestors = (startPath: string | undefined, maxUp = 5) => {
      if (!startPath) return;
      let curr = path.resolve(startPath);
      for (let i = 0; i <= maxUp; i++) {
        searchBases.add(curr);
        const parent = path.dirname(curr);
        if (parent === curr) break;
        curr = parent;
      }
    };

    addBaseAndAncestors(process.cwd(), 5);
    if (typeof __dirname !== 'undefined') {
      addBaseAndAncestors(__dirname, 5);
    }
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      addBaseAndAncestors(process.env.PORTABLE_EXECUTABLE_DIR, 2);
    }
    const resourcesPath = (process as any).resourcesPath;
    if (resourcesPath) {
      addBaseAndAncestors(resourcesPath, 2);
      addBaseAndAncestors(path.join(resourcesPath, 'engine', 'standalone'), 2);
      addBaseAndAncestors(path.join(resourcesPath, 'engine-legacy', 'standalone'), 2);
    }
    if (process.execPath) {
      const execDir = path.dirname(process.execPath);
      addBaseAndAncestors(execDir, 2);
      addBaseAndAncestors(path.join(execDir, 'standalone'), 2);
      addBaseAndAncestors(path.join(execDir, 'resources', 'engine', 'standalone'), 2);
      addBaseAndAncestors(path.join(execDir, 'resources', 'engine-legacy', 'standalone'), 2);
    }

    const baseList = Array.from(searchBases);
    const candidates: string[] = [];
    for (const base of baseList) {
      candidates.push(path.join(base, 'package.json'));
      candidates.push(path.join(base, 'node_modules', modName, 'package.json'));
    }

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        try {
          const customReq = Module.createRequire(candidate);
          return customReq(modName);
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    for (const base of baseList) {
      const directModDir = path.join(base, 'node_modules', modName);
      if (fs.existsSync(directModDir)) {
        try {
          return baseReq(directModDir);
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    const detail = lastError?.message ? ` (${lastError.code || 'ERR'}: ${lastError.message})` : '';
    throw new Error(`تعذر تحميل وحدة محرك واتساب (${modName})${detail}`);
  }
}

export function getWhatsAppAuthDir(): string {
  const baseDir = process.env.LABRYO_DATA_DIR
    ? path.resolve(process.env.LABRYO_DATA_DIR)
    : path.resolve(
        process.cwd().includes('apps') ? process.cwd() : path.join(process.cwd(), 'apps', 'web'),
        'data'
      );
  const authDir = path.join(baseDir, 'whatsapp_auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

export type WhatsAppConnectionStatus = 'DISCONNECTED' | 'PAIRING' | 'CONNECTED';

export interface WhatsAppServiceStatus {
  connected: boolean;
  status: WhatsAppConnectionStatus;
  user?: string;
  userName?: string;
  qr?: string;
  qrDataUrl?: string;
  authDir: string;
  hasSavedSession?: boolean;
  lastError?: string;
}

export interface SendMediaParams {
  phone: string;
  type: 'image' | 'document';
  mediaBuffer: Buffer | string;
  caption?: string;
  fileName?: string;
  mimetype?: string;
}

export interface SendMediaResult {
  success: boolean;
  messageId?: string;
  deliveredTo?: string;
  error?: string;
}

export function formatToWhatsAppJID(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return '';

  if (clean.startsWith('07') && clean.length === 11) {
    clean = '964' + clean.slice(1);
  } else if (clean.startsWith('7') && clean.length === 10) {
    clean = '964' + clean;
  } else if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }

  if (!clean.endsWith('@s.whatsapp.net')) {
    clean = `${clean}@s.whatsapp.net`;
  }
  return clean;
}

export function cleanDisplayPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('07') && clean.length === 11) {
    clean = '964' + clean.slice(1);
  } else if (clean.startsWith('7') && clean.length === 10) {
    clean = '964' + clean;
  } else if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }
  return clean;
}

class WhatsAppWebEngine {
  private sock: any = null;
  private socketGeneration: number = 0;
  private status: WhatsAppConnectionStatus = 'DISCONNECTED';
  private qrDataUrl: string | null = null;
  private connectedUser: { id: string; name?: string } | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<WhatsAppServiceStatus> | null = null;
  private initialQrResolvers: Array<() => void> = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private stableOpenTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private hasCheckedSession: boolean = false;
  private lastInitError: string | null = null;
  private lastError: string | null = null;

  private cleanupSocket(sockInstance: any) {
    if (!sockInstance) return;
    try {
      sockInstance.ev?.removeAllListeners?.('connection.update');
      sockInstance.ev?.removeAllListeners?.('creds.update');
      sockInstance.end?.(undefined);
    } catch {}
  }

  private notifyInitialQrOrOpen() {
    if (this.initialQrResolvers.length > 0) {
      const resolvers = this.initialQrResolvers.splice(0, this.initialQrResolvers.length);
      for (const resolve of resolvers) {
        try {
          resolve();
        } catch {}
      }
    }
  }

  private waitForInitialQrOrOpen(timeoutMs = 8000): Promise<void> {
    if (this.status === 'CONNECTED' || (this.status === 'PAIRING' && this.qrDataUrl)) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, timeoutMs);
      this.initialQrResolvers.push(done);
    });
  }

  public hasSavedCredentials(): boolean {
    try {
      const authDir = getWhatsAppAuthDir();
      return fs.existsSync(path.join(authDir, 'creds.json'));
    } catch {
      return false;
    }
  }

  public checkExistingSession() {
    if (this.hasCheckedSession) return;
    this.hasCheckedSession = true;
    try {
      if (this.hasSavedCredentials()) {
        console.log('[WhatsAppWebEngine] Saved session detected, auto-reconnecting in background...');
        this.initSocket(false).catch((err) => {
          console.warn('[WhatsAppWebEngine] Background session restore error:', err?.message);
        });
      }
    } catch (err) {
      console.warn('[WhatsAppWebEngine] checkExistingSession error:', err);
    }
  }

  public async initSocket(forceRestart = false): Promise<WhatsAppServiceStatus> {
    if (forceRestart) {
      this.reconnectAttempts = 0;
      this.lastError = null;
      this.lastInitError = null;
    } else {
      if (this.sock && this.status === 'CONNECTED') {
        return this.getStatus();
      }
      if (this.sock && this.status === 'PAIRING') {
        await this.waitForInitialQrOrOpen(1500);
        return this.getStatus();
      }
      if (this.isInitializing && this.initPromise) {
        return await this.initPromise;
      }
    }

    const runInit = async (): Promise<WhatsAppServiceStatus> => {
      this.isInitializing = true;
      if (this.status !== 'CONNECTED') {
        this.status = 'PAIRING';
      }
      this.lastInitError = null;
      this.lastError = null;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.stableOpenTimer) {
        clearTimeout(this.stableOpenTimer);
        this.stableOpenTimer = null;
      }

      if (this.sock) {
        this.cleanupSocket(this.sock);
        this.sock = null;
        if (forceRestart) {
          this.qrDataUrl = null;
        }
      }

      const currentGen = ++this.socketGeneration;

      try {
        const baileysMod = await loadNodeModule('@whiskeysockets/baileys');
        const makeWASocket =
          (typeof baileysMod === 'function' ? baileysMod : null) ||
          baileysMod.default?.default ||
          baileysMod.default ||
          baileysMod.makeWASocket ||
          baileysMod;
        const useMultiFileAuthState =
          baileysMod.useMultiFileAuthState ||
          baileysMod.default?.useMultiFileAuthState ||
          baileysMod.default?.default?.useMultiFileAuthState;
        const DisconnectReason =
          baileysMod.DisconnectReason ||
          baileysMod.default?.DisconnectReason ||
          baileysMod.default?.default?.DisconnectReason;
        const pinoMod = await loadNodeModule('pino');
        const pino = pinoMod.default || pinoMod;
        const qrMod = await loadNodeModule('qrcode');
        const QRCode = qrMod.default || qrMod;

        const authDir = getWhatsAppAuthDir();
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        const socketConfig: any = {
          auth: state,
          printQRInTerminal: false,
          logger: pino({ level: 'silent' }),
          browser: ['Labryo Clinical LIMS', 'Chrome', '1.5.12'],
          syncFullHistory: false,
          markOnlineOnConnect: false,
          connectTimeoutMs: 45000,
          keepAliveIntervalMs: 20000,
          defaultQueryTimeoutMs: 60000,
          retryRequestDelayMs: 500,
        };

        const sock = makeWASocket(socketConfig);
        this.sock = sock;

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update: any) => {
          if (currentGen !== this.socketGeneration) return;
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            try {
              this.qrDataUrl = await QRCode.toDataURL(qr, {
                margin: 2,
                width: 300,
                color: {
                  dark: '#0f172a',
                  light: '#ffffff',
                },
              });
              this.status = 'PAIRING';
              this.notifyInitialQrOrOpen();
              console.log('[WhatsAppWebEngine] QR code generated and ready for scanning.');
            } catch (qrErr) {
              console.error('[WhatsAppWebEngine] Error generating QR code:', qrErr);
            }
          }

          if (connection === 'open') {
            this.status = 'CONNECTED';
            this.qrDataUrl = null;
            this.lastError = null;
            this.lastInitError = null;
            if (this.stableOpenTimer) {
              clearTimeout(this.stableOpenTimer);
            }
            this.stableOpenTimer = setTimeout(() => {
              this.reconnectAttempts = 0;
              this.stableOpenTimer = null;
            }, 15000);
            const rawId = sock.user?.id || '';
            const cleanId = rawId.split(':')[0].split('@')[0];
            this.connectedUser = {
              id: cleanId || this.connectedUser?.id || 'متصل',
              name: sock.user?.name || this.connectedUser?.name || undefined,
            };
            this.notifyInitialQrOrOpen();
            console.log(`✅ [WhatsAppWebEngine] Connected as: ${cleanId} (${sock.user?.name || 'Lab Account'})`);
          }

          if (connection === 'close') {
            if (this.stableOpenTimer) {
              clearTimeout(this.stableOpenTimer);
              this.stableOpenTimer = null;
            }
            const statusCode =
              lastDisconnect?.error?.output?.statusCode ||
              lastDisconnect?.error?.statusCode;
            const isLoggedOut = statusCode === DisconnectReason?.loggedOut || statusCode === 401;
            const isBadMac = String(lastDisconnect?.error?.message || '').includes('Bad MAC');
            const isConflict = statusCode === DisconnectReason?.connectionReplaced || statusCode === 440;
            console.log(`⚠️ [WhatsAppWebEngine] Connection closed. Status: ${statusCode}, LoggedOut: ${isLoggedOut}, Conflict: ${isConflict}`);

            this.cleanupSocket(sock);
            if (this.sock === sock) {
              this.sock = null;
            }

            if (isLoggedOut || isBadMac) {
              console.warn('[WhatsAppWebEngine] Session corrupted or logged out, resetting session credentials.');
              this.reconnectAttempts = 0;
              await this.logout();
            } else if (isConflict) {
              // Avoid aggressive conflict ping-pong; wait calmly before checking if session needs recovery
              if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
              this.reconnectTimer = setTimeout(() => {
                if (!this.sock && this.hasSavedCredentials()) {
                  this.initSocket(false).catch(() => {});
                }
              }, 8000);
            } else if (this.hasSavedCredentials() && this.reconnectAttempts < 8) {
              // Keep status as CONNECTED if we already had a verified user and are doing a fast background reconnect (e.g. 515 restartRequired)
              const isFastRestart = statusCode === DisconnectReason?.restartRequired || statusCode === 515 || this.reconnectAttempts < 2;
              if (!isFastRestart || !this.connectedUser) {
                this.status = 'DISCONNECTED';
              }
              this.reconnectAttempts++;
              const delay = statusCode === 515
                ? 800
                : Math.min(60000, Math.round(3000 * Math.pow(1.8, this.reconnectAttempts)));
              if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
              this.reconnectTimer = setTimeout(() => {
                this.initSocket(false).catch((e) => {
                  console.warn('[WhatsAppWebEngine] Reconnect attempt failed:', e?.message);
                });
              }, delay);
            } else {
              this.status = 'DISCONNECTED';
              this.connectedUser = null;
              if (this.reconnectAttempts >= 8) {
                this.lastError = 'تعذر استقرار اتصال واتساب ويب تلقائياً (428). يرجى فتح إعدادات الواتساب لإعادةالاتصال.';
                this.lastInitError = this.lastError;
              }
            }
            this.notifyInitialQrOrOpen();
          }
        });

        await this.waitForInitialQrOrOpen(forceRestart ? 5000 : 1500);
        return this.getStatus();
      } catch (err: any) {
        console.error('[WhatsAppWebEngine] initSocket error:', err);
        this.status = 'DISCONNECTED';
        this.lastInitError = err?.message || String(err);
        this.lastError = this.lastInitError;
        this.notifyInitialQrOrOpen();
        throw err;
      } finally {
        this.isInitializing = false;
        this.initPromise = null;
      }
    };

    this.initPromise = runInit();
    return await this.initPromise;
  }

  private async ensureActiveSocket(maxWaitMs = 10000): Promise<any> {
    if (this.sock && this.status === 'CONNECTED') {
      return this.sock;
    }
    if (this.hasSavedCredentials()) {
      await this.initSocket(false).catch(() => {});
    }
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      if (this.sock && this.status === 'CONNECTED' && this.sock.sendMessage) {
        return this.sock;
      }
      await new Promise((r) => setTimeout(r, 350));
    }
    if (!this.sock || this.status !== 'CONNECTED') {
      throw new Error('جلسة واتساب ويب غير متصلة. يرجى فتح الإعدادات ومسح رمز الباركود (QR) لربط الحساب أولاً.');
    }
    return this.sock;
  }

  public getStatus(_waitForQr = false): WhatsAppServiceStatus {
    if (!this.hasCheckedSession && !this.sock) {
      this.checkExistingSession();
    }
    const isEffectivelyConnected =
      this.status === 'CONNECTED' || Boolean(this.connectedUser && this.hasSavedCredentials() && !this.qrDataUrl && this.reconnectAttempts < 8);
    const effectiveStatus: WhatsAppConnectionStatus =
      isEffectivelyConnected
        ? 'CONNECTED'
        : this.qrDataUrl
          ? 'PAIRING'
          : this.status;
    return {
      connected: isEffectivelyConnected,
      status: effectiveStatus,
      user: this.connectedUser?.id,
      userName: this.connectedUser?.name,
      qr: this.qrDataUrl || undefined,
      qrDataUrl: this.qrDataUrl || undefined,
      authDir: getWhatsAppAuthDir(),
      hasSavedSession: this.hasSavedCredentials(),
      lastError: this.lastError || this.lastInitError || undefined,
    };
  }

  public async logout(): Promise<{ success: boolean; message: string }> {
    this.socketGeneration++;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.stableOpenTimer) {
      clearTimeout(this.stableOpenTimer);
      this.stableOpenTimer = null;
    }

    try {
      if (this.sock) {
        await this.sock.logout?.().catch(() => {});
        this.cleanupSocket(this.sock);
      }
    } catch {}

    this.sock = null;
    this.status = 'DISCONNECTED';
    this.qrDataUrl = null;
    this.connectedUser = null;
    this.reconnectAttempts = 0;
    this.lastInitError = null;
    this.lastError = null;

    const authDir = getWhatsAppAuthDir();
    if (fs.existsSync(authDir)) {
      try {
        const files = fs.readdirSync(authDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(authDir, file));
          } catch {}
        }
      } catch (err) {
        console.error('[WhatsAppWebEngine] Error purging auth dir:', err);
      }
    }

    return { success: true, message: 'تم فصل حساب واتساب ومسح الجلسة المحفوظة بنجاح.' };
  }

  public async sendTextMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string }> {
    const sock = await this.ensureActiveSocket();

    const jid = formatToWhatsAppJID(phone);
    if (!jid) {
      throw new Error('رقم هاتف المريض غير صالح لإرسال رسائل واتساب.');
    }

    const res = await sock.sendMessage(jid, { text });
    return {
      success: true,
      messageId: res?.key?.id || undefined,
    };
  }

  public async sendMedia(params: SendMediaParams): Promise<SendMediaResult> {
    const jid = formatToWhatsAppJID(params.phone);
    if (!jid) {
      throw new Error('رقم هاتف المريض غير صالح لإرسال رسائل واتساب.');
    }

    let buffer: Buffer;
    let detectedMime = params.mimetype;
    if (Buffer.isBuffer(params.mediaBuffer)) {
      buffer = params.mediaBuffer;
    } else if (typeof params.mediaBuffer === 'string') {
      if (params.mediaBuffer.startsWith('data:image/jpeg')) {
        detectedMime = 'image/jpeg';
      } else if (params.mediaBuffer.startsWith('data:image/png')) {
        detectedMime = 'image/png';
      }
      const base64Data = params.mediaBuffer.includes(',')
        ? params.mediaBuffer.split(',')[1]
        : params.mediaBuffer;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('بيانات ملف النتيجة غير صالحة.');
    }

    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const sock = await this.ensureActiveSocket(10000);
        let res: any;
        if (params.type === 'image') {
          res = await sock.sendMessage(jid, {
            image: buffer,
            caption: params.caption,
            mimetype: detectedMime || 'image/png',
          });
        } else if (params.type === 'document') {
          res = await sock.sendMessage(jid, {
            document: buffer,
            fileName: params.fileName || 'Labryo_Medical_Report.pdf',
            mimetype: detectedMime || 'application/pdf',
            caption: params.caption,
          });
        } else {
          throw new Error(`نوع الوسائط غير مدعوم: ${params.type}`);
        }

        return {
          success: true,
          messageId: res?.key?.id || undefined,
          deliveredTo: jid,
        };
      } catch (err: any) {
        lastErr = err;
        console.warn(`[WhatsAppWebEngine] sendMedia attempt #${attempt + 1} failed:`, err?.message);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        }
      }
    }

    throw lastErr || new Error('تعذر إرسال ملف النتيجة عبر واتساب بعد عدة محاولات.');
  }
}

const globalForWhatsApp = globalThis as unknown as {
  __labryoWhatsAppWebEngine?: WhatsAppWebEngine;
};

export const whatsappWebEngine: WhatsAppWebEngine =
  globalForWhatsApp.__labryoWhatsAppWebEngine ||
  (globalForWhatsApp.__labryoWhatsAppWebEngine = new WhatsAppWebEngine());

// Trigger non-blocking session check on module load so existing sessions auto-connect
whatsappWebEngine.checkExistingSession();
