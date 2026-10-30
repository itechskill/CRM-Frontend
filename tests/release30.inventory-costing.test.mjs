import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Inventory Costing is whitelisted and rendered for Finance, Admin, CEO and Accounts', () => {
  const app = source('src/App.jsx');
  assert.match(app, /import InventoryCostingView/);
  for (const role of ['admin', 'accountant', 'finance', 'ceo']) {
    const roleLine = app.split('\n').find(line => line.includes(`${role}: [`));
    assert.ok(roleLine?.includes('inventory_costing'), `${role} must whitelist inventory_costing`);
  }
  assert.ok((app.match(/activeTab === 'inventory_costing'/g) || []).length >= 4);
  for (const sidebar of ['src/admin/Sidebar.jsx', 'src/finance_dept/FinanceSidebar.jsx', 'src/ceo/CEOSidebar.jsx', 'src/accounts/AccountsSidebar.jsx']) {
    assert.match(source(sidebar), /id: 'inventory_costing', label: 'Inventory Costing'/, sidebar);
  }
});

test('screen separates read-only, Set cost and Admin Change cost actions', () => {
  const view = source('src/inventory_costing/InventoryCostingView.jsx');
  assert.match(view, /role === 'finance' \|\| role === 'admin'/);
  assert.match(view, /role === 'admin'/);
  assert.match(view, /Set cost/);
  assert.match(view, /Change cost/);
  assert.match(view, /Reason \(required\)/);
  assert.match(view, /View only/);
  assert.match(view, /FIFO stock batches/);
});

test('manual stock forms only expose Unit Cost to Finance and Admin', () => {
  const inventory = source('src/support/SupportInventoryView.jsx');
  assert.match(inventory, /canEditCost = \['finance', 'admin'\]/);
  assert.match(inventory, /Unit Cost \(PKR\)/);
  assert.match(inventory, /payload\.unitCostPKR/);
  assert.doesNotMatch(inventory, /payload\.unitPrice/);
});
