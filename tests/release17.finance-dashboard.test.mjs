import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Finance dashboard renders the eleven tiles in the requested 4/4/3 row order', async () => {
  const dashboard = await read('src/finance_dept/FinanceDashboard.jsx');
  const labels = [
    'SO',
    'Local PO Issued',
    'Global PO Issued',
    'Local GRN Input',
    'Global GRN Input',
    'Delivery Note',
    'Total Invoices Created',
    'Total Invoices Allocated',
    'Receivable within due date',
    'Safe period after due date',
    'Overdue'
  ];
  let previous = -1;
  for (const label of labels) {
    const position = dashboard.indexOf(`label="${label}"`);
    assert.ok(position > previous, `${label} should follow the previous tile`);
    previous = position;
  }
  assert.equal((dashboard.match(/<div className="sales-dashboard-nine-grid/g) || []).length, 3);
  assert.equal((dashboard.match(/finance-dashboard-row-four/g) || []).length, 2);
  assert.match(dashboard, /label="Receivable within due date" subtitle="1-30 days"/);
  assert.match(dashboard, /label="Safe period after due date" subtitle="31-45 days"/);
  assert.match(dashboard, /label="Overdue" subtitle="Above 45 days"/);
  assert.match(dashboard, /value=\{tiles\.invoicesAllocated\}/);
});

test('Finance dashboard uses month metrics, cents, missing-rate notes and count-only operational tiles', async () => {
  const dashboard = await read('src/finance_dept/FinanceDashboard.jsx');
  assert.match(dashboard, /type="month"/);
  assert.match(dashboard, /\/api\/finance\/dashboard-stats\?month=\$\{selectedMonth\}/);
  assert.match(dashboard, /Number\(cents \|\| 0\) \/ 100/);
  assert.match(dashboard, /rate missing:/);
  assert.match(dashboard, /label="Local GRN Input"[^\n]+amount=\{false\}/);
  assert.match(dashboard, /label="Global GRN Input"[^\n]+amount=\{false\}/);
  assert.match(dashboard, /label="Delivery Note"[^\n]+amount=\{false\}/);
});

test('Finance navigation remains available from the sidebar and App view switches', async () => {
  const [sidebar, app] = await Promise.all([
    read('src/finance_dept/FinanceSidebar.jsx'),
    read('src/App.jsx')
  ]);
  for (const id of ['overdue_approval', 'clear_orders', 'finance_invoices', 'finance_payments', 'finance_receivables', 'supplier_po_expenses', 'finance_reports']) {
    assert.match(sidebar, new RegExp(`id: '${id}'`));
    assert.match(app, new RegExp(`activeTab === '${id}'|activeTab === '.*' \\|\\| activeTab === '${id}'`));
  }
});
