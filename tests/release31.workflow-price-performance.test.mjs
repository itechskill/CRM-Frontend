import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Sales and Sales Manager orders show current location and activity without a predicted Support queue', () => {
  for (const path of [
    'src/employee/sales/SalesOrdersView.jsx',
    'src/sales_manager/SalesManagerOrdersView.jsx'
  ]) {
    const view = source(path);
    assert.match(view, /workflowSummary\?\.currentStatus/);
    assert.match(view, /With:/);
    assert.match(view, /Recent activity/);
    assert.match(view, /workflowSummary\?\.recentActivity/);
    assert.doesNotMatch(view, /Finance Approved\s*(?:-|→|&rarr;|->)+\s*Support Queue/i);
    assert.doesNotMatch(view, /Support Queue/);
  }
});

test('Price Request form sends multiple items and renders unit price, quantity and total separately', () => {
  const view = source('src/price_requests/PriceRequestsView.jsx');
  assert.match(view, /items: \[\{ \.\.\.EMPTY_ITEM \}\]/);
  assert.match(view, /requestForm\.items\.length >= 50/);
  assert.match(view, /Add item/);
  assert.match(view, /Remove item/);
  assert.match(view, /items: requestItems\.map/);
  assert.match(view, /items: decimals\.map\(\(decimal\) => \(\{ unitPriceCents:/);
  assert.match(view, /<th>Quantity<\/th><th>Unit Price<\/th><th>Total Price<\/th>/);
  assert.match(view, /Grand Total:/);
});

test('Target Performance renders its shell and skeleton while one fetch supplies the page', () => {
  const admin = source('src/target_performance/AdminTargetPerformanceView.jsx');
  const own = source('src/target_performance/TargetPerformanceView.jsx');
  assert.match(admin, /target-performance-skeleton/);
  assert.match(admin, /Loading…/);
  assert.match(admin, /useCallback/);
  assert.match(own, /target-performance-skeleton/);
  assert.match(own, /Target Performance/);
  assert.doesNotMatch(own, /return <div[^>]*>Loading target performance/);
});
