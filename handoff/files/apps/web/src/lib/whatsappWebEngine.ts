import fs from 'fs';
import path from 'path';

declare const __non_webpack_require__: any;

function loadNodeModule(modName: string): any {
  const baseReq = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
  try {
    return baseReq(modName);
  } catch {
    const Module = baseReq('module');
    const candidates = [
      path.join(process.cwd(), 'package.json'),
      path.join(process.cwd(), '..', '..', 'package.json'),
      'D:\\lab\\package.json',
      'C:\\lab\\package.json',
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        try {
          const customReq = Module.createRequire(candidate);
          return customReq(modName);
        } catch {}
      }
    }
    throw new Error(`تعذر تحميل وحدة محرك واتساب (${modName})`);
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
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private hasCheckedSession: boolean = false;

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

    if (this.sock && this.status === 'PAIRING' && this.qrDataUrl && !forceRestart) {
      return this.getStatus();
    }

    if (this.isInitializing) {
      await this.waitForQrOrConnect(4000);
      return this.getStatus();
    }

    this.isInitializing = true;
    this.status = 'PAIRING';
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
      const baileysMod = loadNodeModule('@whiskeysockets/baileys');
      const makeWASocket = baileysMod.default || baileysMod.makeWASocket || baileysMod;
      const { DisconnectReason, useMultiFileAuthState } = baileysMod;
      const pinoMod = loadNodeModule('pino');
      const pino = pinoMod.default || pinoMod;
      const qrMod = loadNodeModule('qrcode');
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
        }
      });

      // Wait sufficiently so the initial QR code (or fast session resume) is ready in the response
      await this.waitForQrOrConnect(12000);
      return this.getStatus();
    } catch (err: any) {
      console.error('[WhatsAppWebEngine] initSocket error:', err);
      this.status = 'DISCONNECTED';
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  private async waitForQrOrConnect(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (this.status === 'CONNECTED' || (this.status === 'PAIRING' && this.qrDataUrl)) {
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
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
