import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Release 15 dashboards show the exact requested tile labels and month selectors', async () => {
  const [support, local, global] = await Promise.all([
    read('src/support/SupportDashboard.jsx'),
    read('src/purchaser/local/LocalPurchaserDashboard.jsx'),
    read('src/purchaser/global/GlobalPurchaserDashboard.jsx')
  ]);
  for (const label of ['Sale Order Received', 'DN Created', 'GRN Input', 'Expiry Date Notification', 'Ticket Received', 'Ticket Resolved']) {
    assert.match(support, new RegExp(label));
  }
  for (const label of ['Sale Order Received', 'SO Stock', 'PO Issued']) assert.match(local, new RegExp(label));
  for (const label of ['Sale Order Received', 'PO Issued', 'Sent to Logistic']) assert.match(global, new RegExp(label));
  for (const source of [support, local, global]) {
    assert.match(source, /type="month"/);
    assert.match(source, /sales-dashboard-nine-tile/);
  }
  assert.match(global, /missingExchangeRateCount/);
  assert.match(local, /amountCents/);
  assert.match(support, /grnInput\?\.total/);
});

test('Support Tickets navigation and form are wired to the dedicated API', async () => {
  const [app, sidebar, tickets, deliveryNotes] = await Promise.all([
    read('src/App.jsx'),
    read('src/support/SupportSidebar.jsx'),
    read('src/support/SupportTicketsView.jsx'),
    read('src/support/SupportDeliveryNotesView.jsx')
  ]);
  assert.match(sidebar, /id: 'tickets', label: 'Tickets'/);
  assert.match(app, /activeTab === 'tickets'/);
  assert.match(app, /SupportTicketsView currentUser=/);
  assert.match(tickets, /deliveryNoteNumber/);
  assert.match(tickets, /\/api\/support-tickets/);
  assert.match(tickets, /currentUser\?\.role === 'support'/);
  assert.doesNotMatch(tickets, /<option>Pending<\/option>/);
  assert.match(deliveryNotes, /Expiry Date \(Optional\)/);
  assert.match(deliveryNotes, /delivery-notes\/\$\{dn\._id\}\/expiry/);
});
