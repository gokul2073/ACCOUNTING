import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';

    const items = await db.item.findMany({
      where: { companyId, isActive: true },
      include: {
        unit: true,
        gstRate: true,
        hsnCode: true,
        stockBalances: true,
      },
      orderBy: { name: 'asc' },
    });

    const formattedItems = items.map((item) => {
      const currentStock = item.stockBalances.reduce((sum, sb) => sum + sb.quantity, 0);
      return {
        ...item,
        currentStock,
      };
    });

    return NextResponse.json({ success: true, items: formattedItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = await db.item.create({
      data: {
        companyId: body.companyId || 'abc-engineering-company-id',
        itemCode: body.itemCode || `ITEM-${Date.now().toString().slice(-4)}`,
        sku: body.sku,
        name: body.name,
        description: body.description,
        itemType: body.itemType || 'GOODS',
        unitId: body.unitId || 'unit-pcs',
        hsnCodeId: body.hsnCodeId || 'hsn-7208',
        gstRateId: body.gstRateId || 'gst-rate-18',
        purchasePrice: Number(body.purchasePrice || 0),
        salesPrice: Number(body.salesPrice || 0),
        mrp: Number(body.mrp || 0),
        reorderLevel: Number(body.reorderLevel || 10),
        openingStock: Number(body.openingStock || 0),
        warehouseId: body.warehouseId || 'wh-main-godown',
      },
    });

    if (body.openingStock > 0 && body.itemType === 'GOODS') {
      await db.stockBalance.create({
        data: {
          companyId: item.companyId,
          itemId: item.id,
          warehouseId: item.warehouseId || 'wh-main-godown',
          quantity: Number(body.openingStock),
          averageCost: Number(body.purchasePrice || 0),
          totalValue: Number(body.openingStock) * Number(body.purchasePrice || 0),
        },
      });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
