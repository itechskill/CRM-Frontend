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

export const createDeliveryNotePdf = async (deliveryNote, { showPrices = false, assetLoader } = {}) => {
  const note = deliveryNote || {};
  const reference = note.deliveryNumber || note.deliveryNoteNumber || 'DN-PENDING';
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const letterhead = await loadDocumentLetterhead(note, { assetLoader });
  const drawFrame = () => drawProfessionalFrame(doc, letterhead, { title: 'Delivery Note' });
  drawFrame();

  const orderNumber = note.salesOrderNumber || note.salesOrder?.orderNumber || note.salesOrder?.orderReference || note.sourceDocument || '-';
  const detailsBottom = drawDetailsBox(doc, {
    leftTitle: 'CUSTOMER / RECIPIENT',
    rightTitle: 'DELIVERY NOTE DETAILS',
    leftLines: [
      note.clientName || note.recipientName || 'Valued Consignee',
      `Recipient: ${note.recipientName || note.clientName || '-'}`,
      `Phone: ${note.recipientPhone || note.salesOrder?.clientPhone || '-'}`,
      `Address: ${note.deliveryAddress || note.salesOrder?.clientAddress || '-'}`
    ],
    rightRows: [
      ['Delivery Note', reference],
      ['Sales Order', orderNumber],
      ['Dispatch Date', pdfDate(note.scheduledDate || note.createdAt)],
      ['Carrier', note.carrier || 'Fortline Logistics']
    ],
    height: 36
  });

  const items = resolveDocumentLines(note);
  const rows = (items.length ? items : [{ description: 'Delivered Item', quantity: 1 }]).map((item, index) => [
    index + 1,
    item.partNumber || '',
    item.product || item.description || 'Delivered Item',
    item.demand || item.totalOrderedQty || item.quantity || 1,
    item.quantity || item.demand || 1,
    item.unit || 'pcs',
    ...(showPrices ? [pdfMoney(item.unitPrice), pdfMoney(item.lineTotal || ((Number(item.quantity) || 1) * Number(item.unitPrice || 0)))] : [])
  ]);

  const columnStyles = showPrices ? {
    0: { cellWidth: 9, halign: 'center' },
    1: { cellWidth: 23 },
    2: { cellWidth: 55 },
    3: { cellWidth: 17, halign: 'center' },
    4: { cellWidth: 17, halign: 'center' },
    5: { cellWidth: 14, halign: 'center' },
    6: { cellWidth: 23, halign: 'right' },
    7: { cellWidth: 24, halign: 'right' }
  } : {
    0: { cellWidth: 12, halign: 'center' },
    1: { cellWidth: 31 },
    2: { cellWidth: 75 },
    3: { cellWidth: 22, halign: 'center' },
    4: { cellWidth: 22, halign: 'center' },
    5: { cellWidth: 20, halign: 'center' }
  };
  drawProfessionalTable(doc, {
    startY: detailsBottom + 5,
    head: ['S.no', 'Part Number', 'Description', 'Ordered', 'Delivered', 'Unit', ...(showPrices ? ['Unit Price', 'Amount'] : [])],
    body: rows,
    columnStyles,
    drawFrame
  });

  let y = doc.lastAutoTable.finalY + 7;
  if (showPrices) {
    y = ensurePdfSpace(doc, y, 43, drawFrame);
    const subtotal = Number(note.subtotal) || items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const discount = Number(note.discount) || 0;
    const tax = Number(note.tax) || 0;
    const total = Number(note.grandTotal) || subtotal - discount + tax;
    const summaryRows = [['Subtotal', `PKR ${pdfMoney(subtotal)}`]];
    if (discount > 0) summaryRows.push(['Discount', `-PKR ${pdfMoney(discount)}`]);
    summaryRows.push(['Tax / GST', `PKR ${pdfMoney(tax)}`], ['Total', `PKR ${pdfMoney(total)}`, true]);
    drawSummaryBox(doc, { y, title: 'DELIVERY NOTE SUMMARY', rows: summaryRows });
    y += 6 * (summaryRows.length + 1) + 7;
  }

  y = ensurePdfSpace(doc, y, 42, drawFrame);
  if (note.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(`Notes: ${note.notes}`, 178), 16, y);
    y += 10;
  }
  doc.setDrawColor(0, 0, 0);
  doc.rect(14, y, 182, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Dispatched By', 18, y + 8);
  doc.text('Received in Good Condition By', 108, y + 8);
  doc.line(18, y + 20, 88, y + 20);
  doc.line(108, y + 20, 178, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Support / Warehouse', 18, y + 25);
  doc.text('Customer Signature & Stamp', 108, y + 25);
  repeatProfessionalFrame(doc, drawFrame);
  return doc;
};

export const downloadDeliveryNotePdf = async (deliveryNote, options = {}) => {
  const doc = await createDeliveryNotePdf(deliveryNote, options);
  const reference = deliveryNote?.deliveryNumber || deliveryNote?.deliveryNoteNumber || 'DN';
  doc.save(`Delivery_Note_${String(reference).replace(/[\\/]/g, '_')}.pdf`);
};
