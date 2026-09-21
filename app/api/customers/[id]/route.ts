import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedCustomer = await db.customer.update({
      where: { id },
      data: {
        name: body.name,
        legalName: body.legalName,
        customerCode: body.customerCode,
        gstin: body.gstin,
        pan: body.pan,
        phone: body.phone,
        email: body.email,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        state: body.state,
        stateCode: body.stateCode,
        pinCode: body.pinCode,
        creditLimit: Number(body.creditLimit || 0),
        creditDays: Number(body.creditDays || 30),
        contactPerson: body.contactPerson,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json({ success: true, customer: updatedCustomer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Customer deactivated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
