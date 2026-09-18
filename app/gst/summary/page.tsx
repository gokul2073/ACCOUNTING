'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

export default function GstSummaryPage() {
  const [gstTxns, setGstTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales/invoices')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setGstTxns(d.invoices);
        setLoading(false);
      });
  }, []);

  const totalOutputCgst = gstTxns.reduce((s, i) => s + (i.cgstTotal || 0), 0);
  const totalOutputSgst = gstTxns.reduce((s, i) => s + (i.sgstTotal || 0), 0);
  const totalOutputIgst = gstTxns.reduce((s, i) => s + (i.igstTotal || 0), 0);
  const totalOutputTax = totalOutputCgst + totalOutputSgst + totalOutputIgst;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">GST Tax Summary & Returns Register</h2>
          <p className="text-xs text-slate-500 mt-1">
            Indian Goods & Services Tax (GST) output tax liability, input tax credit, and HSN summary.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Export GSTR-1 Excel
          </button>
        </div>
      </div>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Output CGST (9%)</span>
          <p className="text-xl font-extrabold text-blue-900 mt-1 font-mono">₹{totalOutputCgst.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Output SGST (9%)</span>
          <p className="text-xl font-extrabold text-blue-900 mt-1 font-mono">₹{totalOutputSgst.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Output IGST (18%)</span>
          <p className="text-xl font-extrabold text-purple-900 mt-1 font-mono">₹{totalOutputIgst.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Output Tax Liability</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">₹{totalOutputTax.toFixed(2)}</p>
        </div>
      </div>

      {/* GSTR-1 Sales Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            GSTR-1 Outward Supplies Tax Register
          </h3>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Invoice No</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer GSTIN</th>
              <th className="p-3">Place of Supply</th>
              <th className="p-3 text-right">Taxable (₹)</th>
              <th className="p-3 text-right">CGST (₹)</th>
              <th className="p-3 text-right">SGST (₹)</th>
              <th className="p-3 text-right">IGST (₹)</th>
              <th className="p-3 text-right">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {gstTxns.map((inv) => {
              const tax = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;
              return (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                  <td className="p-3">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 font-mono text-slate-600">{inv.customer?.gstin || 'URP'}</td>
                  <td className="p-3">{inv.placeOfSupply}</td>
                  <td className="p-3 text-right font-mono">₹{inv.taxableAmount.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono">₹{inv.cgstTotal.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono">₹{inv.sgstTotal.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono">₹{inv.igstTotal.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">₹{tax.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
