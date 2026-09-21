import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await db.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedSupplier = await db.supplier.update({
      where: { id },
      data: {
        name: body.name,
        legalName: body.legalName,
        supplierCode: body.supplierCode,
        gstin: body.gstin,
        pan: body.pan,
        phone: body.phone,
        email: body.email,
        address: body.address,
        state: body.state,
        stateCode: body.stateCode,
        pinCode: body.pinCode,
        creditDays: Number(body.creditDays || 30),
        contactPerson: body.contactPerson,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json({ success: true, supplier: updatedSupplier });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Supplier deactivated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
