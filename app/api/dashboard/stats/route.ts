import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBalanceSheet } from '@/modules/reports/financial';

export async function GET() {
  try {
    const companyId = 'abc-engineering-company-id'; // Default company

    // Run database aggregations concurrently in parallel for sub-millisecond execution
    const [salesAgg, purchaseAgg, stockAgg, bs, items, recentInvoices] = await Promise.all([
      db.salesInvoice.aggregate({
        where: { companyId, status: 'POSTED' },
        _sum: { grandTotal: true, balanceAmount: true },
      }),
      db.purchaseInvoice.aggregate({
        where: { companyId, status: 'POSTED' },
        _sum: { grandTotal: true, balanceAmount: true },
      }),
      db.stockBalance.aggregate({
        where: { companyId },
        _sum: { totalValue: true },
      }),
      getBalanceSheet(companyId),
      db.item.findMany({
        where: { companyId, isActive: true },
        select: {
          id: true,
          name: true,
          itemCode: true,
          reorderLevel: true,
          stockBalances: { select: { quantity: true } },
        },
      }),
      db.salesInvoice.findMany({
        where: { companyId, status: 'POSTED' },
        take: 5,
        orderBy: { invoiceDate: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          grandTotal: true,
          paymentStatus: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

    const totalSales = salesAgg._sum.grandTotal || 0;
    const totalPurchases = purchaseAgg._sum.grandTotal || 0;
    const totalReceivables = salesAgg._sum.balanceAmount || 0;
    const totalPayables = purchaseAgg._sum.balanceAmount || 0;
    const stockValue = stockAgg._sum.totalValue || 0;

    const lowStockItems = items
      .map((item) => {
        const currentQty = item.stockBalances.reduce((s, sb) => s + sb.quantity, 0);
        return {
          id: item.id,
          name: item.name,
          itemCode: item.itemCode,
          currentQty,
          reorderLevel: item.reorderLevel,
        };
      })
      .filter((item) => item.currentQty <= item.reorderLevel);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalSales: Number(totalSales.toFixed(2)),
          totalPurchases: Number(totalPurchases.toFixed(2)),
          totalReceivables: Number(totalReceivables.toFixed(2)),
          totalPayables: Number(totalPayables.toFixed(2)),
          stockValue: Number(stockValue.toFixed(2)),
          netProfit: bs.netProfit,
          totalAssets: bs.totalAssets,
        },
        lowStockItems,
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          customerName: inv.customer.name,
          grandTotal: inv.grandTotal,
          paymentStatus: inv.paymentStatus,
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
        },
      }
    );
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
