import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMPANY_OPTIONS } from '../src/utils/companies.js';
import {
  createSalesOrderPdf,
  getSalesOrderPdfFinancials
} from '../src/utils/salesDocumentPdfLayout.js';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, '..');

const assetLoader = async assetPath => {
  const localPath = path.join(projectRoot, 'public', assetPath.replace(/^\//, ''));
  const bytes = await readFile(localPath);
  return `data:image/png;base64,${bytes.toString('base64')}`;
};

const baseOrder = {
  orderReference: 'SO-8100',
  clientName: 'Release 8.1 PDF Customer',
  clientAddress: 'Suite 14, Shahrah-e-Faisal, Karachi',
  customerPONumber: 'CPO-8100',
  fileNo: '1022',
  fileType: 'Green',
  orderDate: '2026-10-23T00:00:00.000Z',
  items: [{
    sku: 'SSD-512',
    description: '512 GB SSD - enterprise grade storage\nThree-year manufacturer warranty',
    quantity: 5,
    unitPrice: 6000,
    total: 30000
  }],
  totalAmount: 30000,
  discount: 0,
  tax: 5400,
  netAmount: 35400,
  deliveryStatus: 'Not Delivered',
  invoiceStatus: 'Not Invoiced',
  paymentStatus: 'Pending',
  salePerson: 'Release Tester'
};

test('Sales Order PDF financial summary separates subtotal, GST percentage, GST amount and total', () => {
  assert.deepEqual(getSalesOrderPdfFinancials(baseOrder), {
    subtotal: 30000,
    discount: 0,
    gstPercentage: 18,
    gstAmount: 5400,
    total: 35400
  });

  const legacy = getSalesOrderPdfFinancials({
    items: [{ description: 'Legacy item', quantity: 1, unitPrice: 12500, total: 12500 }],
    totalAmount: 12500,
    netAmount: 12500
  });
  assert.equal(legacy.subtotal, 12500);
  assert.equal(legacy.gstPercentage, 0);
  assert.equal(legacy.gstAmount, 0);
  assert.equal(legacy.total, 12500);
});

test('Sales Order PDFs render for all configured companies and a legacy order without GST', async t => {
  const requestedOutput = process.env.R81_PDF_OUTPUT_DIR;
  const outputDirectory = requestedOutput
    ? path.resolve(projectRoot, requestedOutput)
    : await mkdtemp(path.join(tmpdir(), 'fortline-r81-pdf-'));
  await mkdir(outputDirectory, { recursive: true });

  if (!requestedOutput) {
    t.after(async () => rm(outputDirectory, { recursive: true, force: true }));
  }

  for (const company of COMPANY_OPTIONS) {
    const loadedAssets = [];
    const doc = await createSalesOrderPdf({
      ...baseOrder,
      issuingCompany: { code: company.code, legalName: company.legalName }
    }, {
      assetLoader: async assetPath => {
        loadedAssets.push(assetPath);
        return assetLoader(assetPath);
      }
    });

    assert.equal(loadedAssets.length, company.letterhead ? 2 : 0);
    assert.ok(doc.getNumberOfPages() >= 1);
    const drawingCommands = doc.internal.pages.flat().join('\n');
    assert.match(drawingCommands, /SALES ORDER/);
    assert.match(drawingCommands, /Subtotal/);
    assert.match(drawingCommands, /GST %/);
    assert.match(drawingCommands, /GST Amount/);
    assert.match(drawingCommands, /does not require a signature/);
    assert.doesNotMatch(drawingCommands, /Generated via Fortline CRM/);

    const bytes = Buffer.from(doc.output('arraybuffer'));
    assert.ok(bytes.length > 5000);
    await writeFile(path.join(outputDirectory, `${company.code}.pdf`), bytes);
  }

  const legacyDoc = await createSalesOrderPdf({
    orderReference: 'S01234',
    clientName: 'Legacy Customer Without GST',
    clientAddress: 'Historical address',
    items: [{ description: 'Legacy order item', quantity: 1, unitPrice: 12500, total: 12500 }],
    totalAmount: 12500,
    netAmount: 12500,
    createdAt: '2024-01-15T00:00:00.000Z'
  }, { assetLoader });
  const legacyCommands = legacyDoc.internal.pages.flat().join('\n');
  assert.match(legacyCommands, /GST %/);
  assert.match(legacyCommands, /GST Amount/);
  assert.doesNotMatch(legacyCommands, /Generated via Fortline CRM/);
  await writeFile(path.join(outputDirectory, 'LEGACY_NO_GST.pdf'), Buffer.from(legacyDoc.output('arraybuffer')));
});
