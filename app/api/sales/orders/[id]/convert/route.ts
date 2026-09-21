import { NextRequest, NextResponse } from 'next/server';
import { convertSalesOrderToInvoice } from '@/modules/sales/pipeline';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const salesOrderId = params.id;
    const companyId = 'abc-engineering-company-id';

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty if no extra inputs passed
    }

    const invoice = await convertSalesOrderToInvoice(salesOrderId, companyId, {
      poNumber: body.poNumber || undefined,
      poDate: body.poDate ? new Date(body.poDate) : undefined,
      vehicleNo: body.vehicleNo || undefined,
      eWayBillNo: body.eWayBillNo || undefined,
      netWeight: body.netWeight || undefined,
    });
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Sales Order Conversion Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to convert sales order' }, { status: 400 });
  }
}

