import { NextResponse } from 'next/server';
import { getStore, updatePanelInStore, deletePanelInStore } from '../../../../../lib/serverStore';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const store = getStore();
  const panel = (store.panels || []).find((p: any) => p.id === params.id);
  if (!panel) {
    return NextResponse.json({ message: 'الباقة غير موجودة' }, { status: 404 });
  }
  return NextResponse.json(panel);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const updated = updatePanelInStore(params.id, data);
    if (!updated) {
      return NextResponse.json({ message: 'الباقة غير موجودة' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Error updating panel:', err);
    return NextResponse.json({ message: err?.message || 'خطأ أثناء تعديل الباقة' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return PATCH(req, { params });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const success = deletePanelInStore(params.id);
    if (!success) {
      return NextResponse.json({ message: 'الباقة غير موجودة' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'تم حذف الباقة بنجاح' });
  } catch (err: any) {
    console.error('Error deleting panel:', err);
    return NextResponse.json({ message: err?.message || 'خطأ أثناء حذف الباقة' }, { status: 500 });
  }
}
