import { INITIAL_TESTS_CATALOG, INITIAL_PANELS, INITIAL_DOCTORS } from './catalogData';

const DEFAULT_SETTINGS = {
  labName: 'ظ…ط®طھط¨ط± ط§ظ„ط±ط¶ط§ ظ„ظ„طھط­ظ„ظٹظ„ط§طھ ط§ظ„ط·ط¨ظٹط© ط§ظ„طھط®طµطµظٹط©',
  labSubtitle: 'ظپط­ظˆطµط§طھ ظ…ط±ط¶ظٹط© ظˆطھط·ط¨ظٹظ‚ظٹط© ط¯ظ‚ظٹظ‚ط© - طھط´ط®ظٹطµ ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ…طھظƒط§ظ…ظ„',
  doctorName: 'ط¯. ط£ط­ظ…ط¯ ط§ظ„ط±ط¶ط§',
  doctorTitle: 'ط§ط³طھط´ط§ط±ظٹ ط§ظ„طھط­ظ„ظٹظ„ط§طھ ط§ظ„ظ…ط±ط¶ظٹط© ظˆط§ظ„ظ…ظ†ط§ط¹ط© ط§ظ„ط³ط±ظٹط±ظٹط©',
  labLicense: 'MOH-IQ-2026-8842',
  currency: 'ط¯.ط¹',
  address: 'ط¨ط؛ط¯ط§ط¯ - ط´ط§ط±ط¹ ط§ظ„ط£ط·ط¨ط§ط، - ظ…ظ‚ط§ط¨ظ„ ط§ظ„ظ…ط¬ظ…ط¹ ط§ظ„ط·ط¨ظٹ ط§ظ„ظ…ط±ظƒط²ظٹ',
  phone: '07701234567 / 07801234567',
  whatsappNumber: '07701234567',
};

function handleClientFallback(endpoint: string) {
  const clean = endpoint.toLowerCase();
  
  if (clean.includes('/tests')) {
    return {
      tests: INITIAL_TESTS_CATALOG,
      panels: INITIAL_PANELS,
    };
  }
  
  if (clean.includes('/doctors')) {
    return INITIAL_DOCTORS;
  }

  if (clean.includes('/settings')) {
    return DEFAULT_SETTINGS;
  }

  if (clean.includes('/reports/dashboard')) {
    return {
      summary: {
        totalSamplesCount: 14,
        todaySamplesCount: 6,
        totalRevenue: 215000,
        todayRevenue: 75000,
        totalPaidCash: 190000,
        todayPaidCash: 70000,
        totalRemainingDebts: 25000,
        totalExpenses: 30000,
        totalDoctorCommissions: 18000,
        netProfit: 142000,
        urgentPendingCount: 1,
        criticalCount: 0,
      },
      statusBreakdown: { RECEIVED: 2, IN_PROGRESS: 2, READY: 7, DELIVERED: 3 },
      departmentCounts: { 'ط£ظ…ط±ط§ط¶ ط§ظ„ط¯ظ…': 5, 'ط§ظ„ظƒظٹظ…ظٹط§ط، ط§ظ„ط³ط±ظٹط±ظٹط©': 8, 'ط§ظ„ظپط­طµ ط§ظ„ظ…ط¬ظ‡ط±ظٹ': 3 },
      doctorCommissionsSummary: [],
      inventoryAlerts: { expiredCount: 0, expiringCount: 1, lowStockCount: 2 },
      recentExpenses: [],
    };
  }

  if (clean.includes('/patients/search')) {
    return [];
  }

  return null;
}

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

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });

    if (!response.ok) {
      // Fallback for tests & doctors if 404/500
      const fallback = handleClientFallback(cleanEndpoint);
      if (fallback !== null) return fallback as T;

      let errMessage = 'ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط³ظٹط±ظپط±';
      try {
        const errJson = await response.json();
        errMessage = errJson.message || errMessage;
      } catch {}
      throw new Error(errMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonRes = await response.json();
      if (cleanEndpoint.includes('/tests') && (!jsonRes?.tests || jsonRes.tests.length === 0)) {
        return handleClientFallback(cleanEndpoint) as T;
      }
      return jsonRes;
    }
    return (await response.text()) as any;
  } catch (err: any) {
    // Graceful fallback for Vercel demo mode
    const fallback = handleClientFallback(cleanEndpoint);
    if (fallback !== null) return fallback as T;
    throw err;
  }
}
