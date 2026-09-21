'use client';

import React from 'react';
import { Search, Plus, Bell, Building, CheckCircle2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Left: Search & Company Context */}
      <div className="flex items-center gap-6">
        <div className="relative w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Invoices, Customers, Items, POs (Ctrl+K)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50/80 border border-blue-100 rounded-md">
          <Building className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-blue-950">BALAJI CONVEYORS</span>
          <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded font-bold">
            GSTIN: 33AANFB9381J1Z0
          </span>
        </div>
      </div>

      {/* Right: Quick Actions & User Profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (window.location.href = '/sales/invoices/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm shadow-blue-500/20 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Sales Invoice</span>
        </button>

        <button
          onClick={() => (window.location.href = '/purchase/invoices/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-md shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Purchase Bill</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md relative transition-all">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 border border-white" />
        </button>

        <div className="flex items-center gap-2 pl-2">
          <p className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
            <CheckCircle2 className="w-3 h-3" /> System Balanced
          </p>
        </div>
      </div>
    </header>
  );
}
