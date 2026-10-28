import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, '..');
const readSource = relativePath => readFile(path.join(projectRoot, relativePath), 'utf8');

test('Supplier PO expenses expose separate add and edit/delete capabilities', async () => {
  const source = await readSource('src/components/SupplierPOExpenses.jsx');
  assert.match(source, /baseCanAdd = canAddProp/);
  assert.match(source, /baseCanEditDelete = canEditDeleteProp/);
  assert.doesNotMatch(source, /\['support', 'finance', 'admin'\]\.includes\(role\)/);
  assert.match(source, /\['finance', 'admin'\]\.includes\(role\)/);
  assert.match(source, /costingStatus = record\?\.costingStatus \|\| 'Incomplete'/);
  assert.match(source, /Costing is Completed and locked\. Admin must authorize a change\./);
  assert.match(source, /expenses\/costing-status/);
  assert.match(source, /\{canEditDelete &&/);
  assert.match(source, /\{\(editingId \? canEditDelete : canAdd\) &&/);
  assert.doesNotMatch(source, /effectiveReadOnly/);
});

test('Admin and CEO can open Supplier PO Expenses and the Admin notification link selects that page', async () => {
  const [app, adminSidebar, ceoSidebar, notifications] = await Promise.all([
    readSource('src/App.jsx'),
    readSource('src/admin/Sidebar.jsx'),
    readSource('src/ceo/CEOSidebar.jsx'),
    readSource('src/components/NotificationDropdown.jsx')
  ]);
  assert.match(adminSidebar, /id:\s*'supplier_po_expenses'/);
  assert.match(ceoSidebar, /id:\s*'supplier_po_expenses'/);
  assert.match(app, /admin:\s*\[[^\]]*'supplier_po_expenses'/);
  assert.match(app, /ceo:\s*\[[^\]]*'supplier_po_expenses'/);
  assert.match(app, /activeTab === 'supplier_po_expenses'\s*&&\s*<FinanceSupplierPOExpensesView/g);
  assert.match(notifications, /notif\.link === '\/admin\/supplier-po-expenses'/);
  assert.match(notifications, /detail:\s*\{ role: 'admin', tab: 'supplier_po_expenses' \}/);
  assert.match(app, /addEventListener\('crm:navigate-tab'/);
});

test('the six new activity types have readable labels in both My Activities views', async () => {
  const sources = await Promise.all([
    readSource('src/employee/sales/SalesActivitiesView.jsx'),
    readSource('src/sales_manager/SalesManagerActivitiesView.jsx')
  ]);
  const types = [
    'Quotation Converted to Customer PO',
    'Customer PO Converted to Product File',
    'Product File Converted to Sales Order',
    'Order Sent to Finance',
    'Invoice Finalized',
    'Inventory IN'
  ];
  for (const type of types) {
    for (const source of sources) assert.ok(source.includes(type), `${type} should be rendered by each My Activities view`);
  }
});
