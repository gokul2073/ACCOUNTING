import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSalesInvoice } from '@/modules/sales/pipeline';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';

    const invoices = await db.salesInvoice.findMany({
      where: { companyId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            gstin: true,
            phone: true,
            email: true,
            billingAddress: true,
            shippingAddress: true,
            state: true,
            stateCode: true,
            pinCode: true,
          },
        },
        items: {
          select: {
            id: true,
            itemId: true,
            itemCode: true,
            description: true,
            hsnCode: true,
            quantity: true,
            unit: true,
            rate: true,
            discount: true,
            taxableValue: true,
            gstRate: true,
            cgstAmount: true,
            sgstAmount: true,
            igstAmount: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return NextResponse.json(
      { success: true, invoices },
      { headers: { 'Cache-Control': 'public, max-age=3, stale-while-revalidate=15' } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const invoice = await createSalesInvoice({
      companyId: body.companyId || 'abc-engineering-company-id',
      customerId: body.customerId,
      warehouseId: body.warehouseId || 'wh-main-godown',
      invoiceNumber: body.invoiceNumber || undefined,
      invoiceDate: new Date(body.invoiceDate || Date.now()),
      dueDate: new Date(body.dueDate || Date.now()),
      poNumber: body.poNumber || undefined,
      poDate: body.poDate ? new Date(body.poDate) : undefined,
      vehicleNo: body.vehicleNo || undefined,
      eWayBillNo: body.eWayBillNo || undefined,
      netWeight: body.netWeight || undefined,
      transportCharge: body.transportCharge ? parseFloat(body.transportCharge) : undefined,
      transportGstRate: body.transportGstRate !== undefined ? parseFloat(body.transportGstRate) : undefined,
      notes: body.notes,
      items: body.items,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Sales Invoice Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create sales invoice' }, { status: 400 });
  }
}
