import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { COMPANY_OPTIONS } from '../src/utils/companies.js';
import { createDeliveryNotePdf } from '../src/utils/deliveryNotePdf.js';
import { createInvoicePdf } from '../src/utils/invoicePdf.js';
import { createReceiptVoucherPdf } from '../src/utils/receiptVoucherPdf.js';

const frontendRoot = resolve(import.meta.dirname, '..');
const assetLoader = async path => {
  const bytes = await readFile(resolve(frontendRoot, 'public', path.replace(/^\//, '')));
  return `data:image/png;base64,${bytes.toString('base64')}`;
};
const imageCount = doc => Object.keys(doc.internal.collections?.addImage_images || {}).length;
const manyItems = Array.from({ length: 55 }, (_, index) => ({
  partNumber: `PN-${index + 1}`, description: `Multi-page product description ${index + 1}`,
  demand: 1, quantity: 1, unit: 'pcs', unitPrice: 100, lineTotal: 100
}));

test('all four companies render letterheads on multi-page Delivery Notes and finalized invoices', async () => {
  for (const company of COMPANY_OPTIONS) {
    const order = { orderNumber: 'SO-R25', issuingCompany: { code: company.code, legalName: company.legalName } };
    const dn = await createDeliveryNotePdf({
      deliveryNoteNumber: 'DN-R25', clientName: 'Customer', salesOrder: order, items: manyItems
    }, { assetLoader, showPrices: false });
    assert.ok(dn.getNumberOfPages() > 1);
    assert.ok(imageCount(dn) >= 2);
    const finalized = await createInvoicePdf({
      invoiceNumber: 'INV-R25', clientName: 'Customer', salesOrderId: order, items: manyItems,
      subtotal: 5500, tax: 0, amount: 5500, status: 'Finalized', isDraft: false
    }, { assetLoader });
    assert.ok(finalized.getNumberOfPages() > 1);
    assert.ok(imageCount(finalized) >= 2);
  }
});

test('draft invoices use a plain DRAFT layout and legacy Delivery Notes retain the no-company fallback', async () => {
  const company = COMPANY_OPTIONS[0];
  const draft = await createInvoicePdf({
    invoiceNumber: 'INV-DRAFT', clientName: 'Draft Customer',
    salesOrderId: { issuingCompany: { code: company.code, legalName: company.legalName } },
    items: [{ description: 'Draft item', quantity: 1, unitPrice: 100, total: 100 }],
    amount: 100, status: 'Draft', isDraft: true
  }, { assetLoader });
  assert.equal(imageCount(draft), 0);
  const legacy = await createDeliveryNotePdf({
    deliveryNoteNumber: 'DN-LEGACY', clientName: 'Legacy Customer',
    items: [{ description: 'Legacy item', quantity: 1 }]
  }, { assetLoader });
  assert.equal(imageCount(legacy), 0);
});

test('Finance Receive Payment wiring opens the reused form and exposes RV list/details/download UI', async () => {
  const [app, header, payments] = await Promise.all([
    readFile(resolve(frontendRoot, 'src/App.jsx'), 'utf8'),
    readFile(resolve(frontendRoot, 'src/finance_dept/FinanceHeader.jsx'), 'utf8'),
    readFile(resolve(frontendRoot, 'src/finance_dept/FinancePaymentsView.jsx'), 'utf8')
  ]);
  assert.match(header, /Receive Payment/);
  assert.match(header, /onReceivePayment/);
  assert.match(app, /financeReceivePaymentSignal/);
  assert.match(app, /openCreateSignal=/);
  assert.match(payments, /if \(openCreateSignal > 0\) openCreateModal\(\)/);
  assert.match(payments, /receiptVoucherNumber/);
  assert.match(payments, /Download RV/);
  assert.match(payments, /Payment Reference/);
  assert.match(payments, /method: 'POST'/);
});

test('target visibility explains OFF state and Receipt Voucher PDF includes required fields', async () => {
  const [adminTarget, employeeDashboard, managerDashboard] = await Promise.all([
    readFile(resolve(frontendRoot, 'src/target_performance/AdminTargetPerformanceView.jsx'), 'utf8'),
    readFile(resolve(frontendRoot, 'src/employee/EmployeeDashboard.jsx'), 'utf8'),
    readFile(resolve(frontendRoot, 'src/sales_manager/SalesManagerDashboard.jsx'), 'utf8')
  ]);
  assert.match(adminTarget, /Current state:/);
  assert.match(adminTarget, /currently OFF/);
  assert.match(employeeDashboard, /Hidden by Admin/);
  assert.match(managerDashboard, /Hidden by Admin/);
  const voucher = await createReceiptVoucherPdf({
    receiptVoucherNumber: 'RV-000001', customerName: 'Customer', amount: 100,
    paymentMethod: 'Bank Transfer', reference: 'BANK-1', invoiceNumber: 'INV-1',
    createdBy: { fullName: 'Finance User' }
  }, { assetLoader });
  assert.equal(voucher.getNumberOfPages(), 1);
});
