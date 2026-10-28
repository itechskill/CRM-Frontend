import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Support Receive Goods no longer renders or submits supplier purchase expenses', async () => {
  const support = await read('src/support/SupportOrdersView.jsx');
  assert.doesNotMatch(support, /ExpenseDraftPanel/);
  assert.doesNotMatch(support, /expenses:\s*\[\]/);
  assert.doesNotMatch(support, /Optional supplier purchase expenses/);
});

test('Finance expense window shows GRNs, two costing status boxes, locking and re-open history', async () => {
  const expenses = await read('src/components/SupplierPOExpenses.jsx');
  assert.match(expenses, /GRN number\(s\)/);
  assert.match(expenses, /\['Incomplete', 'Completed'\]\.map/);
  assert.match(expenses, /status === 'Incomplete'/);
  assert.match(expenses, /Reason for re-opening costing/);
  assert.match(expenses, /Expense and costing history/);
  assert.doesNotMatch(expenses, /export function ExpenseDraftPanel/);
});

test('Accounts dashboard keeps its header/filter and renders only the requested three ordered step cards', async () => {
  const dashboard = await read('src/accounts/AccountsDashboard.jsx');
  const labels = ['Total Delivery Notes Received', 'Draft Invoices Created', 'Total Value of Draft Invoices'];
  let previous = -1;
  for (const label of labels) {
    const position = dashboard.indexOf(label);
    assert.ok(position > previous, `${label} should follow the previous card`);
    previous = position;
  }
  assert.match(dashboard, /Awaiting draft invoice:/);
  assert.match(dashboard, /Filter Period:/);
  assert.match(dashboard, /Accounts &amp; Invoicing Dashboard/);
  assert.doesNotMatch(dashboard, />Orders Ready</);
  assert.doesNotMatch(dashboard, /Invoice Management & Finance Handoff/);
  assert.match(dashboard, /key: 'dnsReceived'/);
  assert.match(dashboard, /key: 'draftsCreated'/);
  assert.match(dashboard, /key: 'pendingAmount'/);
});
