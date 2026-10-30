import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = path => readFile(resolve(root, path), 'utf8');

test('Finance Supplier PO lists expose GRN and costing status', async () => {
  const [expenses, payables] = await Promise.all([
    source('src/finance_dept/FinanceSupplierPOExpensesView.jsx'),
    source('src/purchaser/local/LocalPurchaserPayablesView.jsx')
  ]);
  assert.match(expenses, /'GRN', 'Costing status'/);
  assert.match(expenses, /supportVerifiedGrn\?\.grnNumber/);
  assert.match(expenses, /status === 'Completed'/);
  assert.match(payables, /showCostingStatus/);
  assert.match(payables, /supplierPO\?\.costingStatus/);
});

test('Completed costing requires the exact confirmation and supports cancel, Escape and outside click', async () => {
  const modal = await source('src/components/SupplierPOExpenses.jsx');
  assert.match(modal, /Are you sure you want to mark this GRN as Completed\? Once completed, it will be locked against further changes\./);
  assert.match(modal, />Cancel</);
  assert.match(modal, />\{statusBusy \? 'Completing/);
  assert.match(modal, /event\.key === 'Escape'/);
  assert.match(modal, /event\.stopPropagation\(\); setConfirmComplete\(false\)/);
  assert.match(modal, /disabled=\{statusBusy\}/);
  assert.match(modal, /setCostingStatus\('Completed', true\)/);
});

test('Finance invoices show COGS, Gross Profit, Costing and explicit gap/review states', async () => {
  const invoices = await source('src/finance_dept/FinanceInvoicesView.jsx');
  for (const label of ['COGS', 'Gross Profit', 'Costing', 'Invoice amount (excl. tax)', 'Cost not recorded', 'Provisional', 'Review']) {
    assert.ok(invoices.includes(label), label);
  }
  assert.match(invoices, /financeCosting/);
  assert.match(invoices, /supplierPOCostingStatus/);
});

test('Quotation uses manual discount and tax rate, read-only automatic tax, and no preset buttons', async () => {
  const quotations = await source('src/employee/sales/SalesQuotationsView.jsx');
  const financials = await source('src/utils/quotationFinancials.js');
  const form = quotations.slice(quotations.indexOf('{/* Section 2B:'), quotations.indexOf('{/* Comprehensive Live Calculation'));
  assert.match(form, /Discount Amount \(PKR\)/);
  assert.doesNotMatch(form, /Discount \(%\)/);
  assert.match(form, /Tax Rate \(%\)/);
  assert.match(form, /Tax Amount \(PKR\)/);
  assert.match(form, /readOnly/);
  assert.doesNotMatch(form, /Presets:/);
  assert.doesNotMatch(form, /\[0, 5, 10, 15/);
  assert.match(quotations, /calculateQuotationFinancials/);
  assert.match(financials, /taxableAmount = roundMoney\(Math\.max\(0, totalAmount - normalizedDiscount\)\)/);
});

test('Proforma tax controls remain unchanged', async () => {
  const proforma = await source('src/employee/sales/SalesProformaInvoicesView.jsx');
  assert.match(proforma, /Presets:/);
});
