import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveDocumentLines } from '../src/utils/documentPartNumbers.js';

const source = relative => readFile(new URL(`../${relative}`, import.meta.url), 'utf8');

test('Accounts draft edit requests name Finance while Finance drafts are direct and finalized edits remain CEO-controlled', async () => {
  const [accounts, finance, controlled, modal, config, financeSidebar, app] = await Promise.all([
    source('src/accounts/AccountsInvoicesView.jsx'), source('src/finance_dept/FinanceInvoicesView.jsx'),
    source('src/components/ControlledEditButton.jsx'), source('src/components/EditRequestModal.jsx'),
    source('src/config/documentTypes.js'), source('src/finance_dept/FinanceSidebar.jsx'), source('src/App.jsx')
  ]);
  assert.match(accounts, /documentType=\{isDraft \? 'Draft Invoice' : 'Final Invoice'\}/);
  assert.match(accounts, /ControlledEditButton/);
  assert.match(config, /DRAFT_INVOICE[\s\S]*allowedRoles: \['finance', 'admin', 'ceo'\]/);
  assert.match(finance, /InvoiceEditModal/);
  assert.match(finance, /documentType=\{isFinalized \? 'Final Invoice' : 'Draft Invoice'\}/);
  assert.match(controlled, /approverLabel.*Finance.*CEO/);
  assert.match(modal, /Submit Request to \$\{approverLabel\}/);
  assert.match(financeSidebar, /id: 'edit_requests'.*Invoice Edit Requests/);
  assert.match(app, /reviewerLabel="Finance"/);
});

test('invoice edit resolver pre-fills an old blank line from its linked source and never substitutes SKU', () => {
  const invoice = {
    items: [{ description: 'Fortigate 120G', partNumber: '', sku: 'FG-120G' }],
    salesOrderId: { items: [{ description: 'Fortigate 120G', partNumber: '120G-001', sku: 'FG-120G' }] }
  };
  const resolved = resolveDocumentLines(invoice);
  assert.equal(resolved[0].partNumber, '120G-001');
  assert.notEqual(resolved[0].partNumber, 'FG-120G');
});

test('Order Tracker role, sidebar, whitelist, read-only views and document actions are wired', async () => {
  const [users, roleConfig, app, sidebar, view] = await Promise.all([
    source('src/admin/UsersView.jsx'), source('src/config/roleConfig.js'), source('src/App.jsx'),
    source('src/order_tracker/OrderTrackerSidebar.jsx'), source('src/order_tracker/OrderTrackerView.jsx')
  ]);
  assert.match(users, /Order Tracker \(View Only\).*order_tracker/);
  assert.match(roleConfig, /order_tracker:[\s\S]*defaultTab: 'order_tracker'/);
  assert.match(app, /order_tracker: \['order_tracker', 'notifications', 'profile'\]/);
  assert.match(app, /effectiveRole === 'order_tracker'/);
  for (const id of ['order_tracker', 'notifications', 'profile']) assert.match(sidebar, new RegExp(`id: '${id}'`));
  for (const label of ['Orders', 'Quotations', 'Price Requests', 'Customer POs', 'Product Files', 'Sales Orders', 'Supplier POs', 'GRNs', 'Delivery Notes', 'Shipments', 'Support Tickets', 'Invoices', 'Payments / RVs', 'Inventory']) assert.match(view, new RegExp(label));
  assert.match(view, /Current department/i);
  assert.match(view, /Why it is there/i);
  assert.match(view, /Complete timeline/);
  assert.match(view, /View \/ Download document/);
  assert.doesNotMatch(view, /method:\s*['"](?:POST|PUT|PATCH|DELETE)/);
});

test('Order Tracker screen exposes payment status and monetary totals but no costing, GP, salary, expenses or exchange-rate UI', async () => {
  const view = await source('src/order_tracker/OrderTrackerView.jsx');
  assert.match(view, /Payment/);
  assert.match(view, /PKR/);
  assert.doesNotMatch(view, /COGS|Gross Profit|Target Performance|salary|expense|exchange rate/i);
});
