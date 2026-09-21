import { NextRequest, NextResponse } from 'next/server';
import { convertQuotationToSalesOrder } from '@/modules/sales/pipeline';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const quotationId = params.id;
    const companyId = 'abc-engineering-company-id';

    const salesOrder = await convertQuotationToSalesOrder(quotationId, companyId);
    return NextResponse.json({ success: true, salesOrder });
  } catch (error: any) {
    console.error('Quotation Conversion Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to convert quotation' }, { status: 400 });
  }
}
