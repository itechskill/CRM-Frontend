import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  COMPANY_OPTIONS,
  DOCUMENT_TYPES,
  companiesFor,
  letterheadFor
} from '../src/utils/companies.js';
import {
  canEditPriceRequestLabelForRole,
  PRICE_REQUEST_LABEL_ROLES
} from '../src/admin/priceRequestLabelRoles.js';
import { createQuotationPdf } from '../src/utils/quotationPdf.js';
import { createSupplierPoPdf } from '../src/utils/supplierPoPdf.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const loadAsset = async (path, seen) => {
  seen.push(path);
  return new Uint8Array(await readFile(fileURLToPath(new URL(`../public${path}`, import.meta.url))));
};

test('Price Request label editor supports every eligible stored and displayed role value', async () => {
  assert.deepEqual(PRICE_REQUEST_LABEL_ROLES, [
    'sales_member', 'sales_rep', 'sales_person', 'sales_manager', 'purchaser', 'admin', 'ceo'
  ]);
  for (const role of [
    'Sales Member', 'Sales Rep', 'Sales Person', 'Sales Manager',
    'Purchaser', 'purchaser', 'Admin', 'CEO'
  ]) {
    assert.equal(canEditPriceRequestLabelForRole(role), true, `${role} must show the field`);
  }
  assert.equal(canEditPriceRequestLabelForRole('Support'), false);

  const source = await read('src/admin/UsersView.jsx');
  assert.match(source, /data-testid="price-request-label-field"/);
  assert.match(source, /maxLength=\{80\}/);
  assert.match(source, /priceRequestLabel\.trim\(\)/);
  assert.match(source, /\/price-request-label/);
});

test('all four companies are selectable for every requested document and have unique letterhead assets', async () => {
  const expectedCodes = COMPANY_OPTIONS.map(company => company.code).sort();
  for (const type of Object.values(DOCUMENT_TYPES)) {
    assert.deepEqual(companiesFor(type).map(company => company.code).sort(), expectedCodes);
  }

  const assetPairs = COMPANY_OPTIONS.map(company => letterheadFor({ issuingCompany: company }));
  assert.equal(new Set(assetPairs.flatMap(pair => [pair.header, pair.footer])).size, 8);
  for (const pair of assetPairs) {
    for (const publicPath of [pair.header, pair.footer]) {
      const localUrl = new URL(`../public${publicPath}`, import.meta.url);
      await access(fileURLToPath(localUrl));
    }
  }
});

test('quotation and Supplier PO PDFs request the selected company own header and footer', async () => {
  for (const company of COMPANY_OPTIONS) {
    const expected = letterheadFor({ issuingCompany: company });
    const quotationAssets = [];
    await createQuotationPdf({
      issuingCompany: company,
      orderReference: 'QO-0001-TST',
      clientName: 'Release 22 Client',
      items: [{ sku: 'SKU-1', description: 'Server', quantity: 1, unitPrice: 100 }]
    }, { assetLoader: path => loadAsset(path, quotationAssets) });
    assert.deepEqual(quotationAssets.sort(), [expected.header, expected.footer].sort());

    for (const poType of ['Local', 'Global']) {
      const poAssets = [];
      await createSupplierPoPdf({
        issuingCompany: company,
        poType,
        poNumber: `${poType}-PO-1`,
        supplierName: 'Release 22 Supplier',
        items: [{ productName: 'Server', description: 'Configured server', quantity: 1, unitPrice: 100, totalAmount: 100 }],
        subtotal: 100,
        totalAmount: 100
      }, { assetLoader: path => loadAsset(path, poAssets) });
      assert.deepEqual(poAssets.sort(), [expected.header, expected.footer].sort());
    }
  }
});

test('PO Reference is prefilled, editable, shown in details and conditionally printed by Accounts and Finance', async () => {
  const accounts = await read('src/accounts/AccountsInvoicesView.jsx');
  const finance = await read('src/finance_dept/FinanceInvoicesView.jsx');
  assert.match(accounts, /poReference: so\?\.customerPONumber \|\| so\?\.customerPOId\?\.poNumber \|\| ''/);
  assert.match(accounts, /poReference: so\.customerPONumber \|\| so\.customerPOId\?\.poNumber \|\| ''/);
  assert.match(accounts, /<label className="ip-label">PO Reference<\/label>/);
  assert.match(accounts, /maxLength=\{60\}/);
  assert.match(accounts, /if \(inv\.poReference\) doc\.text\(`PO Reference:/);
  assert.match(accounts, /viewInvoice\.poReference \|\| '—'/);
  assert.match(finance, /if \(inv\.poReference\) doc\.text\(`PO Reference:/);
  assert.match(finance, /viewInvoice\.poReference \|\| '—'/);
});

test('Local and Global Supplier PO lists expose the shared letterhead PDF download', async () => {
  for (const path of [
    'src/purchaser/local/LocalPurchaserPOsView.jsx',
    'src/purchaser/global/GlobalPurchaserPOsView.jsx'
  ]) {
    const source = await read(path);
    assert.match(source, /downloadSupplierPoPdf/);
    assert.match(source, /Download Supplier PO PDF/);
  }
});
