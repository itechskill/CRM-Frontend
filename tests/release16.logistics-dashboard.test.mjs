import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Logistics dashboard renders the five requested count-only tiles and month selector', async () => {
  const dashboard = await read('src/logistics/LogisticsDashboard.jsx');
  for (const label of ['SO Received', 'PO Issued', 'Global GRN Input', 'Pickup', 'In transit']) {
    assert.match(dashboard, new RegExp(`label="${label}"`));
  }
  assert.match(dashboard, /<h3>Shipment Status<\/h3>/);
  assert.match(dashboard, /type="month"/);
  assert.match(dashboard, /\/api\/logistics\/stats\?month=\$\{selectedMonth\}/);
  assert.match(dashboard, /sales-dashboard-nine-tile/);
  assert.doesNotMatch(dashboard, /amountCents|sales-dashboard-nine-amount/);
});

test('existing Shipment status controls are editable only for the Logistics role', async () => {
  const shipments = await read('src/logistics/LogisticsShipmentsView.jsx');
  assert.match(shipments, /const canSetShipmentStatus = currentUser\?\.role === 'logistics'/);
  assert.match(shipments, /if \(!canSetShipmentStatus\) delete trackingPayload\.status/);
  assert.match(shipments, /disabled=\{!canSetShipmentStatus \|\| pickedUp/);
  assert.match(shipments, /disabled=\{!canSetShipmentStatus \|\| inTransit/);
  assert.match(shipments, /\{canSetShipmentStatus \? \(/);
  assert.match(shipments, /<option value="Picked Up">Picked Up<\/option>/);
  assert.match(shipments, /<option value="In Transit">In Transit<\/option>/);
});
