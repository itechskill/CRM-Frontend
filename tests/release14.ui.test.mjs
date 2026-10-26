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

test('salesperson and manager dashboards render the same nine always-visible own-record tiles', async () => {
  const employee = await read('src/employee/EmployeeDashboard.jsx');
  const manager = await read('src/sales_manager/SalesManagerDashboard.jsx');
  for (const source of [employee, manager]) {
    assert.match(source, /type="month"/);
    assert.match(source, /dashboardTiles/);
    for (const label of ['Price Requested', 'Price Received', 'Quotation Sent', 'Sale Order', 'Invoiced', 'Receivable', 'Overdue', 'GP Target', 'Remaining Target']) {
      assert.match(source, new RegExp(`label: '${label}'`));
    }
    assert.match(source, /As of today/);
    assert.match(source, /\/api\/target-performance\/me\?month=/);
    assert.match(source, /targetPerformance\?\.visible/);
    assert.match(source, /salaryCents \|\| 0/);
    assert.match(source, /Target not set/);
    assert.match(source, /Achieved GP:/);
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
