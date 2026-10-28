import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('one frontend role helper grants full money only to the approved roles', async () => {
  const helper = await read('src/utils/monetaryVisibility.js');
  for (const role of ['finance', 'accountant', 'purchaser', 'admin', 'ceo']) assert.match(helper, new RegExp(`'${role}'`));
  assert.doesNotMatch(helper, /'support'/);
  assert.doesNotMatch(helper, /'logistics'/);
});

test('Support Pending Orders hides selling values and line prices', async () => {
  const source = await read('src/support/SupportOrdersView.jsx');
  assert.match(source, /canViewFullMonetaryData/);
  assert.match(source, /showMoney && <th[^>]*>Net Amount/);
  assert.match(source, /showMoney \? 'Financial Value' : 'Order Status'/);
  assert.match(source, /showMoney && <div[^>]*>[\s\S]*Rs\./);
  assert.match(source, /showMoney && <th[^>]*>Unit Price \(PKR\)<\/th>/);
  assert.match(source, /showMoney && <th[^>]*>Total \(PKR\)<\/th>/);
});

test('Support inventory editor and PDF/CSV valuation columns are role-gated', async () => {
  const source = await read('src/support/SupportInventoryView.jsx');
  assert.match(source, /if \(showMoney\) payload\.unitPrice/);
  assert.match(source, /else delete payload\.unitPrice/);
  assert.match(source, /showMoney \? \['Unit Price', 'Stock Value'\] : \[\]/);
  assert.match(source, /showMoney \? \['Unit Price \(PKR\)', 'Total Value \(PKR\)'\] : \[\]/);
  assert.match(source, /if \(showMoney\) \{[\s\S]*Total Stock Asset Value/);
  assert.match(source, /showMoney && <div className="sv-field">[\s\S]*Unit Price \(PKR\)/);
});

test('Support DN submits IDs and quantities only and keeps screen/PDF money conditional', async () => {
  const source = await read('src/support/SupportDeliveryNotesView.jsx');
  assert.match(source, /items: form\.items\.map\(item => \(\{[\s\S]*orderItemId: item\.orderItemId,[\s\S]*quantity: Number\(item\.quantity\) \|\| 1[\s\S]*\}\)\)/);
  const payloadBlock = source.match(/const deliveryPayload = \{[\s\S]*?\n      \};/)?.[0] || '';
  assert.doesNotMatch(payloadBlock, /unitPrice|lineTotal|grandTotal|subtotal/);
  assert.match(source, /\.\.\.\(showMoney \? \['Unit Price', 'Line Total'\] : \[\]\)/);
  assert.match(source, /\{showMoney && <div[^>]*>Grand Total:/);
  assert.doesNotMatch(source, /Prices come from the Sales Order/);
});

test('Logistics Incoming Orders and Import Inventory hide amounts and valuation for Logistics', async () => {
  const [incoming, inventory] = await Promise.all([
    read('src/logistics/LogisticsIncomingOrdersView.jsx'),
    read('src/logistics/LogisticsImportInventoryView.jsx')
  ]);
  assert.match(incoming, /showMoney && <th[^>]*>Order Amount/);
  assert.match(incoming, /showMoney && <td[^>]*>[\s\S]*Rs\./);
  assert.match(inventory, /showMoney && <div[^>]*>[\s\S]*Estimated Valuation/);
  assert.match(inventory, /showMoney && <th[^>]*>Unit Price \/ Total/);
  assert.match(inventory, /if \(!showMoney\) delete payload\.unitPrice/);
  assert.match(inventory, /showMoney && <div>[\s\S]*Unit Price \(PKR\)/);
});

test('App passes the current role to every affected Support and Logistics view', async () => {
  const app = await read('src/App.jsx');
  for (const component of ['SupportOrdersView', 'SupportInventoryView', 'SupportDeliveryNotesView', 'LogisticsIncomingOrdersView', 'LogisticsImportInventoryView']) {
    assert.match(app, new RegExp(`<${component}[\\s\\S]{0,180}currentUser=\\{currentUser\\}`));
  }
});
