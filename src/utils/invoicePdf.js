import { jsPDF } from 'jspdf';
import { isFinalizedInvoice, loadDocumentLetterhead } from './documentLetterhead.js';
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

export const createInvoicePdf = async (invoice, { assetLoader, includeLateCharge = false } = {}) => {
  const inv = invoice || {};
  const finalized = isFinalizedInvoice(inv);
  const letterhead = await loadDocumentLetterhead(inv, { assetLoader });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const title = inv.invoiceType || 'Commercial Invoice';
  const drawFrame = () => drawProfessionalFrame(doc, letterhead, {
    title,
    draft: !finalized,
    accent: finalized ? [15, 23, 42] : [180, 83, 9]
  });
  drawFrame();
  if (!finalized) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text('NOT FINALIZED', 105, 50.5, { align: 'center' });
  }

  const detailsBottom = drawDetailsBox(doc, {
    y: finalized ? 53 : 55,
    height: 38,
    leftTitle: 'BILLED TO',
    rightTitle: 'INVOICE DETAILS',
    leftLines: [
      inv.clientName || inv.customerName || 'Customer',
      `Email: ${inv.customerEmail || '-'}`,
      `Phone: ${inv.customerPhone || '-'}`,
      `Address: ${inv.customerAddress || '-'}`
    ],
    rightRows: [
      ['Invoice #', inv.invoiceNumber || '-'],
      ['Issue Date', pdfDate(inv.issueDate || inv.createdAt)],
      ['Due Date', pdfDate(inv.dueDate)],
      ['Status', inv.status || (finalized ? 'Finalized' : 'Draft')],
      ...(inv.poReference ? [['PO Reference', inv.poReference]] : [])
    ],
    accent: finalized ? [15, 23, 42] : [180, 83, 9]
  });

  const items = resolveDocumentLines(inv);
  const sourceItems = items.length ? items : [{ description: inv.description || 'Deliverables', quantity: 1, unitPrice: inv.amount, total: inv.amount }];
  const rows = sourceItems.map((item, index) => [
    index + 1,
    item.partNumber || '',
    item.description || item.product || 'Item',
    item.quantity || 1,
    pdfMoney(item.unitPrice),
    pdfMoney(item.total || ((Number(item.quantity) || 1) * Number(item.unitPrice || 0)))
  ]);
  drawProfessionalTable(doc, {
    startY: detailsBottom + 5,
    head: ['S.no', 'Part Number', 'Description', 'QTY', 'Unit Price', 'Amount'],
    body: rows,
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 74 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    drawFrame
  });

  let y = doc.lastAutoTable.finalY + 7;
  const isOverdue = includeLateCharge && inv.dueDate && new Date(inv.dueDate) < new Date() && !['Paid', 'Cancelled'].includes(inv.status);
  const lateCharge = isOverdue ? Math.round(Number(inv.amount || 0) * 0.03 * 100) / 100 : 0;
  const subtotal = Number(inv.subtotal) || sourceItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const discount = Number(inv.discount) || 0;
  const summaryRows = [['Subtotal', `PKR ${pdfMoney(subtotal)}`]];
  if (discount > 0) summaryRows.push(['Discount', `-PKR ${pdfMoney(discount)}`]);
  summaryRows.push(
    [`Tax / GST (${Number(inv.taxRate || 0)}%)`, `PKR ${pdfMoney(inv.tax)}`],
    ['Invoice Total', `PKR ${pdfMoney(inv.amount)}`, true]
  );
  if (isOverdue) {
    summaryRows.push(['Overdue 3% Charge', `PKR ${pdfMoney(lateCharge)}`], ['Total Payable', `PKR ${pdfMoney(Number(inv.amount || 0) + lateCharge)}`, true]);
  }
  y = ensurePdfSpace(doc, y, Math.max(45, 6 * (summaryRows.length + 2)), drawFrame);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(71, 85, 105);
  doc.text(`Sales Order: ${inv.salesOrderNumber || inv.salesOrderId?.orderNumber || '-'}`, 14, y + 5);
  doc.text(`Delivery Note: ${inv.deliveryNoteNumber || '-'}`, 14, y + 11);
  if (inv.poReference) doc.text(`PO Reference: ${inv.poReference}`, 14, y + 17, { maxWidth: 82 });
  drawSummaryBox(doc, { y, title: 'INVOICE SUMMARY', rows: summaryRows });
  repeatProfessionalFrame(doc, drawFrame);
  return doc;
};

export const downloadInvoicePdf = async (invoice, options = {}) => {
  const doc = await createInvoicePdf(invoice, options);
  const type = invoice?.invoiceType ? String(invoice.invoiceType).replace(/\s+/g, '_') : 'Invoice';
  doc.save(`${type}_${invoice?.invoiceNumber || 'Draft'}.pdf`);
};
