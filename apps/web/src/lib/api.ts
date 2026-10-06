import { INITIAL_TESTS_CATALOG, INITIAL_PANELS, INITIAL_DOCTORS } from './catalogData';

const DEFAULT_SETTINGS = {
  labName: '',
  labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل',
  doctorName: '',
  doctorTitle: 'استشاري التحليلات المرضية والمخبرية',
  labLicense: '',
  currency: 'د.ع',
  address: '',
  phone: '',
  whatsappNumber: '',
  isConfigured: false,
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
        totalSamplesCount: 0,
        todaySamplesCount: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        totalPaidCash: 0,
        todayPaidCash: 0,
        totalRemainingDebts: 0,
        totalExpenses: 0,
        totalDoctorCommissions: 0,
        netProfit: 0,
        urgentPendingCount: 0,
        criticalCount: 0,
      },
      statusBreakdown: { RECEIVED: 0, IN_PROGRESS: 0, READY: 0, DELIVERED: 0 },
      departmentCounts: {},
      doctorCommissionsSummary: [],
      inventoryAlerts: { expiredCount: 0, expiringCount: 0, lowStockCount: 0 },
      recentExpenses: [],
    };
  }

  if (clean.includes('/patients/search')) {
    return [];
  }

  if (clean.includes('/financials/summary')) {
    return {
      totalRevenue: 0,
      totalPaid: 0,
      totalExpenses: 0,
      totalDoctorCommissions: 0,
      netProfit: 0,
      todayRevenue: 0,
      totalDiscounts: 0,
      totalRemainingDebts: 0,
      recentExpenses: [],
      expensesList: [],
    };
  }

  if (clean.includes('/financials/test-profitability')) {
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
    headers['Authorization'] = 'Bearer ' + token;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) + cleanEndpoint : baseUrl + cleanEndpoint;

  try {
    const response = await fetch(url, {
      method,
      headers,
      cache: 'no-store',
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });

    if (!response.ok) {
      if (method === 'GET') {
        const fallback = handleClientFallback(cleanEndpoint);
        if (fallback !== null) return fallback as unknown as T;
      }

      let errMessage = '';
      let errJson: any = null;
      try {
        const rawText = await response.text();
        try {
          errJson = JSON.parse(rawText);
          errMessage = errJson.message || errJson.error || errJson.details || errJson.detail || '';
          if (typeof errMessage !== 'string') {
            errMessage = JSON.stringify(errMessage);
          }
        } catch {
          if (rawText && rawText.length < 500 && !rawText.trim().startsWith('<')) {
            errMessage = rawText.trim();
          }
        }
      } catch {}

      if (!errMessage) {
        if (response.status === 404) {
          errMessage = `المسار المطلوب غير موجود على الخادم (${cleanEndpoint})`;
        } else if (response.status === 409) {
          errMessage = 'تعارض في البيانات: السجل أو الفحص مسجل مسبقاً لهذا المريض';
        } else if (response.status === 400) {
          errMessage = 'البيانات المرسلة غير مكتملة أو غير صالحة';
        } else if (response.status === 403 || response.status === 401) {
          errMessage = 'غير مصرح بتنفيذ هذه العملية';
        } else if (response.status >= 500) {
          errMessage = `خطأ في معالجة الطلب على الخادم (${response.status})`;
        } else {
          errMessage = `فشل الطلب برمز حالة ${response.status}`;
        }
      }

      const errObj: any = new Error(errMessage);
      errObj.status = response.status;
      if (errJson && typeof errJson === 'object') {
        Object.assign(errObj, errJson);
      }
      console.error(`[API Error] ${method} ${cleanEndpoint} -> ${response.status}:`, errMessage);
      throw errObj;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonRes = await response.json();
      if (method === 'GET' && cleanEndpoint.includes('/tests') && (!jsonRes?.tests || jsonRes.tests.length === 0)) {
        return handleClientFallback(cleanEndpoint) as unknown as T;
      }
      return jsonRes as T;
    }
    return (await response.text()) as unknown as T;
  } catch (err: any) {
    if (method === 'GET') {
      const fallback = handleClientFallback(cleanEndpoint);
      if (fallback !== null) return fallback as unknown as T;
    }
    console.error(`[API Network Error] ${method} ${cleanEndpoint}:`, err?.message || err);
    throw err;
  }
}
