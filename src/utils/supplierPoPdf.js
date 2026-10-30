import { jsPDF } from 'jspdf';
import { loadDocumentLetterhead } from './documentLetterhead.js';
import { resolveDocumentLines } from './documentPartNumbers.js';
import {
  drawDetailsBox,
  drawProfessionalFrame,
  drawProfessionalTable,
  drawSummaryBox,
  ensurePdfSpace,
  pdfDate,
  pdfMoney,
  repeatProfessionalFrame
} from './professionalDocumentPdf.js';

export const createSupplierPoPdf = async (supplierPO, { assetLoader } = {}) => {
  const po = supplierPO || {};
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const letterhead = await loadDocumentLetterhead(po, { assetLoader });
  const drawFrame = () => drawProfessionalFrame(doc, letterhead, { title: 'Supplier Purchase Order' });
  drawFrame();
  const currency = po.currency || 'PKR';
  const detailsBottom = drawDetailsBox(doc, {
    leftTitle: 'SUPPLIER',
    rightTitle: 'PURCHASE ORDER DETAILS',
    leftLines: [
      po.supplierName || '-',
      `Country: ${po.supplierCountry || '-'}`,
      `Contact: ${po.supplierContact || po.supplierPhone || '-'}`,
      `Email: ${po.supplierEmail || '-'}`
    ],
    rightRows: [
      ['PO Number', po.poNumber || '-'],
      ['Date', pdfDate(po.poDate || po.createdAt)],
      ['Type', po.poType || '-'],
      ['Currency', currency],
      ['Sales Order', po.salesOrderNumber || '-']
    ],
    height: 38
  });

  const items = resolveDocumentLines(po);
  const rows = items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const total = item.totalAmount !== undefined ? Number(item.totalAmount) : quantity * unitPrice;
    return [index + 1, item.partNumber || '', item.productName || item.description || '', quantity, pdfMoney(unitPrice), pdfMoney(total)];
  });
  drawProfessionalTable(doc, {
    startY: detailsBottom + 5,
    head: ['S.no', 'Part Number', 'Description', 'QTY', `Unit Price (${currency})`, `Amount (${currency})`],
    body: rows,
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 68 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    drawFrame
  });

  let y = doc.lastAutoTable.finalY + 7;
  y = ensurePdfSpace(doc, y, 48, drawFrame);
  const subtotal = Number(po.subtotal ?? po.totalAmount ?? po.total) || 0;
  const taxLabel = po.poType === 'Global' ? 'VAT' : 'GST';
  const taxRate = Number(po.poType === 'Global' ? po.vatRate : po.gstRate) || 0;
  const taxAmount = Number(po.poType === 'Global' ? po.vatAmount : po.gstAmount) || 0;
  const grandTotal = Number(po.total ?? po.totalAmount) || subtotal + taxAmount;
  const summaryRows = [['Subtotal', `${currency} ${pdfMoney(subtotal)}`]];
  if (taxRate > 0 || taxAmount > 0) summaryRows.push([`${taxLabel} (${taxRate}%)`, `${currency} ${pdfMoney(taxAmount)}`]);
  summaryRows.push(['Total', `${currency} ${pdfMoney(grandTotal)}`, true]);
  drawSummaryBox(doc, { y, title: 'PURCHASE ORDER SUMMARY', rows: summaryRows });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('COMMERCIAL TERMS', 14, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize([
    po.paymentTerms ? `Payment Terms: ${po.paymentTerms}` : '',
    po.expectedDeliveryDate ? `Expected Delivery: ${pdfDate(po.expectedDeliveryDate)}` : '',
    po.notes ? `Notes: ${po.notes}` : ''
  ].filter(Boolean).join('\n'), 84), 14, y + 11);
  repeatProfessionalFrame(doc, drawFrame);
  return doc;
};

export const downloadSupplierPoPdf = async supplierPO => {
  const doc = await createSupplierPoPdf(supplierPO);
  doc.save(`Supplier_PO_${supplierPO?.poNumber || 'document'}.pdf`);
};
