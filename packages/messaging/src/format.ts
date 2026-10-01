/**
 * Formats phone number into standard WhatsApp JID (e.g. Iraqi 07XXXXXXXXX -> 9647XXXXXXXXX@s.whatsapp.net)
 */
export function formatToWhatsAppJID(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return '';

  // Iraqi national format conversion:
  // 07XXXXXXXXX (11 digits) -> 9647XXXXXXXXX
  if (clean.startsWith('07') && clean.length === 11) {
    clean = '964' + clean.slice(1);
  } else if (clean.startsWith('7') && clean.length === 10) {
    clean = '964' + clean;
  }
  return clean + '@s.whatsapp.net';
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
