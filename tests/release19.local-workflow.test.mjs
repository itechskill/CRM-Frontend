import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Local Purchase exposes one PO issue action and removes duplicate procurement paths', async () => {
  const [pending, inventory, pos] = await Promise.all([
    read('src/purchaser/local/LocalPurchaserPendingOrdersView.jsx'),
    read('src/purchaser/local/LocalPurchaserInventoryView.jsx'),
    read('src/purchaser/local/LocalPurchaserPOsView.jsx')
  ]);
  assert.match(pending, /Issue Supplier PO/);
  assert.match(pending, /Send to Support/);
  assert.doesNotMatch(pending, /Issue Supplier PO for Shortage|Move to Support Department|> Issue Local PO/);
  assert.doesNotMatch(inventory, /complete-procurement|Procure via Local PO|Issue Local PO \+ GRN/);
  assert.doesNotMatch(pos, /Create Local Supplier PO|Create Local Supplier Purchase Order/);
});

test('GRN page records supplier receipt only and old Local GRN POST is gone', async () => {
  const grn = await read('src/purchaser/local/LocalPurchaserGRNsView.jsx');
  assert.match(grn, /Record Goods Received/);
  assert.match(grn, /goodsReceiptReference/);
  assert.match(grn, /goodsReceiptDate/);
  assert.match(grn, /does not change inventory/);
  assert.match(grn, /supportVerifiedGrn/);
  assert.doesNotMatch(grn, /api\/purchaser\/grns[^'`]*['`],\s*'POST'/);
  assert.doesNotMatch(grn, /Record Goods Received Note/);
});

test('Support Receive Goods shows Supplier PO details and Local GRN reference', async () => {
  const support = await read('src/support/SupportOrdersView.jsx');
  assert.match(support, /Check against Local Supplier PO/);
  assert.match(support, /Supplier GRN reference/);
  assert.match(support, /preview\.supplierPO\.items/);
  assert.match(support, /Goods Arrived \/ Awaiting Support Verification/);
});
