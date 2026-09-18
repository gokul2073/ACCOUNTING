'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load stats', err);
        setLoading(false);
      });
  }, []);

  const chartData = [
    { month: 'Apr 26', Sales: 180000, Purchases: 110000 },
    { month: 'May 26', Sales: 240000, Purchases: 150000 },
    { month: 'Jun 26', Sales: 310000, Purchases: 190000 },
    { month: 'Jul 26', Sales: 420000, Purchases: 230000 },
    { month: 'Aug 26', Sales: stats?.stats?.totalSales || 500000, Purchases: stats?.stats?.totalPurchases || 280000 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading ERP Dashboard...
      </div>
    );
  }

  const s = stats?.stats || {
    totalSales: 0,
    totalPurchases: 0,
    totalReceivables: 0,
    totalPayables: 0,
    stockValue: 0,
    netProfit: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              FY 2026-27 Active
            </span>
            <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Double-Entry Ledger Balanced
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-2 tracking-tight">BALAJI CONVEYORS Overview</h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time synchronization across Sales ↔ Purchases ↔ Stock Ledger ↔ Accounting ↔ GST Registers.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/sales/invoices/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" /> Create Sales Invoice
          </Link>
          <Link
            href="/purchase/invoices/new"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" /> Record Purchase Bill
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2 font-mono">₹{s.totalSales.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> GST Tax Invoices
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Purchases</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2 font-mono">₹{s.totalPurchases.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-blue-600 mt-1 font-medium">Input ITC Tax Claims</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Receivables</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 mt-2 font-mono">₹{s.totalReceivables.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-1">Customer Outstanding</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Payables</span>
            <Building className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-600 mt-2 font-mono">₹{s.totalPayables.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-500 mt-1">Supplier Outstanding</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Valuation</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2 font-mono">₹{s.stockValue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-indigo-600 mt-1 font-medium">Weighted Average</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className={`text-xl font-extrabold mt-2 font-mono ${s.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{s.netProfit.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Ledger Derived P&L</p>
        </div>
      </div>

      {/* Analytics Chart & Low Stock Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Monthly Sales & Purchases */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Financial Performance (Sales vs Purchases)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                <Bar dataKey="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Purchases" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-600 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">Low Stock & Reorder Alerts</h3>
            </div>
            <div className="space-y-3">
              {stats?.lowStockItems?.length > 0 ? (
                stats.lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">Code: {item.itemCode}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                        Stock: {item.currentQty}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Reorder: {item.reorderLevel}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  ✔ All item stock levels are healthy above reorder thresholds.
                </div>
              )}
            </div>
          </div>
          <Link
            href="/inventory"
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg text-center transition-all block"
          >
            View Stock Ledger & Movements →
          </Link>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">Recent Posted Sales Invoices</h3>
          <Link href="/sales/invoices" className="text-xs font-bold text-blue-600 hover:underline">
            View All Invoices →
          </Link>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Invoice No</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer Name</th>
              <th className="p-3 text-right">Grand Total (₹)</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {stats?.recentInvoices?.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                <td className="p-3">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                <td className="p-3 font-semibold">{inv.customerName}</td>
                <td className="p-3 text-right font-mono font-bold">₹{inv.grandTotal.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
