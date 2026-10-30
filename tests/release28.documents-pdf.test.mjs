import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDeliveryNotePdf } from '../src/utils/deliveryNotePdf.js';
import { createInvoicePdf } from '../src/utils/invoicePdf.js';
import { createGrnPdf } from '../src/utils/grnPdf.js';
import { createSalesOrderPdf } from '../src/utils/salesDocumentPdfLayout.js';
import { createSupplierPoPdf } from '../src/utils/supplierPoPdf.js';
import { createReceiptVoucherPdf } from '../src/utils/receiptVoucherPdf.js';
import { buildQuotationPayload } from '../src/utils/quotationFinancials.js';
import { resolvePartNumber } from '../src/utils/documentPartNumbers.js';

const root = resolve(import.meta.dirname, '..');
const assetLoader = async path => {
  const bytes = await readFile(resolve(root, 'public', path.replace(/^\//, '')));
  return `data:image/png;base64,${bytes.toString('base64')}`;
};
const company = (code, legalName) => ({ code, legalName });
const fortline = company('FORTLINE_PRIVATE_LIMITED', 'Fortline (Private) Limited');
const wwts = company('WWTS', 'Worldwide Techsolutions (WWTS)');
const line = (index = 1) => ({
  partNumber: 'ABC-777',
  sku: '12345',
  description: `Enterprise server configuration ${index} with redundant power, storage and support specifications`,
  product: `Enterprise server configuration ${index}`,
  productName: `Enterprise server configuration ${index}`,
  demand: 2,
  orderedQty: 2,
  receivedQty: 2,
  quantity: 2,
  unit: 'pcs',
  unitPrice: 2000000,
  total: 4000000,
  lineTotal: 4000000
});
const orderFor = issuingCompany => ({
  orderNumber: 'SO-R28', orderReference: 'SO-R28', clientName: 'R28 Customer', clientAddress: 'Karachi, Pakistan',
  clientPhone: '021-0000000', issuingCompany, items: [line()], totalAmount: 4000000, discount: 97600,
  taxRate: 18, tax: 702432, netAmount: 4604832, customerPONumber: 'CPO-R28'
});
const pageCommands = (doc, page) => (doc.internal.pages?.[page] || []).join('\n');
const imageUses = (doc, page) => (pageCommands(doc, page).match(/\/I\d+ Do/g) || []).length;
const documentText = doc => doc.internal.pages.slice(1).map(page => page.join('\n')).join('\n');
const assertLetterheadEveryPage = doc => {
  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    assert.ok(imageUses(doc, page) >= 2, `page ${page} must contain both header and footer images`);
  }
};
const maybeWrite = async (name, doc) => {
  if (!process.env.R28_RENDER_DIR) return;
  const output = resolve(process.env.R28_RENDER_DIR);
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, `${name}.pdf`), Buffer.from(doc.output('arraybuffer')));
};

test('quotation payload keeps a true part number distinct from SKU and never substitutes SKU', () => {
  const payload = buildQuotationPayload({
    clientName: 'R28', items: [{ sku: '12345', partNumber: 'ABC-777', description: 'Server', quantity: 1, unitPrice: 10 }],
    discount: 0, taxPercentage: 0
  });
  assert.equal(payload.items[0].partNumber, 'ABC-777');
  const skuOnly = buildQuotationPayload({ items: [{ sku: 'SKU-ONLY', description: 'No PN' }] });
  assert.equal(skuOnly.items[0].partNumber, '');
  assert.equal(resolvePartNumber({ partNumber: '' }, 0, { salesOrder: { items: [{ partNumber: 'SOURCE-PN' }] } }), 'SOURCE-PN');
});

test('real document generators use the quotation-style bordered layout, real part numbers and repeated letterheads', async () => {
  const fortlineOrder = orderFor(fortline);
  const wwtsOrder = orderFor(wwts);
  const manyItems = Array.from({ length: 25 }, (_, index) => line(index + 1));
  const documents = [
    ['fortline-dn', await createDeliveryNotePdf({ deliveryNoteNumber: 'DN-R28-F', clientName: 'R28 Customer', salesOrder: fortlineOrder, items: [line()] }, { assetLoader, showPrices: false }), true, true],
    ['wwts-dn', await createDeliveryNotePdf({ deliveryNoteNumber: 'DN-R28-W', clientName: 'R28 Customer', salesOrder: wwtsOrder, items: [line()] }, { assetLoader, showPrices: false }), true, true],
    ['fortline-final-invoice', await createInvoicePdf({ invoiceNumber: 'INV-R28-F', clientName: 'R28 Customer', salesOrderId: fortlineOrder, items: [line()], subtotal: 4000000, discount: 97600, taxRate: 18, tax: 702432, amount: 4604832, status: 'Finalized', isDraft: false }, { assetLoader }), true, true],
    ['wwts-final-invoice', await createInvoicePdf({ invoiceNumber: 'INV-R28-W', clientName: 'R28 Customer', salesOrderId: wwtsOrder, items: [line()], subtotal: 4000000, discount: 97600, taxRate: 18, tax: 702432, amount: 4604832, status: 'Finalized', isDraft: false }, { assetLoader }), true, true],
    ['fortline-draft-invoice', await createInvoicePdf({ invoiceNumber: 'INV-R28-DRAFT', clientName: 'R28 Customer', salesOrderId: fortlineOrder, items: [line()], subtotal: 4000000, discount: 97600, taxRate: 18, tax: 702432, amount: 4604832, status: 'Draft', isDraft: true }, { assetLoader }), false, true],
    ['fortline-25-line-invoice', await createInvoicePdf({ invoiceNumber: 'INV-R28-25', clientName: 'R28 Customer', salesOrderId: fortlineOrder, items: manyItems, subtotal: 100000000, taxRate: 0, tax: 0, amount: 100000000, status: 'Finalized', isDraft: false }, { assetLoader }), true, true],
    ['fortline-local-grn', await createGrnPdf({ grnNumber: 'GRN-R28-L', supplierName: 'Local Supplier', supplierPO: { poType: 'Local', poNumber: 'LPO-R28', issuingCompany: fortline, items: [line()] }, salesOrder: fortlineOrder, items: [line()] }, { assetLoader }), true, true],
    ['wwts-global-grn', await createGrnPdf({ grnNumber: 'GRN-R28-G', supplierName: 'Global Supplier', supplierPO: { poType: 'Global', poNumber: 'GPO-R28', issuingCompany: wwts, items: [line()] }, salesOrder: wwtsOrder, items: [line()] }, { assetLoader }), true, true],
    ['fortline-sales-order', await createSalesOrderPdf(fortlineOrder, { assetLoader }), true, true],
    ['wwts-supplier-po', await createSupplierPoPdf({ poNumber: 'GPO-R28', poType: 'Global', supplierName: 'Global Supplier', issuingCompany: wwts, items: [line()], subtotal: 4000000, totalAmount: 4000000, currency: 'PKR' }, { assetLoader }), true, true],
    ['fortline-receipt-voucher', await createReceiptVoucherPdf({ receiptVoucherNumber: 'RV-000028', customerName: 'R28 Customer', amount: 100000, issuingCompany: fortline, invoiceNumber: 'INV-R28-F', salesOrderNumber: 'SO-R28', createdBy: { fullName: 'Finance User' } }, { assetLoader }), true, false]
  ];

  for (const [name, doc, letterheaded, requiresPartNumber] of documents) {
    assert.ok(doc.getNumberOfPages() >= 1, name);
    const commands = documentText(doc);
    assert.match(commands, / re|re\n/, `${name} must draw bordered boxes/tables`);
    if (requiresPartNumber) assert.match(commands, /ABC-777/, `${name} must print the part number`);
    if (letterheaded) assertLetterheadEveryPage(doc);
    else {
      for (let page = 1; page <= doc.getNumberOfPages(); page += 1) assert.equal(imageUses(doc, page), 0, `${name} draft must be plain`);
      assert.match(commands, /DRAFT/);
    }
    await maybeWrite(name, doc);
  }
  assert.ok(documents.find(([name]) => name === 'fortline-25-line-invoice')[1].getNumberOfPages() > 1, '25-line invoice must span pages');
});
