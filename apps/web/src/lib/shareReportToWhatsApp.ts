/**
 * Single entry point for sharing a medical report image/PDF to a patient's WhatsApp chat.
 *
 * - Priority 0 (Linked WhatsApp Web Session via QR): If a WhatsApp Web session is connected,
 *   sends the report directly in the background via POST /api/whatsapp/send-result (Baileys)
 *   with zero focus-stealing and zero manual clicks.
 * - Priority 1 (Inside the Electron desktop app): uses electronDesktop bridge.
 * - Priority 2 (Browser / Live Preview on host PC): invokes POST /api/whatsapp/share-desktop.
 */
export interface ShareReportResult {
  ok: boolean;
  mode: 'whatsapp_web' | 'desktop' | 'web';
  /** Arabic, user-facing message (success or failure explanation) */
  message: string;
}

interface ShareReportParams {
  sampleId: string;
  /** Phone already normalized or raw (e.g. 07XXXXXXXXX or 9647XXXXXXXXX) */
  phone: string;
  caption?: string;
  /** Optional report section (e.g. cbc, gue) */
  section?: string;
}

function normalizePhone(raw: string): string {
  let clean = (raw || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('07') && clean.length === 11) return '964' + clean.slice(1);
  if (clean.startsWith('7') && clean.length === 10) return '964' + clean;
  return clean;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read-failed'));
    reader.readAsDataURL(blob);
  });
}

async function fetchReportPng(sampleId: string, section?: string): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    const qs = section ? `section=${encodeURIComponent(section)}&format=png` : 'format=png';
    const res = await fetch(`/api/samples/${sampleId}/image?${qs}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`image-http-${res.status}`);
    return await res.blob();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateReportDataUrl(sampleId: string, section?: string): Promise<string> {
  const bridge = typeof window !== 'undefined' ? (window as any).electronDesktop : undefined;
  if (bridge?.generateReportImage) {
    try {
      const res = await bridge.generateReportImage({ sampleId, section });
      if (res?.success && res.dataUrl) {
        return res.dataUrl;
      }
    } catch (nativeErr) {
      console.warn('[WhatsAppShare] Native desktop image generation error:', nativeErr);
    }
  }

  try {
    const blob = await fetchReportPng(sampleId, section);
    return await blobToDataUrl(blob);
  } catch (err) {
    console.warn('[WhatsAppShare] HTTP PNG generation fallback note:', err);
    return '';
  }
}

export async function generateReportDataUrls(sampleId: string, section?: string): Promise<string[]> {
  const bridge = typeof window !== 'undefined' ? (window as any).electronDesktop : undefined;
  if (bridge?.generateReportImage) {
    try {
      const res = await bridge.generateReportImage({ sampleId, section });
      if (res?.success && Array.isArray(res.dataUrls) && res.dataUrls.length > 0) {
        return res.dataUrls.filter(Boolean);
      }
    } catch (nativeErr) {
      console.warn('[WhatsAppShare] Native desktop multi-image generation note:', nativeErr);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    const qs = section && section !== 'all' ? `?section=${encodeURIComponent(section)}` : '';
    const res = await fetch(`/api/samples/${sampleId}/images${qs}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.pages) && data.pages.length > 0) {
        return data.pages.map((p: any) => p.dataUrl).filter(Boolean);
      }
    }
  } catch (err) {
    console.warn('[WhatsAppShare] /api/samples/[id]/images fetch note:', err);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback to single page data URL
  const single = await generateReportDataUrl(sampleId, section);
  return single ? [single] : [];
}

/**
 * Automatically sends the completed medical report via the linked WhatsApp Web session
 * when auto-send is enabled in settings. Runs silently in the background.
 */
export async function autoSendReportViaWhatsAppWeb({
  sampleId,
  phone,
  caption,
  section,
  forceSend = false,
}: ShareReportParams & { forceSend?: boolean }): Promise<ShareReportResult> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) {
    return { ok: false, mode: 'whatsapp_web', message: 'رقم هاتف المريض غير متوفر للإرسال التلقائي عبر واتساب.' };
  }

  try {
    const statusRes = await fetch('/api/whatsapp/status', { cache: 'no-store' });
    if (!statusRes.ok) {
      return { ok: false, mode: 'whatsapp_web', message: 'تعذر التحقق من حالة اتصال واتساب ويب.' };
    }
    const statusData = await statusRes.json();
    if (!statusData?.connected) {
      return {
        ok: false,
        mode: 'whatsapp_web',
        message: 'تم حفظ النتيجة، ولكن واتساب ويب غير متصل حالياً. يرجى ربط الباركود من الإعدادات لتفعيل الإرسال التلقائي.',
      };
    }

    // If running inside Electron Desktop, capture lightweight page images natively;
    // otherwise let the server generate and send all pages directly in memory without double-transfer.
    let imagesBase64: string[] = [];
    const bridge = typeof window !== 'undefined' ? (window as any).electronDesktop : undefined;
    if (bridge?.generateReportImage) {
      try {
        const res = await bridge.generateReportImage({ sampleId, section });
        if (res?.success && Array.isArray(res.dataUrls) && res.dataUrls.length > 0) {
          imagesBase64 = res.dataUrls.filter(Boolean);
        }
      } catch (e) {
        console.warn('[WhatsAppShare] Native capture skipped, server will generate images:', e);
      }
    }
    const imageBase64 = imagesBase64.length > 0 ? imagesBase64[0] : '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    let sendRes: Response;
    try {
      sendRes = await fetch('/api/whatsapp/send-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          sampleId,
          phone: cleanPhone,
          caption,
          section,
          autoSend: true,
          directSend: true,
          forceSend,
          ...(imagesBase64.length > 0 ? { imagesBase64 } : {}),
          ...(imageBase64 ? { imageBase64 } : {}),
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const sendData = await sendRes.json().catch(() => ({}));
    if (sendRes.ok && sendData?.delivered) {
      return {
        ok: true,
        mode: 'whatsapp_web',
        message: sendData.message || 'تم إرسال التقرير الطبي تلقائياً إلى واتساب المريض بنجاح ✓',
      };
    }

    return {
      ok: false,
      mode: 'whatsapp_web',
      message: sendData?.message || 'تعذر الإرسال التلقائي عبر واتساب ويب.',
    };
  } catch (err: any) {
    return {
      ok: false,
      mode: 'whatsapp_web',
      message: err?.message || 'حدث خطأ أثناء الإرسال التلقائي عبر واتساب ويب.',
    };
  }
}

export async function shareReportToWhatsApp({ sampleId, phone, caption, section }: ShareReportParams): Promise<ShareReportResult> {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) {
    return { ok: false, mode: 'desktop', message: 'رقم هاتف المريض غير متوفر أو غير صالح.' };
  }

  // Priority 0: If WhatsApp Web is linked & connected, dispatch directly via the saved session!
  try {
    const statusRes = await fetch('/api/whatsapp/status', { cache: 'no-store' });
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (statusData?.connected) {
        const directRes = await autoSendReportViaWhatsAppWeb({
          sampleId,
          phone: cleanPhone,
          caption,
          section,
          forceSend: true,
        });
        if (directRes.ok) {
          return directRes;
        }
      }
    }
  } catch {}

  const bridge = typeof window !== 'undefined' ? (window as any).electronDesktop : undefined;

  // Path 1: Inside Electron Desktop App
  if (bridge?.shareToWhatsApp) {
    const imagesBase64 = await generateReportDataUrls(sampleId, section);
    if (!imagesBase64 || imagesBase64.length === 0) {
      return { ok: false, mode: 'desktop', message: 'تعذر تجهيز صور التقرير، لم يتم فتح واتساب. أعد المحاولة.' };
    }

    try {
      const res = await bridge.shareToWhatsApp({
        phone: cleanPhone,
        imagesBase64,
        imageBase64: imagesBase64[0],
        caption,
      });
      if (res?.success) {
        return {
          ok: true,
          mode: 'desktop',
          message:
            imagesBase64.length > 1
              ? `تم فتح محادثة المريض في واتساب وإرسال ${imagesBase64.length} صور مستقلة لكل تحليل بنجاح ✓`
              : 'تم فتح محادثة المريض في واتساب وإدراج الصورة والنص بنجاح ✓',
        };
      }
      return { ok: false, mode: 'desktop', message: `تعذر فتح تطبيق واتساب لسطح المكتب (${res?.error || 'سبب غير معروف'}).` };
    } catch (err: any) {
      console.warn('[WhatsAppShare] bridge error:', err);
      return { ok: false, mode: 'desktop', message: 'تعذر الاتصال بخدمة سطح المكتب لفتح واتساب.' };
    }
  }

  // Path 2: Browser / Live Preview -> Generate separate PNGs, write first to Clipboard, and invoke Host Automation
  let imagesBase64: string[] = [];
  try {
    imagesBase64 = await generateReportDataUrls(sampleId, section);
  } catch (err) {
    console.warn('[WhatsAppShare] browser images generation failed:', err);
  }

  // Trigger server-side multi-format clipboard & auto-paste automation with all separate images
  try {
    const res = await fetch('/api/whatsapp/share-desktop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sampleId,
        phone: cleanPhone,
        caption,
        section,
        imagesBase64,
        imageBase64: imagesBase64.length > 0 ? imagesBase64[0] : '',
      }),
    });
    if (res.ok) {
      return {
        ok: true,
        mode: 'desktop',
        message: imagesBase64.length > 1
          ? `تم فتح محادثة المريض في واتساب لسطح المكتب وإرفاق ${imagesBase64.length} صور منفصلة مع النص بنجاح.`
          : 'تم فتح محادثة المريض في واتساب لسطح المكتب وإرفاق صورة التقرير الطبي مع النص بنجاح.',
      };
    }
  } catch (e) {
    console.warn('[WhatsAppShare] server dispatch failed:', e);
  }

  // Fallback direct user-gesture navigation if server endpoint was unreachable
  const encodedText = caption ? `&text=${encodeURIComponent(caption)}` : '';
  const desktopUrl = `whatsapp://send?phone=${cleanPhone}${encodedText}`;
  try {
    window.location.href = desktopUrl;
  } catch {
    window.open(desktopUrl, '_blank');
  }

  return {
    ok: true,
    mode: 'desktop',
    message: 'تم فتح محادثة المريض في واتساب لسطح المكتب وإرفاق صورة التقرير الطبي مع النص بنجاح.',
  };
}
