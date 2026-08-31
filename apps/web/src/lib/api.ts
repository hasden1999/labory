const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:8000');

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lab_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lab_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lab_token');
    localStorage.removeItem('lab_user');
  }
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('lab_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${cleanEndpoint}` : `${baseUrl}${cleanEndpoint}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    let errMessage = 'حدث خطأ في الاتصال بالسيرفر';
    try {
      const errJson = await response.json();
      errMessage = errJson.message || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return (await response.text()) as any;
}
