import { NextResponse } from 'next/server';
import { getStore, updateTestInStore, deleteTestInStore } from '../../../../lib/serverStore';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const test = (store.tests || []).find((t: any) => t.id === params.id || t.code === params.id);
  if (!test) {
    return NextResponse.json({ message: 'الفحص غير موجود' }, { status: 404 });
  }
  return NextResponse.json(test);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const updated = updateTestInStore(params.id, data);
    if (!updated) {
      return NextResponse.json({ message: 'الفحص غير موجود' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error updating test:', err);
    return NextResponse.json({ message: err?.message || 'خطأ أثناء تعديل الفحص' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return PATCH(req, { params });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const success = deleteTestInStore(params.id);
    if (!success) {
      return NextResponse.json({ message: 'الفحص غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'تم حذف الفحص بنجاح' });
  } catch (err: any) {
    console.error('Error deleting test:', err);
    return NextResponse.json({ message: err?.message || 'خطأ أثناء حذف الفحص' }, { status: 500 });
  }
}
