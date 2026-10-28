import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatQuotationNumber } from '../src/utils/quotationNumber.js';
import { SUPPORTED_CURRENCIES, exchangeRateFor } from '../src/utils/exchangeRates.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('new quotation display format is global six-digit QO without a salesperson code', async () => {
  assert.equal(formatQuotationNumber(1), 'QO-000001');
  assert.equal(formatQuotationNumber(999999), 'QO-999999');
  assert.equal(formatQuotationNumber(1000000), 'QO-1000000');
  for (const path of ['src/employee/sales/SalesQuotationsView.jsx', 'src/employee/sales/SalesDealsView.jsx']) {
    const source = await read(path);
    assert.doesNotMatch(source, /quotationCode/);
    assert.match(source, /Assigned on save \(QO-000001\)/);
  }
});

test('Admin Exchange Rates screen is wired with supported currencies, history, and Admin save endpoint', async () => {
  assert.deepEqual(SUPPORTED_CURRENCIES, ['PKR', 'USD', 'EUR', 'AED', 'GBP']);
  assert.equal(exchangeRateFor([{ currency: 'USD', rateToPKR: 295 }], 'USD'), 295);
  assert.equal(exchangeRateFor([], 'EUR'), null);
  const [app, sidebar, screen] = await Promise.all([
    read('src/App.jsx'), read('src/admin/Sidebar.jsx'), read('src/admin/ExchangeRatesView.jsx')
  ]);
  assert.match(sidebar, /id: 'exchange_rates'/);
  assert.match(app, /activeTab === 'exchange_rates' && <ExchangeRatesView/);
  assert.match(screen, /\/api\/exchange-rates/);
  assert.match(screen, /'PATCH'/);
  assert.match(screen, /Last changed by/);
  assert.match(screen, /History/);
});

test('Local and Global PO issue forms select currency and show the Admin rate read-only', async () => {
  for (const path of [
    'src/purchaser/local/LocalPurchaserPendingOrdersView.jsx',
    'src/purchaser/global/GlobalPurchaserPendingOrdersView.jsx',
    'src/purchaser/global/GlobalPurchaserPOsView.jsx'
  ]) {
    const source = await read(path);
    assert.match(source, /SUPPORTED_CURRENCIES/);
    assert.match(source, /currency:/);
    assert.match(source, /Admin [Rr]ate to PKR/);
    assert.match(source, /readOnly/);
  }
  for (const path of [
    'src/purchaser/local/LocalPurchaserPOsView.jsx',
    'src/purchaser/global/GlobalPurchaserPOsView.jsx',
    'src/finance_dept/FinanceSupplierPOExpensesView.jsx'
  ]) {
    const source = await read(path);
    assert.match(source, /Rate to PKR/);
  }
});

test('expense rate is read-only for Finance and only Admin can correct an existing line', async () => {
  const source = await read('src/components/SupplierPOExpenses.jsx');
  assert.match(source, /role !== 'admin' \|\| !editingId/);
  assert.match(source, /Copied from the current Admin rate when added/);
  assert.match(source, /Admin correction is recorded in history/);
  assert.match(source, /SUPPORTED_CURRENCIES\.map/);
});
