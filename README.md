# Antigravity ERP — Indian Accounting, GST, Invoicing & Inventory Software

A full-stack, modular, production-ready **Accounting + GST + Invoicing + Inventory + Financial Management ERP System** built for Indian businesses.

---

## Technical Stack
- **Framework**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database & ORM**: PostgreSQL / SQLite with Prisma ORM
- **Analytics**: Recharts
- **Validation & Auth**: Zod, bcryptjs, jsonwebtoken
- **Testing**: Vitest

---

## Core Business Modules

1. **Double-Entry Accounting Engine** (`modules/accounting/engine.ts`)
   - Enforces `Total Debit == Total Credit` on every posted transaction.
   - Generates balanced journals for Sales, Purchases, Receipts, Payments, and Expenses.

2. **Inventory Stock Ledger Engine** (`modules/inventory/engine.ts`)
   - Transactional stock movement ledger (`stock_transactions`).
   - Weighted Average inventory valuation & Warehouse stock transfers.

3. **Indian GST Calculation Engine** (`modules/gst/engine.ts`)
   - Auto-detects Intra-State (CGST + SGST) vs Inter-State (IGST) tax split based on Place of Supply.
   - HSN summary & GSTR-1 / GSTR-3B tax registers.

4. **Sales & Purchase Pipelines**
   - Quotation $\rightarrow$ Sales Order $\rightarrow$ Delivery Challan $\rightarrow$ Tax Invoice $\rightarrow$ Receipt.
   - Purchase Order $\rightarrow$ Goods Receipt $\rightarrow$ Purchase Invoice $\rightarrow$ Payment.

5. **Financial Statements & Audit Reports**
   - Trial Balance (`Debit = Credit` verification)
   - Statement of Profit & Loss (`COGS, Operating Expenses, Net Profit`)
   - Balance Sheet (`Assets = Liabilities + Equity` assertion)

---

## Local Quick Start Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Schema Sync**:
   ```bash
   npx prisma db push
   ```

3. **Seed Indian Master Data** (Default Company, Chart of Accounts, HSN Codes, Items, Customers, Suppliers):
   ```bash
   npx tsx prisma/seed.ts
   ```

4. **Run Unit Test Suite**:
   ```bash
   npx vitest run
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.