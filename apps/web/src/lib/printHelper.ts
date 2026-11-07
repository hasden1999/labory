/**
 * Direct, smooth Word-like printing utility.
 * Loads the print route inside a hidden in-page iframe and opens ONLY the native
 * system/browser print dialog directly over the current window without opening
 * any external browser or new tab.
 */
export function printUrlDirectly(rawUrl: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    // Remove autoprint=true from iframe URL so we control the exact single print() trigger
    const urlObj = new URL(rawUrl, window.location.origin);
    urlObj.searchParams.delete('autoprint');
    if (!urlObj.searchParams.has('force')) {
      urlObj.searchParams.set('force', 'true');
    }
    // Add cache-buster to ensure latest saved results & settings are always printed
    urlObj.searchParams.set('_t', String(Date.now()));
    const finalUrl = urlObj.pathname + urlObj.search;

    const frameId = 'labryo-direct-print-iframe';
    const existing = document.getElementById(frameId);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const iframe = document.createElement('iframe');
    iframe.id = frameId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-1';

    let hasPrinted = false;
    const triggerPrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      try {
        const cw = iframe.contentWindow;
        if (cw) {
          cw.focus();
          cw.print();
        }
      } catch (err) {
        console.warn('[DirectPrint] iframe print error:', err);
      }
    };

    iframe.onload = () => {
      try {
        const cw = iframe.contentWindow as any;
        const doc = cw?.document;
        if (doc?.fonts?.ready) {
          doc.fonts.ready
            .then(() => setTimeout(triggerPrint, 120))
            .catch(() => setTimeout(triggerPrint, 150));
        } else {
          setTimeout(triggerPrint, 180);
        }
      } catch {
        setTimeout(triggerPrint, 200);
      }
    };

    iframe.src = finalUrl;
    document.body.appendChild(iframe);
  } catch (err) {
    console.error('[DirectPrint] Failed to initialize direct print:', err);
  }
}
