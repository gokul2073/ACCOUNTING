import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await db.item.findUnique({
      where: { id },
      include: {
        unit: true,
        gstRate: true,
        hsnCode: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedItem = await db.item.update({
      where: { id },
      data: {
        name: body.name,
        itemCode: body.itemCode,
        sku: body.sku,
        description: body.description,
        itemType: body.itemType,
        unitId: body.unitId,
        hsnCodeId: body.hsnCodeId,
        gstRateId: body.gstRateId,
        purchasePrice: Number(body.purchasePrice || 0),
        salesPrice: Number(body.salesPrice || 0),
        mrp: Number(body.mrp || 0),
        minStock: Number(body.minStock || 0),
        reorderLevel: Number(body.reorderLevel || 0),
        openingStock: Number(body.openingStock || 0),
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    // Update manual stock balance if openingStock / manual stock is modified
    if (body.openingStock !== undefined) {
      const warehouseId = updatedItem.warehouseId || 'wh-main-godown';
      await db.stockBalance.upsert({
        where: {
          itemId_warehouseId: {
            itemId: updatedItem.id,
            warehouseId,
          },
        },
        update: {
          quantity: Number(body.openingStock),
          averageCost: Number(body.purchasePrice || 0),
          totalValue: Number(body.openingStock) * Number(body.purchasePrice || 0),
        },
        create: {
          companyId: updatedItem.companyId,
          itemId: updatedItem.id,
          warehouseId,
          quantity: Number(body.openingStock),
          averageCost: Number(body.purchasePrice || 0),
          totalValue: Number(body.openingStock) * Number(body.purchasePrice || 0),
        },
      });
    }

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.item.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Item deactivated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
