import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Price Requests uses the dedicated labelled-user endpoint and Name - Label format', async () => {
  const source = await read('src/price_requests/PriceRequestsView.jsx');
  assert.match(source, /\/api\/price-requests\/labelled-users/);
  assert.doesNotMatch(source, /apiRequest\('\/api\/users'\)/);
  assert.match(source, /user\.label \|\| user\.priceRequestLabel/);
});

test('Admin user editor supports an optional validated Price Request label', async () => {
  const source = await read('src/admin/UsersView.jsx');
  assert.match(source, /\/price-request-label/);
  assert.match(source, /maxLength=\{80\}/);
});

test('salesperson and manager dashboards render the same eleven always-visible own-record tiles', async () => {
  const employee = await read('src/employee/EmployeeDashboard.jsx');
  const manager = await read('src/sales_manager/SalesManagerDashboard.jsx');
  for (const source of [employee, manager]) {
    assert.match(source, /type="month"/);
    assert.match(source, /dashboardTiles/);
    const labels = ['Price Requested', 'Price Received', 'Quotation Sent', 'Sale Order', 'Invoiced', 'Safe Receivable', 'Due Receivable', 'GP Target', 'Remaining Target', 'Above 45 days', 'GP Achieved'];
    for (const label of labels) {
      assert.match(source, new RegExp(`label: '${label}'`));
    }
    const positions = labels.map(label => source.indexOf(`label: '${label}'`));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
    assert.match(source, /note: '1-30 days'/);
    assert.match(source, /note: '31-45 days, grace period'/);
    assert.match(source, /\/api\/target-performance\/me\?month=/);
    assert.match(source, /targetPerformance\?\.visible/);
    assert.match(source, /salaryCents \|\| 0/);
    assert.match(source, /Target not set/);
    assert.match(source, /Hidden by Admin/);
    assert.match(source, /label: 'GP Achieved'.*amount: targetIsSet \? money\(achievedGP\) : targetUnavailableText/);
    assert.doesNotMatch(source, /Achieved GP:/);
    assert.doesNotMatch(source, /label: 'Receivable'/);
    assert.doesNotMatch(source, /label: 'Overdue'/);
    assert.doesNotMatch(source, /100% achieved/i);
    assert.doesNotMatch(source, /Sales Progress/);
  }
});

test('dashboard API calls carry the selected month and count tiles navigate to matching own-record lists', async () => {
  const employee = await read('src/employee/EmployeeDashboard.jsx');
  const manager = await read('src/sales_manager/SalesManagerDashboard.jsx');
  assert.match(employee, /\/api\/sales-employee\/stats\?month=\$\{selectedMonth\}/);
  assert.match(manager, /\/api\/sales-manager\/dashboard-stats\?month=\$\{selectedMonth\}/);
  for (const route of ['price_requests', 'my_quotations', 'my_orders', 'my_invoices']) {
    assert.match(employee, new RegExp(`go\\('${route}'\\)`));
  }
  for (const route of ['price_requests', 'my_quotations', 'orders', 'invoices']) {
    assert.match(manager, new RegExp(`go\\('${route}'\\)`));
  }
});
