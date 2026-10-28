import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('quotation UI and PDF do not display the internal file number while search still uses it', async () => {
  const [view, pdf] = await Promise.all([
    read('src/employee/sales/SalesQuotationsView.jsx'),
    read('src/utils/quotationPdf.js')
  ]);

  assert.match(view, /q\.fileNo && q\.fileNo\.toLowerCase\(\)\.includes\(term\)/);
  for (const source of [view, pdf]) {
    assert.doesNotMatch(source, /File-No#/);
    assert.doesNotMatch(source, /Product File #:/);
    assert.doesNotMatch(source, />File:\s*\{/);
  }
});

test('Local and Global purchaser PO screens expose no Supplier PO expense controls', async () => {
  const [local, global] = await Promise.all([
    read('src/purchaser/local/LocalPurchaserPOsView.jsx'),
    read('src/purchaser/global/GlobalPurchaserPOsView.jsx')
  ]);

  for (const source of [local, global]) {
    assert.doesNotMatch(source, /SupplierPOExpensesModal/);
    assert.doesNotMatch(source, />Expenses</);
    assert.doesNotMatch(source, /expensePo/);
  }
});

test('Finance and Admin retain expense editing, CEO remains read-only, and Support/purchaser add is disabled', async () => {
  const [component, app, financeSidebar, adminSidebar, ceoSidebar] = await Promise.all([
    read('src/components/SupplierPOExpenses.jsx'),
    read('src/App.jsx'),
    read('src/finance_dept/FinanceSidebar.jsx'),
    read('src/admin/Sidebar.jsx'),
    read('src/ceo/CEOSidebar.jsx')
  ]);

  assert.match(component, /\['finance', 'admin'\]\.includes\(role\)/);
  assert.doesNotMatch(component, /\['support', 'finance', 'admin'\]\.includes\(role\)/);
  assert.doesNotMatch(component, /\['support', 'finance', 'purchaser', 'admin'\]/);
  assert.match(app, /activeTab === 'supplier_po_expenses'\s*&&\s*<FinanceSupplierPOExpensesView/g);
  for (const sidebar of [financeSidebar, adminSidebar, ceoSidebar]) {
    assert.match(sidebar, /id: 'supplier_po_expenses'/);
  }
});
