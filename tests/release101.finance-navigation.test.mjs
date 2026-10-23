import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, '..');

const readSource = relativePath => readFile(path.join(projectRoot, relativePath), 'utf8');

test('every Finance sidebar item is registered as a valid Finance tab', async () => {
  const [appSource, sidebarSource] = await Promise.all([
    readSource('src/App.jsx'),
    readSource('src/finance_dept/FinanceSidebar.jsx')
  ]);

  const operationsBlock = sidebarSource.match(/const operationsNav = \[([\s\S]*?)\n\s*\];/);
  assert.ok(operationsBlock, 'Finance operations navigation should be defined');
  const sidebarIds = [...operationsBlock[1].matchAll(/id:\s*'([^']+)'/g)].map(match => match[1]);

  const financeTabsBlock = appSource.match(/finance:\s*\[([^\]]+)\]/);
  assert.ok(financeTabsBlock, 'Finance valid-tab list should be defined');
  const validFinanceTabs = [...financeTabsBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]);

  for (const id of sidebarIds) {
    assert.ok(validFinanceTabs.includes(id), `Finance sidebar tab ${id} must be in the Finance valid-tab list`);
  }
});

test('Supplier PO Expenses uses one consistent Finance tab id and renderer', async () => {
  const appSource = await readSource('src/App.jsx');

  assert.match(
    appSource,
    /activeTab === 'supplier_po_expenses'\s*&&\s*<FinanceSupplierPOExpensesView/,
    'Supplier PO Expenses should render for its registered tab id'
  );
  assert.match(
    appSource,
    /allowedRoles=\{\['finance', 'admin', 'ceo'\]\}/,
    'Finance portal should remain available to Finance, Admin and CEO'
  );
});
