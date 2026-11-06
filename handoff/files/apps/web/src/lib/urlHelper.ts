/**
 * Helper to generate accessible URLs for sharing across devices, WhatsApp, and QR codes.
 * Ensures that URLs generated in 'localhost' or '127.0.0.1' environments are automatically
 * resolved to the real LAN IP or custom public domain, so other devices can access them.
 */
export function getShareableUrl(path: string, labProfile?: any): string {
  // 1. If explicit serverBaseUrl is configured, prioritize it
  const customBase = labProfile?.serverBaseUrl?.trim();
  if (customBase) {
    const cleanBase = customBase.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${cleanBase}${cleanPath}`;
  }

  // 2. Check detected LAN URL from server settings
  const detectedLanUrl = labProfile?.detectedLanUrl?.trim();

  // 3. Check browser context
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // If currently running on loopback (localhost or 127.0.0.1), replace with detected LAN URL if available
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && detectedLanUrl) {
      const cleanBase = detectedLanUrl.replace(/\/+$/, '');
      const cleanPath = path.startsWith('/') ? path : '/' + path;
      return `${cleanBase}${cleanPath}`;
    }

    // Otherwise, current origin is already a LAN IP (e.g. 192.168.x.x) or public domain
    const cleanBase = origin.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${cleanBase}${cleanPath}`;
  }

  // 4. Server-side / fallback
  const fallback = detectedLanUrl || 'http://127.0.0.1:8080';
  const cleanBase = fallback.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${cleanBase}${cleanPath}`;
}
