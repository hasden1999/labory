import { NextResponse } from 'next/server';
import { addDeviceMapping } from '../../../../../lib/serverStore';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!body.deviceTestCode || !body.testCatalogId) {
      return NextResponse.json({ message: 'كود فحص الجهاز والفحص المقابل بالنظام حقول إلزامية' }, { status: 400 });
    }

    const mapping = addDeviceMapping(params.id, body);
    if (!mapping) {
      return NextResponse.json({ message: 'الجهاز غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ mapping, message: 'تم حفظ ربط الفحص بنجاح' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: 'فشل حفظ ربط الفحص', error: err?.message }, { status: 500 });
  }
}
