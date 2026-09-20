import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';

export function getWhatsAppAuthDir(): string {
  const baseDir = process.env.LABRYO_DATA_DIR
    ? path.resolve(process.env.LABRYO_DATA_DIR)
    : path.resolve(process.cwd(), 'data');
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
  authDir: string;
}

export interface SendMediaParams {
  phone: string;
  type: 'image' | 'document';
  mediaBuffer: Buffer | string; // Buffer or base64 string
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

  // Iraqi national format conversion:
  // 07XXXXXXXXX (11 digits) -> 9647XXXXXXXXX
  if (clean.startsWith('07') && clean.length === 11) {
    clean = '964' + clean.slice(1);
  } else if (clean.startsWith('7') && clean.length === 10) {
    // 7XXXXXXXXX (10 digits) -> 9647XXXXXXXXX
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
  }
  return clean;
}

class WhatsAppService {
  private sock: WASocket | null = null;
  private status: WhatsAppConnectionStatus = 'DISCONNECTED';
  private qrDataUrl: string | null = null;
  private connectedUser: { id: string; name?: string } | null = null;
  private isInitializing: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.checkExistingSession();
  }

  private checkExistingSession() {
    try {
      const authDir = getWhatsAppAuthDir();
      const credsPath = path.join(authDir, 'creds.json');
      if (fs.existsSync(credsPath)) {
        console.log('[WhatsAppService] Existing session detected, auto-initiating socket...');
        this.initSocket().catch((err) => {
          console.error('[WhatsAppService] Auto-init failed:', err?.message);
        });
      }
    } catch (err) {
      console.error('[WhatsAppService] checkExistingSession error:', err);
    }
  }

  public async initSocket(forceRestart = false): Promise<WhatsAppServiceStatus> {
    if (this.sock && this.status === 'CONNECTED' && !forceRestart) {
      return this.getStatus();
    }

    if (this.isInitializing) {
      return this.getStatus();
    }

    this.isInitializing = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      const authDir = getWhatsAppAuthDir();
      const { state, saveCreds } = await useMultiFileAuthState(authDir);

      const socketConfig: any = {
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Labryo Clinical LIS', 'Desktop', '1.0.0'],
        syncFullHistory: false,
        connectTimeoutMs: 30000,
        keepAliveIntervalMs: 25000,
        defaultQueryTimeoutMs: 40000,
      };

      const sock = makeWASocket(socketConfig);
      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 320,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            this.status = 'PAIRING';
            console.log('[WhatsAppService] New QR code generated for pairing.');
          } catch (qrErr) {
            console.error('[WhatsAppService] Error generating QR code:', qrErr);
          }
        }

        if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrDataUrl = null;
          const rawId = sock.user?.id || '';
          const cleanId = rawId.split(':')[0].split('@')[0];
          this.connectedUser = {
            id: cleanId,
            name: sock.user?.name || undefined,
          };
          console.log(`✅ [WhatsAppService] Connected successfully as: ${cleanId} (${sock.user?.name || 'Lab User'})`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          console.log(`⚠️ [WhatsAppService] Connection closed. Status: ${statusCode}, LoggedOut: ${isLoggedOut}`);

          if (isLoggedOut) {
            await this.logout();
          } else {
            this.status = 'DISCONNECTED';
            this.sock = null;
            this.reconnectTimer = setTimeout(() => {
              console.log('[WhatsAppService] Attempting reconnection...');
              this.initSocket().catch((e) => {
                console.error('[WhatsAppService] Reconnect error:', e?.message);
              });
            }, 4000);
          }
        }
      });

      return this.getStatus();
    } catch (err: any) {
      console.error('[WhatsAppService] initSocket error:', err);
      this.status = 'DISCONNECTED';
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  public getStatus(): WhatsAppServiceStatus {
    return {
      connected: this.status === 'CONNECTED',
      status: this.status,
      user: this.connectedUser?.id,
      userName: this.connectedUser?.name,
      qr: this.qrDataUrl || undefined,
      authDir: getWhatsAppAuthDir(),
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
    } catch (e) {
      // ignore
    }

    this.sock = null;
    this.status = 'DISCONNECTED';
    this.qrDataUrl = null;
    this.connectedUser = null;

    // Purge local credentials safely
    const authDir = getWhatsAppAuthDir();
    if (fs.existsSync(authDir)) {
      try {
        const files = fs.readdirSync(authDir);
        for (const file of files) {
          fs.unlinkSync(path.join(authDir, file));
        }
        console.log('[WhatsAppService] Cleared WhatsApp auth credentials directory.');
      } catch (err) {
        console.error('[WhatsAppService] Error purging auth dir:', err);
      }
    }

    return { success: true, message: 'تم تسجيل الخروج ومسح بيانات الجلسة بنجاح.' };
  }

  public async sendTextMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string }> {
    if (!this.sock || this.status !== 'CONNECTED') {
      throw new Error('جلسة واتساب غير متصلة. يرجى فتح الإعدادات ومسح رمز الـ QR لربط الحساب أولاً.');
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
      throw new Error('جلسة واتساب غير متصلة. يرجى فتح الإعدادات ومسح رمز الـ QR لربط الحساب أولاً.');
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
      throw new Error('بيانات الوسائط غير صالحة.');
    }

    let res: proto.WebMessageInfo | undefined;

    if (params.type === 'image') {
      res = await this.sock.sendMessage(jid, {
        image: buffer,
        caption: params.caption,
        mimetype: params.mimetype || 'image/jpeg',
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

export const whatsappService = new WhatsAppService();
