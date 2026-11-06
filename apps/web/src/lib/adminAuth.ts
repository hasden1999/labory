import { apiRequest } from './api';

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: string;
  isAdmin?: boolean;
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token') || localStorage.getItem('lab_token');
}

export function setAdminAuth(token: string, user: AdminUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    // Also set standard token so common API calls work seamlessly
    localStorage.setItem('lab_token', token);
    localStorage.setItem('lab_user', JSON.stringify(user));
    localStorage.setItem('user_role', user.role);
  }
}

export function removeAdminAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('admin_user');
  if (!raw) {
    const fallback = localStorage.getItem('lab_user');
    if (!fallback) return null;
    try {
      const u = JSON.parse(fallback);
      if (u.role === 'OWNER' || u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
        return u;
      }
      return null;
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  const user = getAdminUser();
  if (!token || !user) return false;
  return user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

export async function adminApiRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  return apiRequest<T>(endpoint, method, body);
}
