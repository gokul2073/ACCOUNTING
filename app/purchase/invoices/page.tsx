'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ShoppingCart, CheckCircle } from 'lucide-react';

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/purchases/invoices')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.invoices);
        }
        setLoading(false);
      });
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.supplierInvoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplier?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Bills & Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">
            Record supplier bills, track Input Tax Credit (ITC), updates inventory stock, and manage payables.
          </p>
        </div>
        <Link
          href="/purchase/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Purchase Bill</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Bill No or Supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Bills: {filteredInvoices.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading purchase bills...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Bill No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3 text-right">Taxable (₹)</th>
                <th className="p-3 text-right">Input GST (₹)</th>
                <th className="p-3 text-right">Grand Total (₹)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.map((inv) => {
                const inputTax = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{inv.supplierInvoiceNo}</td>
                    <td className="p-3">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-semibold text-slate-900">{inv.supplier?.name}</td>
                    <td className="p-3 font-mono text-slate-500">{inv.supplier?.gstin || 'URP'}</td>
                    <td className="p-3 text-right font-mono">₹{inv.taxableAmount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-blue-600 font-semibold">₹{inputTax.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">₹{inv.grandTotal.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        POSTED
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
