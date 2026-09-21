import { db } from '@/lib/db';

export interface AccountBalanceRow {
  accountId: string;
  code: string;
  name: string;
  accountGroupName: string;
  nature: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  debit: number;
  credit: number;
  netBalance: number; // positive = DR, negative = CR
}

/**
 * Trial Balance Report Generator
 */
export async function getTrialBalance(companyId: string) {
  const [accounts, journalSums] = await Promise.all([
    db.account.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        openingBalance: true,
        openingBalanceType: true,
        accountGroup: {
          select: {
            name: true,
            nature: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    }),
    db.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          companyId,
          isPosted: true,
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    }),
  ]);

  const sumsMap = new Map<string, { debit: number; credit: number }>();
  for (const js of journalSums) {
    sumsMap.set(js.accountId, {
      debit: js._sum.debit || 0,
      credit: js._sum.credit || 0,
    });
  }

  const rows: AccountBalanceRow[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (const acc of accounts) {
    const js = sumsMap.get(acc.id);
    let sumDebit = (acc.openingBalanceType === 'DR' ? acc.openingBalance : 0) + (js?.debit || 0);
    let sumCredit = (acc.openingBalanceType === 'CR' ? acc.openingBalance : 0) + (js?.credit || 0);

    sumDebit = Number(sumDebit.toFixed(2));
    sumCredit = Number(sumCredit.toFixed(2));

    const net = Number((sumDebit - sumCredit).toFixed(2));

    let displayDebit = 0;
    let displayCredit = 0;

    if (net > 0) displayDebit = net;
    else displayCredit = Math.abs(net);

    totalDebit += displayDebit;
    totalCredit += displayCredit;

    rows.push({
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      accountGroupName: acc.accountGroup.name,
      nature: acc.accountGroup.nature as any,
      debit: displayDebit,
      credit: displayCredit,
      netBalance: net,
    });
  }

  totalDebit = Number(totalDebit.toFixed(2));
  totalCredit = Number(totalCredit.toFixed(2));
  const diff = Number(Math.abs(totalDebit - totalCredit).toFixed(2));

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced: diff <= 0.05,
    diff,
  };
}

/**
 * Profit & Loss Report Generator
 */
export async function getProfitAndLoss(companyId: string, existingTb?: Awaited<ReturnType<typeof getTrialBalance>>) {
  const tb = existingTb || (await getTrialBalance(companyId));

  const incomeAccounts = tb.rows.filter((r) => r.nature === 'INCOME');
  const expenseAccounts = tb.rows.filter((r) => r.nature === 'EXPENSE');

  const totalIncome = Number(incomeAccounts.reduce((sum, r) => sum + (r.credit - r.debit), 0).toFixed(2));
  const totalExpense = Number(expenseAccounts.reduce((sum, r) => sum + (r.debit - r.credit), 0).toFixed(2));

  const netProfit = Number((totalIncome - totalExpense).toFixed(2));

  return {
    incomeAccounts,
    expenseAccounts,
    totalIncome,
    totalExpense,
    netProfit,
  };
}

/**
 * Balance Sheet Report Generator
 */
export async function getBalanceSheet(companyId: string, existingTb?: Awaited<ReturnType<typeof getTrialBalance>>) {
  const tb = existingTb || (await getTrialBalance(companyId));
  const pnl = await getProfitAndLoss(companyId, tb);

  const assetAccounts = tb.rows.filter((r) => r.nature === 'ASSET');
  const liabilityAccounts = tb.rows.filter((r) => r.nature === 'LIABILITY');
  const equityAccounts = tb.rows.filter((r) => r.nature === 'EQUITY');

  const totalAssets = Number(assetAccounts.reduce((sum, r) => sum + (r.debit - r.credit), 0).toFixed(2));
  const totalLiabilities = Number(liabilityAccounts.reduce((sum, r) => sum + (r.credit - r.debit), 0).toFixed(2));
  const baseEquity = Number(equityAccounts.reduce((sum, r) => sum + (r.credit - r.debit), 0).toFixed(2));

  // Add Net Profit to Equity
  const totalEquity = Number((baseEquity + pnl.netProfit).toFixed(2));
  const totalLiabilitiesAndEquity = Number((totalLiabilities + totalEquity).toFixed(2));

  const diff = Number(Math.abs(totalAssets - totalLiabilitiesAndEquity).toFixed(2));

  return {
    assetAccounts,
    liabilityAccounts,
    equityAccounts,
    totalAssets,
    totalLiabilities,
    baseEquity,
    netProfit: pnl.netProfit,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced: diff <= 0.05,
    diff,
  };
}

/**
 * Customer Receivables Ageing Report Generator
 */
export async function getCustomerAgeingReport(companyId: string) {
  const invoices = await db.salesInvoice.findMany({
    where: { companyId, status: 'POSTED', paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
    include: { customer: true },
  });

  const now = new Date();
  const reportMap: Record<string, { customerName: string; current: number; d1_30: number; d31_60: number; d61_90: number; d90Plus: number; total: number }> = {};

  for (const inv of invoices) {
    const custId = inv.customerId;
    if (!reportMap[custId]) {
      reportMap[custId] = { customerName: inv.customer.name, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90Plus: 0, total: 0 };
    }

    const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
    const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
    const balance = inv.balanceAmount > 0 ? inv.balanceAmount : inv.grandTotal - inv.paidAmount;

    if (diffDays <= 0) reportMap[custId].current += balance;
    else if (diffDays <= 30) reportMap[custId].d1_30 += balance;
    else if (diffDays <= 60) reportMap[custId].d31_60 += balance;
    else if (diffDays <= 90) reportMap[custId].d61_90 += balance;
    else reportMap[custId].d90Plus += balance;

    reportMap[custId].total += balance;
  }

  return Object.values(reportMap);
}
