import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildQuotationPayload, calculateQuotationFinancials, quotationGrandTotal } from '../src/utils/quotationFinancials.js';
import { priceRequestPersonLabel } from '../src/utils/priceRequestPeople.js';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('quotation form payload keeps a fixed manual discount through the full edit matrix and clears it as zero', () => {
  const scenarios = [
    ['a create', [{ description: 'Server', quantity: 2, unitPrice: 2050000 }], 100040, 18, 4719952.8],
    ['b clear', [{ description: 'Server', quantity: 2, unitPrice: 2050000 }], '', 18, 4838000],
    ['c 50,000', [{ description: 'Server', quantity: 2, unitPrice: 2050000 }], 50000, 18, 4779000],
    ['d price', [{ description: 'Server', quantity: 2, unitPrice: 2000000 }], 50000, 18, 4661000],
    ['e quantity', [{ description: 'Server', quantity: 3, unitPrice: 2000000 }], 50000, 18, 7021000],
    ['f zero tax', [{ description: 'Server', quantity: 3, unitPrice: 2000000 }], 50000, 0, 5950000],
    ['f decimal tax', [{ description: 'Server', quantity: 3, unitPrice: 2000000 }], 50000, 17.5, 6991250],
    ['g add line', [{ description: 'Server', quantity: 3, unitPrice: 2000000 }, { description: 'Added', quantity: 1, unitPrice: 500000 }], 50000, 17.5, 7578750],
    ['g remove line', [{ description: 'Added', quantity: 1, unitPrice: 500000 }], 50000, 17.5, 528750]
  ];
  for (const [name, items, discount, taxPercentage, total] of scenarios) {
    const payload = buildQuotationPayload({ clientName: 'R27', items, discount, discountPercentage: 88, taxPercentage, tax: 1, totalAmount: 1, netAmount: 1 });
    assert.equal(payload.netAmount, total, name);
    assert.equal(payload.discount, discount === '' ? 0 : discount, name);
    assert.equal(payload.items.length, items.length, name);
  }
  for (const discount of ['', null, 0]) {
    assert.equal(buildQuotationPayload({ items: [{ description: 'Server', quantity: 2, unitPrice: 2050000 }], discount, taxPercentage: 18 }).discount, 0);
  }
});

test('quotation item changes preserve the typed amount rather than turning it into a percentage discount', () => {
  const initial = calculateQuotationFinancials({ items: [{ quantity: 2, unitPrice: 2050000 }], discount: 50000, taxPercentage: 18 });
  const changed = calculateQuotationFinancials({ items: [{ quantity: 3, unitPrice: 2000000 }], discount: initial.discount, taxPercentage: 18 });
  assert.equal(initial.discount, 50000);
  assert.equal(changed.discount, 50000);
  assert.equal(changed.discountPercentage, 0.83);
});

test('quotation cards, tables, exports and PDF read the grand total rather than the subtotal', async () => {
  assert.equal(quotationGrandTotal({ totalAmount: 4100000, netAmount: 4719952.8 }), 4719952.8);
  const quotations = await source('src/employee/sales/SalesQuotationsView.jsx');
  assert.match(quotations, /const totalAmt = quotationGrandTotal\(q\)/);
  assert.match(quotations, /dataset\.reduce\(\(sum, q\) => sum \+ quotationGrandTotal\(q\), 0\)/);
  assert.doesNotMatch(quotations, /const totalAmt = Number\(q\.totalAmount \|\| q\.netAmount/);
  const pdf = await source('src/utils/quotationPdf.js');
  assert.match(pdf, /const grandTotal = q\.netAmount === undefined \|\| q\.netAmount === null/);
  assert.match(pdf, /summaryLine\('Grand Total with Taxes', money\(grandTotal\), true\)/);
});

test('Price Request people show optional labels and the same list feeds create, reassign and routing rules', async () => {
  assert.equal(priceRequestPersonLabel({ name: 'Adnan Ahmed', label: 'DELL Configurator' }), 'Adnan Ahmed - DELL Configurator');
  assert.equal(priceRequestPersonLabel({ name: 'Karim Rafiq', label: '' }), 'Karim Rafiq');
  const priceRequests = await source('src/price_requests/PriceRequestsView.jsx');
  assert.match(priceRequests, /apiRequest\('\/api\/price-requests\/labelled-users'\)/);
  assert.match(priceRequests, /const eligibleUsers = useMemo\(\(\) => users, \[users\]\)/);
  assert.equal((priceRequests.match(/eligibleUsers\.map\(\(user\) =>/g) || []).length, 3);
  assert.match(priceRequests, />Request from<select/);
  assert.match(priceRequests, />New recipient<select/);
  assert.match(priceRequests, />Route to<select/);
});

