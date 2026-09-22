import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { convertSalesOrderToInvoice } from '@/modules/sales/pipeline';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const salesOrderId = params.id;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty if no extra inputs passed
    }

    const salesOrder = await db.salesOrder.findUnique({ where: { id: salesOrderId } });
    if (!salesOrder) {
      return NextResponse.json({ error: 'Sales Order not found' }, { status: 404 });
    }

    const companyId = body.companyId || salesOrder.companyId;

    const invoice = await convertSalesOrderToInvoice(salesOrderId, companyId, {
      invoiceNumber: body.invoiceNumber?.trim() || undefined,
      poNumber: body.poNumber || undefined,
      poDate: body.poDate ? new Date(body.poDate) : undefined,
      vehicleNo: body.vehicleNo || undefined,
      eWayBillNo: body.eWayBillNo || undefined,
      netWeight: body.netWeight || undefined,
      transportCharge: body.transportCharge ? parseFloat(body.transportCharge) : undefined,
      transportGstRate: body.transportGstRate !== undefined ? parseFloat(body.transportGstRate) : undefined,
    });
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Sales Order Conversion Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to convert sales order' }, { status: 500 });
  }
}


