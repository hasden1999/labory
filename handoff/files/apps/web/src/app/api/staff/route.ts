import { NextResponse } from 'next/server';
import { getStaffList, addStaffMember } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = getStaffList();
    return NextResponse.json(staff);
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في جلب قائمة الموظفين' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || String(body.name).trim().length === 0) {
      return NextResponse.json(
        { message: 'اسم الموظف مطلوب' },
        { status: 400 }
      );
    }
    const created = addStaffMember({
      name: String(body.name),
      email: body.email ? String(body.email) : undefined,
      role: body.role ? String(body.role) : 'TECH',
      phone: body.phone ? String(body.phone) : undefined,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || 'فشل في إضافة الموظف' },
      { status: 500 }
    );
  }
}
