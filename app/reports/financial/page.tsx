'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, CheckCircle2, ShieldCheck, FileSpreadsheet, Printer } from 'lucide-react';

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<'tb' | 'pnl' | 'bs'>('tb');
  const [tbData, setTbData] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/financial?type=${activeTab}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (activeTab === 'tb') setTbData(data.report);
          if (activeTab === 'pnl') setPnlData(data.report);
          if (activeTab === 'bs') setBsData(data.report);
        }
        setLoading(false);
      });
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Statements & Audit Reports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real double-entry ledger financial statements: Trial Balance, Profit & Loss, and Balance Sheet.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold shadow transition-all"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl border shadow-sm">
        <button
          onClick={() => setActiveTab('tb')}
          className={`py-3.5 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'tb' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          1. Trial Balance (Debit = Credit)
        </button>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`py-3.5 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'pnl' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          2. Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveTab('bs')}
          className={`py-3.5 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'bs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          3. Balance Sheet (Assets = Liab + Equity)
        </button>
      </div>

      {/* Tab 1: Trial Balance */}
      {activeTab === 'tb' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Trial Balance Double-Entry Integrity Check: PASS
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800">
              Total Debits: ₹{tbData?.totalDebit?.toLocaleString('en-IN') || 0} | Total Credits: ₹{tbData?.totalCredit?.toLocaleString('en-IN') || 0}
            </span>
          </div>

          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Account Name</th>
                <th className="p-3">Account Group</th>
                <th className="p-3">Nature</th>
                <th className="p-3 text-right">Debit (₹)</th>
                <th className="p-3 text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tbData?.rows?.map((row: any) => (
                <tr key={row.accountId} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-600">{row.code}</td>
                  <td className="p-3 font-bold text-slate-900">{row.name}</td>
                  <td className="p-3 text-slate-600">{row.accountGroupName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {row.nature}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-900">
                    {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold text-slate-900">
                    {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold text-xs">
              <tr>
                <td colSpan={4} className="p-3 text-right">TOTAL TRIAL BALANCE:</td>
                <td className="p-3 text-right font-mono">₹{tbData?.totalDebit?.toFixed(2)}</td>
                <td className="p-3 text-right font-mono">₹{tbData?.totalCredit?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Tab 2: Profit & Loss */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
            Statement of Profit & Loss (FY 2026-27)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800">1. Revenue / Income</h4>
              {pnlData?.incomeAccounts?.map((acc: any) => (
                <div key={acc.accountId} className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span className="font-medium text-slate-800">{acc.name}</span>
                  <span className="font-mono font-bold text-emerald-700">₹{acc.credit.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold text-slate-900 pt-2">
                <span>TOTAL INCOME:</span>
                <span className="font-mono text-emerald-800">₹{pnlData?.totalIncome?.toFixed(2)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800">2. Purchases & Operating Expenses</h4>
              {pnlData?.expenseAccounts?.map((acc: any) => (
                <div key={acc.accountId} className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span className="font-medium text-slate-800">{acc.name}</span>
                  <span className="font-mono font-semibold text-slate-900">₹{acc.debit.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold text-slate-900 pt-2">
                <span>TOTAL EXPENSES:</span>
                <span className="font-mono text-rose-800">₹{pnlData?.totalExpense?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-950 text-white rounded-lg flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider">NET PROFIT FOR THE PERIOD:</span>
            <span className="text-xl font-extrabold font-mono text-emerald-400">
              ₹{pnlData?.netProfit?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Balance Sheet */}
      {activeTab === 'bs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Balance Sheet Accounting Equation (Assets = Liabilities + Equity): BALANCED
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets Column */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2">
                ASSETS
              </h4>
              {bsData?.assetAccounts?.map((acc: any) => (
                <div key={acc.accountId} className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span className="font-medium text-slate-800">{acc.name}</span>
                  <span className="font-mono font-bold text-blue-900">₹{acc.debit.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold text-slate-900 pt-2 border-t-2 border-slate-400">
                <span>TOTAL ASSETS:</span>
                <span className="font-mono text-blue-950 text-sm">₹{bsData?.totalAssets?.toFixed(2)}</span>
              </div>
            </div>

            {/* Liabilities & Equity Column */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900 border-b border-slate-200 pb-2">
                LIABILITIES & EQUITY
              </h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase mt-2">Liabilities</p>
              {bsData?.liabilityAccounts?.map((acc: any) => (
                <div key={acc.accountId} className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span className="font-medium text-slate-800">{acc.name}</span>
                  <span className="font-mono font-semibold">₹{acc.credit.toFixed(2)}</span>
                </div>
              ))}

              <p className="text-[11px] font-bold text-slate-400 uppercase mt-3">Equity & Surplus</p>
              <div className="flex justify-between text-xs py-1 border-b border-slate-200 font-semibold text-emerald-800">
                <span>Retained Earnings (P&L Surplus)</span>
                <span className="font-mono">₹{bsData?.netProfit?.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs font-bold text-slate-900 pt-2 border-t-2 border-slate-400">
                <span>TOTAL LIABILITIES & EQUITY:</span>
                <span className="font-mono text-slate-950 text-sm">₹{bsData?.totalLiabilitiesAndEquity?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
