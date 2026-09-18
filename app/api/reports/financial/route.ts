import { NextRequest, NextResponse } from 'next/server';
import { getTrialBalance, getProfitAndLoss, getBalanceSheet } from '@/modules/reports/financial';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';
    const type = searchParams.get('type') || 'tb'; // tb, pnl, bs

    if (type === 'pnl') {
      const pnl = await getProfitAndLoss(companyId);
      return NextResponse.json({ success: true, report: pnl });
    }

    if (type === 'bs') {
      const bs = await getBalanceSheet(companyId);
      return NextResponse.json({ success: true, report: bs });
    }

    const tb = await getTrialBalance(companyId);
    return NextResponse.json({ success: true, report: tb });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
