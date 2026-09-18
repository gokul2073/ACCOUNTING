'use client';

import React, { useEffect, useState } from 'react';
import { Warehouse, Package, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.items);
        setLoading(false);
      });
  }, []);

  const totalValuation = items.reduce((sum, item) => {
    const qty = item.currentStock || 0;
    const rate = item.purchasePrice || 0;
    return sum + qty * rate;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Summary & Inventory Valuation</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock ledger derived from purchase receipts, sales invoices, and stock transfers.
          </p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-right">
          <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Total Inventory Value</p>
          <p className="text-lg font-extrabold text-indigo-950 font-mono">₹{totalValuation.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-blue-600" />
            Main Godown (Andheri) — Stock Balance Ledger
          </h3>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Weighted Average Cost Engine
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading stock balances...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Item Code</th>
                <th className="p-3">Product Name</th>
                <th className="p-3 text-center">Unit</th>
                <th className="p-3 text-right">Avg Cost / Purchase (₹)</th>
                <th className="p-3 text-right">Sales Price (₹)</th>
                <th className="p-3 text-center">In-Stock Qty</th>
                <th className="p-3 text-right">Total Valuation (₹)</th>
                <th className="p-3 text-center">Stock Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const qty = item.currentStock || 0;
                const value = qty * item.purchasePrice;
                const isLow = qty <= item.reorderLevel;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-600">{item.itemCode}</td>
                    <td className="p-3 font-bold text-slate-900">{item.name}</td>
                    <td className="p-3 text-center font-semibold">{item.unit?.symbol}</td>
                    <td className="p-3 text-right font-mono">₹{item.purchasePrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">₹{item.salesPrice.toFixed(2)}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900">{qty}</td>
                    <td className="p-3 text-right font-mono font-bold text-indigo-900">₹{value.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isLow ? 'REORDER NEEDED' : 'HEALTHY'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
