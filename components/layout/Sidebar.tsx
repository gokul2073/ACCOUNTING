'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  FileText,
  ShoppingCart,
  Receipt,
  Warehouse,
  BookOpen,
  PieChart,
  Landmark,
  Settings,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sales Invoices', href: '/sales/invoices', icon: FileText, badge: 'Sales' },
  { name: 'Quotations & Orders', href: '/sales/orders', icon: Receipt },
  { name: 'Purchase Bills', href: '/purchase/invoices', icon: ShoppingCart, badge: 'Purchase' },
  { name: 'Customers', href: '/masters/customers', icon: Users },
  { name: 'Suppliers', href: '/masters/suppliers', icon: Building2 },
  { name: 'Items / Products', href: '/masters/items', icon: Package },
  { name: 'Chart of Accounts', href: '/accounting/accounts', icon: BookOpen },
  { name: 'Financial Reports', href: '/reports/financial', icon: PieChart },
  { name: 'GST Register', href: '/gst/summary', icon: ShieldAlert },
  { name: 'Company Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            BC
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">Balaji Conveyors ERP</h1>
            <p className="text-[11px] text-blue-400 font-medium">Indian GST Accounting</p>
          </div>
        </div>
      </div>

      {/* Financial Year Indicator Card */}
      <div className="mx-4 my-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Financial Year</p>
          <p className="text-xs font-semibold text-emerald-400">FY 2026-27 (Active)</p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Locked: No
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 py-2 custom-scrollbar">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-semibold text-slate-300">Balaji Conveyors</p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
      </div>
    </aside>
  );
}
