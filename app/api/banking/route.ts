import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';

    const bankAccounts = await db.bankAccount.findMany({
      where: { companyId },
      include: { account: true },
    });

    const receipts = await db.receipt.findMany({
      where: { companyId },
      include: { customer: true },
      take: 10,
      orderBy: { receiptDate: 'desc' },
    });

    const payments = await db.payment.findMany({
      where: { companyId },
      include: { supplier: true },
      take: 10,
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ success: true, bankAccounts, receipts, payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
