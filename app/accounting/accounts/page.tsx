'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Search, ShieldCheck } from 'lucide-react';

export default function ChartOfAccountsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/financial?type=tb')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReport(d.report);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chart of Accounts (General Ledger)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Hierarchical ledger accounts structured under Assets, Liabilities, Equity, Income, and Expenses.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading Chart of Accounts...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">GL Code</th>
                <th className="p-3">Account Name</th>
                <th className="p-3">Group Name</th>
                <th className="p-3">Nature</th>
                <th className="p-3 text-right">Current Ledger Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report?.rows?.map((row: any) => (
                <tr key={row.accountId} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-600">{row.code}</td>
                  <td className="p-3 font-bold text-slate-900">{row.name}</td>
                  <td className="p-3 text-slate-600">{row.accountGroupName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.nature === 'ASSET'
                          ? 'bg-blue-100 text-blue-800'
                          : row.nature === 'LIABILITY'
                          ? 'bg-rose-100 text-rose-800'
                          : row.nature === 'INCOME'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.nature}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{Math.abs(row.netBalance).toFixed(2)} {row.netBalance >= 0 ? 'DR' : 'CR'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
