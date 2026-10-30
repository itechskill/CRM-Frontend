import { jsPDF } from 'jspdf';
import { loadDocumentLetterhead } from './documentLetterhead.js';
import { resolveDocumentLines } from './documentPartNumbers.js';
import { drawDetailsBox, drawProfessionalFrame, drawProfessionalTable, pdfDate, repeatProfessionalFrame } from './professionalDocumentPdf.js';

export const getGrnDocumentType = grn => {
  const poType = String(grn?.supplierPO?.poType || grn?.poType || '').toLowerCase();
  const fileType = String(grn?.salesOrder?.fileType || grn?.fileType || '').toLowerCase();
  if (poType === 'global' || poType === 'international' || fileType === 'blue') return 'Global';
  return 'Local';
};

const value = (...candidates) => candidates.find(candidate => candidate !== undefined && candidate !== null && String(candidate).trim() !== '') || '-';

export const createGrnPdf = async (grn, { assetLoader } = {}) => {
  const source = grn || {};
  const documentType = getGrnDocumentType(source);
  const accent = documentType === 'Local' ? [5, 150, 105] : [37, 99, 235];
  const po = source.supplierPO && typeof source.supplierPO === 'object' ? source.supplierPO : {};
  const order = source.salesOrder && typeof source.salesOrder === 'object' ? source.salesOrder : {};
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const letterhead = await loadDocumentLetterhead({ ...source, issuingCompany: po.issuingCompany || order.issuingCompany || source.issuingCompany }, { assetLoader });
  const drawFrame = () => drawProfessionalFrame(doc, letterhead, {
    title: `${documentType} Goods Received Note`,
    accent,
    note: 'Quantity-only system generated Goods Received Note.'
  });
  drawFrame();

  const supplierReference = value(source.supplierBillNumber, po.goodsReceiptReference);
  const supplierReceiptDate = value(source.supplierBillDate, po.goodsReceiptDate);
  const detailsBottom = drawDetailsBox(doc, {
    leftTitle: 'SUPPLIER / RECEIPT',
    rightTitle: 'GRN DETAILS',
    leftLines: [
      value(source.supplierName, po.supplierName),
      `Supplier PO: ${value(source.poNumber, po.poNumber)}`,
      `Supplier GRN Ref: ${supplierReference}`,
      `Supplier Receipt Date: ${supplierReceiptDate === '-' ? '-' : pdfDate(supplierReceiptDate)}`
    ],
    rightRows: [
      ['GRN Number', value(source.grnNumber)],
      ['Date Received', pdfDate(value(source.grnDate, source.createdAt))],
      ['Sales Order', value(source.salesOrderNumber, order.orderNumber, order.orderReference)],
      ['Received By', value(source.createdByName, source.receivedByName)]
    ],
    accent,
    height: 38
  });

  const items = resolveDocumentLines(source);
  const rows = items.map((item, index) => [
    index + 1,
    item.partNumber || '',
    value(item.productName, item.description, 'Item'),
    Number(item.orderedQty ?? item.quantity ?? 0),
    Number(item.receivedQty ?? item.quantityReceived ?? item.quantity ?? 0)
  ]);
  drawProfessionalTable(doc, {
    startY: detailsBottom + 5,
    head: ['S.no', 'Part Number', 'Description', 'Ordered Qty', 'Received Qty'],
    body: rows.length ? rows : [['', '', 'No items recorded', '', '']],
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 76 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' }
    },
    drawFrame,
    headFill: [230, 230, 230],
    headText: accent
  });
  repeatProfessionalFrame(doc, drawFrame);
  return doc;
};

export const downloadGrnPdf = async grn => {
  const type = getGrnDocumentType(grn);
  const number = String(grn?.grnNumber || 'GRN').replace(/[^A-Za-z0-9_-]+/g, '_');
  const doc = await createGrnPdf(grn);
  doc.save(`${type}_GRN_${number}.pdf`);
};
