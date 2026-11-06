export type AddSampleTestsPaymentMode = 'CASH' | 'DEBT';

export interface CatalogTestItem {
  id: string;
  code?: string | null;
  name: string;
  arabicName?: string | null;
  category?: string | null;
  price: number;
  unit?: string | null;
  active?: boolean;
}

export interface AddSampleTestsParams {
  sampleId: string;
  testIds: string[];
  paymentMode: AddSampleTestsPaymentMode;
}

export async function fetchCatalogTests(): Promise<CatalogTestItem[]> {
  const res = await fetch('/api/tests', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('تعذر جلب قائمة الفحوصات المتاحة');
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return data;
  }
  return Array.isArray(data?.tests) ? data.tests : [];
}

export async function addSampleTests({
  sampleId,
  testIds,
  paymentMode,
}: AddSampleTestsParams): Promise<any> {
  const res = await fetch(`/api/samples/${encodeURIComponent(sampleId)}/tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testIds, paymentMode }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'فشل إضافة الفحوصات للعينة');
  }
  return data;
}
