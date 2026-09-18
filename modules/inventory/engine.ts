import { db } from '@/lib/db';

export interface StockMovementInput {
  companyId: string;
  itemId: string;
  warehouseId: string;
  transactionDate: Date;
  transactionType:
    | 'OPENING'
    | 'PURCHASE'
    | 'PURCHASE_RETURN'
    | 'SALES'
    | 'SALES_RETURN'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'ADJUSTMENT_IN'
    | 'ADJUSTMENT_OUT';
  referenceType?: string;
  referenceId?: string;
  quantityIn: number;
  quantityOut: number;
  rate: number;
  batchNumber?: string;
  serialNumber?: string;
}

/**
 * Record stock movement transaction and update stock balance atomically
 */
export async function recordStockMovement(input: StockMovementInput) {
  const value = Number(((input.quantityIn || input.quantityOut) * input.rate).toFixed(2));

  // 1. Create Stock Transaction Entry
  const transaction = await db.stockTransaction.create({
    data: {
      companyId: input.companyId,
      itemId: input.itemId,
      warehouseId: input.warehouseId,
      transactionDate: input.transactionDate,
      transactionType: input.transactionType,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      quantityIn: input.quantityIn,
      quantityOut: input.quantityOut,
      rate: input.rate,
      value,
      batchNumber: input.batchNumber,
      serialNumber: input.serialNumber,
    },
  });

  // 2. Fetch or initialize Stock Balance for item & warehouse
  const existingBalance = await db.stockBalance.findUnique({
    where: {
      itemId_warehouseId: {
        itemId: input.itemId,
        warehouseId: input.warehouseId,
      },
    },
  });

  let currentQty = existingBalance ? existingBalance.quantity : 0;
  let currentTotalValue = existingBalance ? existingBalance.totalValue : 0;

  let newQty = currentQty + input.quantityIn - input.quantityOut;
  let newTotalValue = currentTotalValue;
  let newAvgCost = existingBalance ? existingBalance.averageCost : input.rate;

  if (input.quantityIn > 0) {
    // Adding stock: Increase total value by purchase cost, recalculate weighted average cost
    newTotalValue = currentTotalValue + value;
    newAvgCost = newQty > 0 ? newTotalValue / newQty : input.rate;
  } else if (input.quantityOut > 0) {
    // Removing stock: Decrease total value at weighted average cost
    newTotalValue = Math.max(0, currentTotalValue - input.quantityOut * newAvgCost);
  }

  // Prevent negative balance if negative stock is disabled
  if (newQty < 0) {
    console.warn(`[Inventory Warning] Stock quantity for item ${input.itemId} is negative: ${newQty}`);
  }

  await db.stockBalance.upsert({
    where: {
      itemId_warehouseId: {
        itemId: input.itemId,
        warehouseId: input.warehouseId,
      },
    },
    update: {
      quantity: Number(newQty.toFixed(2)),
      averageCost: Number(newAvgCost.toFixed(2)),
      totalValue: Number(newTotalValue.toFixed(2)),
    },
    create: {
      companyId: input.companyId,
      itemId: input.itemId,
      warehouseId: input.warehouseId,
      quantity: Number(newQty.toFixed(2)),
      averageCost: Number(newAvgCost.toFixed(2)),
      totalValue: Number(newTotalValue.toFixed(2)),
    },
  });

  return transaction;
}

/**
 * Perform Stock Transfer between Warehouse A and Warehouse B
 */
export async function transferStock(params: {
  companyId: string;
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  rate: number;
  transferDate: Date;
  referenceNumber: string;
}) {
  // 1. Transfer Out from Source Warehouse
  await recordStockMovement({
    companyId: params.companyId,
    itemId: params.itemId,
    warehouseId: params.fromWarehouseId,
    transactionDate: params.transferDate,
    transactionType: 'TRANSFER_OUT',
    referenceType: 'StockTransfer',
    referenceId: params.referenceNumber,
    quantityIn: 0,
    quantityOut: params.quantity,
    rate: params.rate,
  });

  // 2. Transfer In to Destination Warehouse
  await recordStockMovement({
    companyId: params.companyId,
    itemId: params.itemId,
    warehouseId: params.toWarehouseId,
    transactionDate: params.transferDate,
    transactionType: 'TRANSFER_IN',
    referenceType: 'StockTransfer',
    referenceId: params.referenceNumber,
    quantityIn: params.quantity,
    quantityOut: 0,
    rate: params.rate,
  });

  return true;
}
