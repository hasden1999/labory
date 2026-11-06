import { NextResponse } from 'next/server';
import { getClinicalTemplates, saveClinicalTemplates } from '@/lib/clinicalTemplates';

export async function GET() {
  try {
    const templates = getClinicalTemplates();
    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'فشل جلب قوالب الفحوصات' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ok = saveClinicalTemplates(body);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'فشل حفظ إعدادات القوالب' },
        { status: 500 }
      );
    }
    const updated = getClinicalTemplates();
    return NextResponse.json({
      success: true,
      templates: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'فشل معالجة طلب تحديث القوالب' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
