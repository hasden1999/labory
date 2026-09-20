import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

export async function GET() {
  try {
    const store = getStore();
    const debtors = store.debtors || [];
    const transactions = store.debtTransactions || [];

    const result = debtors.map((d) => {
      let totalDebt = 0;
      let totalPaid = 0;
      transactions.filter((t) => t.debtorId === d.id).forEach((t) => {
        if (t.type === 'DEBT') totalDebt += t.amount;
        if (t.type === 'PAYMENT') totalPaid += t.amount;
      });
      const balance = Math.max(0, totalDebt - totalPaid);
      return {
        ...d,
        totalDebt,
        totalPaid,
        balance,
        transactions: transactions.filter((t) => t.debtorId === d.id),
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'فشل جلب الذمم والديون' }, { status: 500 });
  }
}
