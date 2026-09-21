'use client';

import React, { useEffect, useState } from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, ShieldCheck, Wallet, CreditCard } from 'lucide-react';

export default function BankingPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/banking')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBankAccounts(d.bankAccounts || []);
          setReceipts(d.receipts || []);
          setPayments(d.payments || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + (b.currentBalance || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-blue-600" />
            Banking & Cash Register
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage company bank accounts, track incoming customer receipts and outgoing vendor payments.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Bank Reconciliation Active</span>
        </div>
      </div>

      {/* Account Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg border border-slate-700 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Total Liquid Balance</p>
              <h3 className="text-2xl font-extrabold mt-1 font-mono">
                ₹{totalBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">FY 2026-27 Active Accounts</p>
        </div>

        {bankAccounts.map((acc) => (
          <div key={acc.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                  {acc.accountType || 'CURRENT'} A/C
                </span>
                <CreditCard className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mt-2">{acc.bankName}</h4>
              <p className="text-xs text-slate-500 font-mono">A/C: {acc.accountNumber}</p>
              <p className="text-[11px] text-slate-500 font-mono">IFSC: {acc.ifscCode}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Balance</span>
              <span className="font-mono font-bold text-emerald-700 text-base">
                ₹{acc.currentBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Transaction Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Receipts Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Recent Customer Receipts
            </h3>
            <span className="text-xs text-slate-500 font-mono">Total: {receipts.length}</span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Loading receipts...</p>
          ) : receipts.length === 0 ? (
            <p className="text-xs text-slate-400">No receipts recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {receipts.map((r) => (
                <div key={r.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{r.customer?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{r.receiptNumber} • {r.paymentMode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-emerald-600">+₹{r.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">{new Date(r.receiptDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vendor Payments Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Recent Vendor Payments
            </h3>
            <span className="text-xs text-slate-500 font-mono">Total: {payments.length}</span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Loading payments...</p>
          ) : payments.length === 0 ? (
            <p className="text-xs text-slate-400">No payments recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <div key={p.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{p.supplier?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{p.paymentNumber} • {p.paymentMode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-rose-600">-₹{p.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
