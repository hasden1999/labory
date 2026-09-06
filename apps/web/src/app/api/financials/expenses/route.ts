import { NextResponse } from 'next/server';
import { getStore, addExpense } from '../../../../lib/serverStore';

export async function GET() {
  try {
    const store = getStore();
    return NextResponse.json(store.expenses || []);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'فشل في جلب سجل المصاريف' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, amount, category } = body || {};

    if (!description || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { message: 'الرجاء إدخال تفاصيل ومبلغ المصروف بشكل صحيح' },
        { status: 400 }
      );
    }

    const expense = addExpense({
      description,
      amount: Number(amount),
      category,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'خطأ أثناء تسجيل المصروف' },
      { status: 500 }
    );
  }
}
