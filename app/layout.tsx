import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Balaji Conveyors ERP — Complete Indian Accounting, GST & Inventory Software',
  description: 'Enterprise Accounting, GST Tax Invoicing, Inventory Ledger & Financial Statements software for Balaji Conveyors.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100 text-slate-900 antialiased min-h-screen flex`}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
