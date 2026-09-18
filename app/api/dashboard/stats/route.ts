import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBalanceSheet } from '@/modules/reports/financial';

export async function GET() {
  try {
    const companyId = 'abc-engineering-company-id'; // Default company

    // Run database queries concurrently in parallel for maximum speed
    const [salesInvoices, purchaseInvoices, stockBalances, bs, items, recentInvoices] = await Promise.all([
      db.salesInvoice.findMany({ where: { companyId, status: 'POSTED' } }),
      db.purchaseInvoice.findMany({ where: { companyId, status: 'POSTED' } }),
      db.stockBalance.findMany({ where: { companyId } }),
      getBalanceSheet(companyId),
      db.item.findMany({ where: { companyId, isActive: true }, include: { stockBalances: true } }),
      db.salesInvoice.findMany({
        where: { companyId, status: 'POSTED' },
        take: 5,
        orderBy: { invoiceDate: 'desc' },
        include: { customer: true },
      }),
    ]);

    const totalSales = salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalReceivables = salesInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    const totalPayables = purchaseInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    const stockValue = stockBalances.reduce((sum, sb) => sum + sb.totalValue, 0);

    const lowStockItems = items
      .filter((item) => {
        const currentQty = item.stockBalances.reduce((s, sb) => s + sb.quantity, 0);
        return currentQty <= item.reorderLevel;
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        itemCode: item.itemCode,
        currentQty: item.stockBalances.reduce((s, sb) => s + sb.quantity, 0),
        reorderLevel: item.reorderLevel,
      }));

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
