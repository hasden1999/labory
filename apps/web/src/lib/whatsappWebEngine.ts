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
  private status: WhatsAppConnectionStatus = 'DISCONNECTED';
  private qrDataUrl: string | null = null;
  private connectedUser: { id: string; name?: string } | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<WhatsAppServiceStatus> | null = null;
  private initialQrResolvers: Array<() => void> = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private hasCheckedSession: boolean = false;
  private lastInitError: string | null = null;

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

  private waitForInitialQrOrOpen(timeoutMs = 6000): Promise<void> {
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
    if (this.sock && this.status === 'CONNECTED' && !forceRestart) {
      return this.getStatus();
    }

    if (this.status === 'PAIRING' && this.qrDataUrl && !forceRestart && this.sock) {
      return this.getStatus();
    }

    if (this.isInitializing && this.initPromise && !forceRestart) {
      return await this.initPromise;
    }

    const runInit = async (): Promise<WhatsAppServiceStatus> => {
      this.isInitializing = true;
      this.status = 'PAIRING';
      this.lastInitError = null;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (forceRestart && this.sock) {
        try {
          this.sock.end?.(undefined);
        } catch {}
        this.sock = null;
        this.qrDataUrl = null;
      }

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
          connectTimeoutMs: 30000,
          keepAliveIntervalMs: 25000,
          defaultQueryTimeoutMs: 40000,
        };

        const sock = makeWASocket(socketConfig);
        this.sock = sock;

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update: any) => {
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
            this.reconnectAttempts = 0;
            const rawId = sock.user?.id || '';
            const cleanId = rawId.split(':')[0].split('@')[0];
            this.connectedUser = {
              id: cleanId,
              name: sock.user?.name || undefined,
            };
            this.notifyInitialQrOrOpen();
            console.log(`✅ [WhatsAppWebEngine] Connected as: ${cleanId} (${sock.user?.name || 'Lab Account'})`);
          }

          if (connection === 'close') {
            const statusCode =
              lastDisconnect?.error?.output?.statusCode ||
              lastDisconnect?.error?.statusCode;
            const isLoggedOut = statusCode === DisconnectReason?.loggedOut || statusCode === 401;
            const isBadMac = String(lastDisconnect?.error?.message || '').includes('Bad MAC');
            console.log(`⚠️ [WhatsAppWebEngine] Connection closed. Status: ${statusCode}, LoggedOut: ${isLoggedOut}, BadMac: ${isBadMac}`);

            if (isLoggedOut || isBadMac) {
              console.warn('[WhatsAppWebEngine] Session corrupted or logged out, resetting session credentials.');
              this.reconnectAttempts = 0;
              await this.logout();
            } else {
              this.status = 'DISCONNECTED';
              this.sock = null;
              if (this.hasSavedCredentials() && this.reconnectAttempts < 15) {
                const delay = Math.min(25000, 3500 * Math.pow(1.4, this.reconnectAttempts || 0));
                this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
                this.reconnectTimer = setTimeout(() => {
                  this.initSocket(false).catch((e) => {
                    console.warn('[WhatsAppWebEngine] Reconnect attempt failed:', e?.message);
                  });
                }, delay);
              }
            }
            this.notifyInitialQrOrOpen();
          }
        });

        await this.waitForInitialQrOrOpen(6000);
        this.lastInitError = null;
        return this.getStatus();
      } catch (err: any) {
        console.error('[WhatsAppWebEngine] initSocket error:', err);
        this.status = 'DISCONNECTED';
        this.lastInitError = err?.message || String(err);
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

  public getStatus(): WhatsAppServiceStatus {
    if (!this.hasCheckedSession && !this.sock) {
      this.checkExistingSession();
    }
    const effectiveStatus: WhatsAppConnectionStatus =
      this.status === 'CONNECTED'
        ? 'CONNECTED'
        : this.qrDataUrl
          ? 'PAIRING'
          : this.status;
    return {
      connected: this.status === 'CONNECTED',
      status: effectiveStatus,
      user: this.connectedUser?.id,
      userName: this.connectedUser?.name,
      qr: this.qrDataUrl || undefined,
      qrDataUrl: this.qrDataUrl || undefined,
      authDir: getWhatsAppAuthDir(),
      hasSavedSession: this.hasSavedCredentials(),
      lastError: this.lastInitError || undefined,
    };
  }

  public async logout(): Promise<{ success: boolean; message: string }> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      if (this.sock) {
        await this.sock.logout?.().catch(() => {});
        this.sock.end?.(undefined);
      }
    } catch {}

    this.sock = null;
    this.status = 'DISCONNECTED';
    this.qrDataUrl = null;
    this.connectedUser = null;
    this.reconnectAttempts = 0;
    this.lastInitError = null;

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
    if (!this.sock || this.status !== 'CONNECTED') {
      if (this.hasSavedCredentials()) {
        await this.initSocket(false);
      }
    }
    if (!this.sock || this.status !== 'CONNECTED') {
      throw new Error('جلسة واتساب ويب غير متصلة. يرجى فتح الإعدادات ومسح رمز الباركود (QR) لربط الحساب أولاً.');
    }

    const jid = formatToWhatsAppJID(phone);
    if (!jid) {
      throw new Error('رقم هاتف المريض غير صالح لإرسال رسائل واتساب.');
    }

    const res = await this.sock.sendMessage(jid, { text });
    return {
      success: true,
      messageId: res?.key?.id || undefined,
    };
  }

  public async sendMedia(params: SendMediaParams): Promise<SendMediaResult> {
    if (!this.sock || this.status !== 'CONNECTED') {
      if (this.hasSavedCredentials()) {
        await this.initSocket(false);
      }
    }
    if (!this.sock || this.status !== 'CONNECTED') {
      throw new Error('جلسة واتساب ويب غير متصلة. يرجى فتح الإعدادات ومسح رمز الباركود (QR) لربط الحساب أولاً.');
    }

    const jid = formatToWhatsAppJID(params.phone);
    if (!jid) {
      throw new Error('رقم هاتف المريض غير صالح لإرسال رسائل واتساب.');
    }

    let buffer: Buffer;
    if (Buffer.isBuffer(params.mediaBuffer)) {
      buffer = params.mediaBuffer;
    } else if (typeof params.mediaBuffer === 'string') {
      const base64Data = params.mediaBuffer.includes(',')
        ? params.mediaBuffer.split(',')[1]
        : params.mediaBuffer;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('بيانات ملف النتيجة غير صالحة.');
    }

    let res: any;
    if (params.type === 'image') {
      res = await this.sock.sendMessage(jid, {
        image: buffer,
        caption: params.caption,
        mimetype: params.mimetype || 'image/png',
      });
    } else if (params.type === 'document') {
      res = await this.sock.sendMessage(jid, {
        document: buffer,
        fileName: params.fileName || 'Labryo_Medical_Report.pdf',
        mimetype: params.mimetype || 'application/pdf',
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
