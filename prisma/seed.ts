import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Indian Accounting ERP database seeding...');

  // 1. Create Default Company
  const company = await prisma.company.upsert({
    where: { id: 'abc-engineering-company-id' },
    update: {
      name: 'BALAJI CONVEYORS',
      legalName: 'BALAJI CONVEYORS',
      address: '504/4 Chinnaelasagiri, Balaji nagar, Sipcot',
      city: 'Hosur',
      state: 'Tamil Nadu',
      stateCode: '33',
      pinCode: '635 126',
      phone: '9791525307, 8870864617',
      email: 'balajiconveyors2464@gmail.com',
      website: 'https://balajiconveyors.com',
      gstin: '33AANFB9381J1Z0',
      pan: 'AANFB9381J',
      cin: 'U28110TN2020PTC345678',
      financialYear: '2026-27',
      currency: 'INR',
      inventoryValuation: 'WEIGHTED_AVERAGE',
    },
    create: {
      id: 'abc-engineering-company-id',
      name: 'BALAJI CONVEYORS',
      legalName: 'BALAJI CONVEYORS',
      address: '504/4 Chinnaelasagiri, Balaji nagar, Sipcot',
      city: 'Hosur',
      state: 'Tamil Nadu',
      stateCode: '33',
      pinCode: '635 126',
      phone: '9791525307, 8870864617',
      email: 'info@balajiconveyors.com',
      website: 'https://balajiconveyors.com',
      gstin: '33AANFB9381J1Z0',
      pan: 'AANFB9381J',
      cin: 'U28110TN2020PTC345678',
      financialYear: '2026-27',
      currency: 'INR',
      inventoryValuation: 'WEIGHTED_AVERAGE',
    },
  });
  console.log('✔ Company seeded:', company.name);

  // 2. Financial Year
  const fy = await prisma.financialYear.upsert({
    where: { id: 'fy-2026-27-id' },
    update: {},
    create: {
      id: 'fy-2026-27-id',
      companyId: company.id,
      yearName: '2026-27',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.999Z'),
      status: 'ACTIVE',
      isLocked: false,
    },
  });
  console.log('✔ Financial Year seeded:', fy.yearName);

  // 3. Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'gokulsrini062@gmail.com' },
    update: { passwordHash },
    create: {
      id: 'user-admin-id',
      companyId: company.id,
      name: 'GOKUL S (Admin)',
      email: 'gokulsrini062@gmail.com',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✔ Admin user seeded:', adminUser.email, '(Password: admin123)');

  // 4. Document Sequences
  const docTypes = [
    { docType: 'QUOTATION', prefix: 'QT-', nextNumber: 1 },
    { docType: 'SALES_ORDER', prefix: 'SO-', nextNumber: 1 },
    { docType: 'DELIVERY_CHALLAN', prefix: 'DC-', nextNumber: 1 },
    { docType: 'SALES_INVOICE', prefix: 'INV-', nextNumber: 1 },
    { docType: 'CREDIT_NOTE', prefix: 'CN-', nextNumber: 1 },
    { docType: 'RECEIPT', prefix: 'REC-', nextNumber: 1 },
    { docType: 'PURCHASE_ORDER', prefix: 'PO-', nextNumber: 1 },
    { docType: 'GOODS_RECEIPT', prefix: 'GRN-', nextNumber: 1 },
    { docType: 'PURCHASE_INVOICE', prefix: 'PINV-', nextNumber: 1 },
    { docType: 'DEBIT_NOTE', prefix: 'DN-', nextNumber: 1 },
    { docType: 'PAYMENT', prefix: 'PAY-', nextNumber: 1 },
    { docType: 'EXPENSE', prefix: 'EXP-', nextNumber: 1 },
    { docType: 'JOURNAL', prefix: 'JV-', nextNumber: 1 },
  ];

  for (const seq of docTypes) {
    await prisma.documentSequence.upsert({
      where: { id: `seq-${seq.docType}` },
      update: {},
      create: {
        id: `seq-${seq.docType}`,
        companyId: company.id,
        docType: seq.docType,
        prefix: seq.prefix,
        nextNumber: seq.nextNumber,
        padding: 5,
        fyName: '26-27',
      },
    });
  }

  // 5. Units & GST Rates & HSN Codes
  const pcsUnit = await prisma.unit.upsert({
    where: { symbol: 'pcs' },
    update: {},
    create: { id: 'unit-pcs', name: 'Piece', symbol: 'pcs' },
  });
  const kgUnit = await prisma.unit.upsert({
    where: { symbol: 'kg' },
    update: {},
    create: { id: 'unit-kg', name: 'Kilogram', symbol: 'kg' },
  });
  const hrUnit = await prisma.unit.upsert({
    where: { symbol: 'hr' },
    update: {},
    create: { id: 'unit-hr', name: 'Hour', symbol: 'hr' },
  });

  const gst18 = await prisma.gstRate.upsert({
    where: { id: 'gst-rate-18' },
    update: {},
    create: { id: 'gst-rate-18', name: '18%', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18 },
  });
  const gst12 = await prisma.gstRate.upsert({
    where: { id: 'gst-rate-12' },
    update: {},
    create: { id: 'gst-rate-12', name: '12%', rate: 12, cgstRate: 6, sgstRate: 6, igstRate: 12 },
  });
  const gst5 = await prisma.gstRate.upsert({
    where: { id: 'gst-rate-5' },
    update: {},
    create: { id: 'gst-rate-5', name: '5%', rate: 5, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5 },
  });

  const hsnSteel = await prisma.hsnCode.upsert({
    where: { code: '7208' },
    update: {},
    create: { id: 'hsn-7208', code: '7208', description: 'Flat-rolled products of iron or non-alloy steel', type: 'GOODS' },
  });
  const hsnBearing = await prisma.hsnCode.upsert({
    where: { code: '8482' },
    update: {},
    create: { id: 'hsn-8482', code: '8482', description: 'Ball or roller bearings', type: 'GOODS' },
  });
  const hsnService = await prisma.hsnCode.upsert({
    where: { code: '9983' },
    update: {},
    create: { id: 'hsn-9983', code: '9983', description: 'Other professional, technical and business services', type: 'SERVICES' },
  });

  // 6. Default Warehouses
  const mainGodown = await prisma.warehouse.upsert({
    where: { id: 'wh-main-godown' },
    update: {},
    create: {
      id: 'wh-main-godown',
      companyId: company.id,
      code: 'WH-01',
      name: 'Main Godown (Andheri)',
      address: 'Plot No. 45, MIDC, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      isDefault: true,
    },
  });

  const centralWh = await prisma.warehouse.upsert({
    where: { id: 'wh-central-bhiwandi' },
    update: {},
    create: {
      id: 'wh-central-bhiwandi',
      companyId: company.id,
      code: 'WH-02',
      name: 'Central Warehouse (Bhiwandi)',
      address: 'Logistics Park, Bhiwandi',
      city: 'Thane',
      state: 'Maharashtra',
      isDefault: false,
    },
  });

  // 7. Standard Indian Chart of Accounts
  // Groups
  const groupAssets = await prisma.accountGroup.upsert({
    where: { id: 'grp-assets' },
    update: {},
    create: { id: 'grp-assets', companyId: company.id, code: '1000', name: 'Assets', nature: 'ASSET' },
  });
  const groupCurrAssets = await prisma.accountGroup.upsert({
    where: { id: 'grp-curr-assets' },
    update: {},
    create: { id: 'grp-curr-assets', companyId: company.id, code: '1100', name: 'Current Assets', nature: 'ASSET', parentId: groupAssets.id },
  });

  const groupLiabilities = await prisma.accountGroup.upsert({
    where: { id: 'grp-liabilities' },
    update: {},
    create: { id: 'grp-liabilities', companyId: company.id, code: '2000', name: 'Liabilities', nature: 'LIABILITY' },
  });
  const groupCurrLiab = await prisma.accountGroup.upsert({
    where: { id: 'grp-curr-liab' },
    update: {},
    create: { id: 'grp-curr-liab', companyId: company.id, code: '2100', name: 'Current Liabilities', nature: 'LIABILITY', parentId: groupLiabilities.id },
  });

  const groupEquity = await prisma.accountGroup.upsert({
    where: { id: 'grp-equity' },
    update: {},
    create: { id: 'grp-equity', companyId: company.id, code: '3000', name: 'Equity & Capital', nature: 'EQUITY' },
  });

  const groupIncome = await prisma.accountGroup.upsert({
    where: { id: 'grp-income' },
    update: {},
    create: { id: 'grp-income', companyId: company.id, code: '4000', name: 'Direct & Indirect Income', nature: 'INCOME' },
  });

  const groupExpense = await prisma.accountGroup.upsert({
    where: { id: 'grp-expense' },
    update: {},
    create: { id: 'grp-expense', companyId: company.id, code: '5000', name: 'Direct & Indirect Expenses', nature: 'EXPENSE' },
  });

  // Accounts mapping
  const accountsData = [
    { id: 'acc-cash', code: '1110', name: 'Cash in Hand', groupId: groupCurrAssets.id, isSystem: true },
    { id: 'acc-bank-hdfc', code: '1120', name: 'HDFC Bank (Current A/c)', groupId: groupCurrAssets.id, isSystem: true },
    { id: 'acc-ar', code: '1130', name: 'Accounts Receivable (Sundry Debtors)', groupId: groupCurrAssets.id, isSystem: true },
    { id: 'acc-stock', code: '1140', name: 'Stock in Hand / Inventory', groupId: groupCurrAssets.id, isSystem: true },
    { id: 'acc-input-cgst', code: '1151', name: 'Input CGST A/c', groupId: groupCurrAssets.id, isSystem: true },
    { id: 'acc-input-sgst', code: '1152', name: 'Input SGST A/c', groupId: groupCurrAssets.id, isSystem: true },
    { id: 'acc-input-igst', code: '1153', name: 'Input IGST A/c', groupId: groupCurrAssets.id, isSystem: true },

    { id: 'acc-ap', code: '2110', name: 'Accounts Payable (Sundry Creditors)', groupId: groupCurrLiab.id, isSystem: true },
    { id: 'acc-output-cgst', code: '2121', name: 'Output CGST A/c', groupId: groupCurrLiab.id, isSystem: true },
    { id: 'acc-output-sgst', code: '2122', name: 'Output SGST A/c', groupId: groupCurrLiab.id, isSystem: true },
    { id: 'acc-output-igst', code: '2123', name: 'Output IGST A/c', groupId: groupCurrLiab.id, isSystem: true },

    { id: 'acc-capital', code: '3100', name: 'Share Capital / Owner Capital', groupId: groupEquity.id, isSystem: true },
    { id: 'acc-retained-earnings', code: '3200', name: 'Retained Earnings / P&L Surplus', groupId: groupEquity.id, isSystem: true },

    { id: 'acc-sales', code: '4100', name: 'Sales Account', groupId: groupIncome.id, isSystem: true },
    { id: 'acc-service-income', code: '4200', name: 'Service Income', groupId: groupIncome.id, isSystem: true },

    { id: 'acc-purchases', code: '5100', name: 'Purchase Account', groupId: groupExpense.id, isSystem: true },
    { id: 'acc-salary', code: '5200', name: 'Salary & Allowances', groupId: groupExpense.id, isSystem: false },
    { id: 'acc-rent', code: '5210', name: 'Office & Factory Rent', groupId: groupExpense.id, isSystem: false },
    { id: 'acc-electricity', code: '5220', name: 'Electricity Charges', groupId: groupExpense.id, isSystem: false },
    { id: 'acc-transport', code: '5230', name: 'Freight & Carriage Outwards', groupId: groupExpense.id, isSystem: false },
  ];

  for (const acc of accountsData) {
    await prisma.account.upsert({
      where: { id: acc.id },
      update: {},
      create: {
        id: acc.id,
        companyId: company.id,
        code: acc.code,
        name: acc.name,
        accountGroupId: acc.groupId,
        isSystem: acc.isSystem,
      },
    });
  }
  console.log('✔ Chart of Accounts seeded (Assets, Liabilities, Equity, Income, Expenses)');

  // 8. Bank Account
  await prisma.bankAccount.upsert({
    where: { id: 'bank-hdfc-01' },
    update: {
      bankName: 'IDBI BANK , HOSUR',
      accountName: 'BALAJI CONVEYORS',
      accountNumber: '0213102000024824',
      ifscCode: 'IBKL0000213',
      branch: 'Hosur Branch',
    },
    create: {
      id: 'bank-hdfc-01',
      companyId: company.id,
      bankName: 'IDBI BANK , HOSUR',
      accountName: 'BALAJI CONVEYORS',
      accountNumber: '0213102000024824',
      ifscCode: 'IBKL0000213',
      branch: 'Hosur Branch',
      accountType: 'CURRENT',
      accountId: 'acc-bank-hdfc',
      openingBalance: 500000,
      currentBalance: 500000,
    },
  });

  // 9. Customers
  const customerA = await prisma.customer.upsert({
    where: { id: 'cust-jayrat-enterprises' },
    update: {
      name: 'JAYRAT ENTERPROSES',
      legalName: 'JAYRAT ENTERPRISES',
      gstin: '33ADQPJ5205P2Z6',
      pan: 'ADQPJ5205P',
      billingAddress: 'DENKANIKOTTAI TALUK, KRISHNAGIRI',
      state: 'Tamil Nadu',
      stateCode: '33',
      pinCode: '635107',
    },
    create: {
      id: 'cust-jayrat-enterprises',
      companyId: company.id,
      customerCode: 'CUST-001',
      name: 'JAYRAT ENTERPROSES',
      legalName: 'JAYRAT ENTERPRISES',
      gstin: '33ADQPJ5205P2Z6',
      pan: 'ADQPJ5205P',
      phone: '+91 98420 12345',
      email: 'contact@jayrat.com',
      billingAddress: 'DENKANIKOTTAI TALUK, KRISHNAGIRI',
      state: 'Tamil Nadu',
      stateCode: '33',
      pinCode: '635107',
      creditLimit: 5000000,
      creditDays: 30,
      openingBalance: 0,
      contactPerson: 'Jayrat Operations',
    },
  });

  const customerB = await prisma.customer.upsert({
    where: { id: 'cust-bharat-infra' },
    update: {},
    create: {
      id: 'cust-bharat-infra',
      companyId: company.id,
      customerCode: 'CUST-002',
      name: 'Bharat Infra Corp',
      legalName: 'Bharat Infrastructure Corporation',
      gstin: '07AAACB8888B1Z2',
      pan: 'AAACB8888B',
      phone: '+91 11 2345 6789',
      email: 'billing@bharatinfra.com',
      billingAddress: 'Connaught Place, New Delhi',
      state: 'Delhi',
      stateCode: '07',
      pinCode: '110001',
      creditLimit: 1000000,
      creditDays: 45,
      openingBalance: 0,
      contactPerson: 'Sanjay Gupta',
    },
  });
  console.log('✔ Customers seeded:', customerA.name, '&', customerB.name);

  // 10. Suppliers
  const supplierA = await prisma.supplier.upsert({
    where: { id: 'supp-national-steel' },
    update: {},
    create: {
      id: 'supp-national-steel',
      companyId: company.id,
      supplierCode: 'SUPP-001',
      name: 'National Steel Traders',
      legalName: 'National Steel Traders LLP',
      gstin: '27AAACN1111C1Z3',
      pan: 'AAACN1111C',
      phone: '+91 22 2348 9900',
      email: 'sales@nationalsteel.in',
      address: 'Kalamboli Steel Market, Navi Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pinCode: '410218',
      creditDays: 30,
      openingBalance: 0,
      contactPerson: 'Ramesh Patel',
    },
  });

  const supplierB = await prisma.supplier.upsert({
    where: { id: 'supp-precision-comp' },
    update: {},
    create: {
      id: 'supp-precision-comp',
      companyId: company.id,
      supplierCode: 'SUPP-002',
      name: 'Precision Components Ltd',
      legalName: 'Precision Engineering Components Ltd',
      gstin: '24AAACP2222D1Z4',
      pan: 'AAACP2222D',
      phone: '+91 79 2658 4433',
      email: 'orders@precisioncomp.com',
      address: 'GIDC Phase 3, Ahmedabad',
      state: 'Gujarat',
      stateCode: '24',
      pinCode: '380015',
      creditDays: 30,
      openingBalance: 0,
      contactPerson: 'Amit Shah',
    },
  });
  console.log('✔ Suppliers seeded:', supplierA.name, '&', supplierB.name);

  // 11. Items
  const itemConveyor = await prisma.item.upsert({
    where: { id: 'item-conveyor-idler' },
    update: {
      salesPrice: 371420,
    },
    create: {
      id: 'item-conveyor-idler',
      companyId: company.id,
      itemCode: 'CONV-001',
      sku: 'CONV-IDLER-LEG',
      name: 'CONVEYOR (Idler Frame, Leg support)',
      description: 'CONVEYOR (Idler Frame, Leg support)',
      itemType: 'GOODS',
      unitId: pcsUnit.id,
      hsnCodeId: hsnSteel.id,
      gstRateId: gst18.id,
      purchasePrice: 250000,
      salesPrice: 371420,
      mrp: 400000,
      minStock: 5,
      maxStock: 100,
      reorderLevel: 10,
      openingStock: 20,
      openingStockValue: 5000000,
      warehouseId: mainGodown.id,
    },
  });

  const itemSteel = await prisma.item.upsert({
    where: { id: 'item-steel-rod' },
    update: {},
    create: {
      id: 'item-steel-rod',
      companyId: company.id,
      itemCode: 'ITEM-001',
      sku: 'STL-ROD-20MM',
      name: 'High Tensile Steel Rod 20mm',
      description: '20mm High Tensile Carbon Steel Rods for construction and manufacturing',
      itemType: 'GOODS',
      unitId: pcsUnit.id,
      hsnCodeId: hsnSteel.id,
      gstRateId: gst18.id,
      purchasePrice: 400,
      salesPrice: 550,
      mrp: 600,
      minStock: 20,
      maxStock: 500,
      reorderLevel: 50,
      openingStock: 100,
      openingStockValue: 40000,
      warehouseId: mainGodown.id,
    },
  });

  const itemBearing = await prisma.item.upsert({
    where: { id: 'item-industrial-bearing' },
    update: {},
    create: {
      id: 'item-industrial-bearing',
      companyId: company.id,
      itemCode: 'ITEM-002',
      sku: 'BRG-6205-ZZ',
      name: 'Deep Groove Ball Bearing 6205',
      description: 'Double shielded deep groove industrial ball bearing',
      itemType: 'GOODS',
      unitId: pcsUnit.id,
      hsnCodeId: hsnBearing.id,
      gstRateId: gst18.id,
      purchasePrice: 1200,
      salesPrice: 1800,
      mrp: 2000,
      minStock: 10,
      maxStock: 200,
      reorderLevel: 25,
      openingStock: 50,
      openingStockValue: 60000,
      warehouseId: mainGodown.id,
    },
  });

  const itemService = await prisma.item.upsert({
    where: { id: 'item-consultancy-service' },
    update: {},
    create: {
      id: 'item-consultancy-service',
      companyId: company.id,
      itemCode: 'SRV-001',
      sku: 'ENG-CONSULT',
      name: 'Engineering Design & Consultancy',
      description: 'Technical CAD modeling & structural engineering analysis service',
      itemType: 'SERVICES',
      unitId: hrUnit.id,
      hsnCodeId: hsnService.id,
      gstRateId: gst18.id,
      purchasePrice: 0,
      salesPrice: 3500,
      mrp: 3500,
      minStock: 0,
      openingStock: 0,
      openingStockValue: 0,
    },
  });

  // Create initial stock balance records for opening stocks
  await prisma.stockBalance.upsert({
    where: { itemId_warehouseId: { itemId: itemSteel.id, warehouseId: mainGodown.id } },
    update: {},
    create: {
      companyId: company.id,
      itemId: itemSteel.id,
      warehouseId: mainGodown.id,
      quantity: 100,
      averageCost: 400,
      totalValue: 40000,
    },
  });

  await prisma.stockBalance.upsert({
    where: { itemId_warehouseId: { itemId: itemBearing.id, warehouseId: mainGodown.id } },
    update: {},
    create: {
      companyId: company.id,
      itemId: itemBearing.id,
      warehouseId: mainGodown.id,
      quantity: 50,
      averageCost: 1200,
      totalValue: 60000,
    },
  });

  console.log('✔ Items and Opening Stock Balances seeded:', itemSteel.name, ',', itemBearing.name);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
