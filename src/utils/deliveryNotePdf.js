import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterheadFooter, drawLetterheadHeader, loadDocumentLetterhead } from './documentLetterhead.js';

const date = value => value && !Number.isNaN(new Date(value).getTime())
  ? new Date(value).toLocaleDateString('en-GB')
  : '-';
const money = value => Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const drawLegacyHeader = (doc, reference) => {
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(3, 105, 161);
  doc.rect(0, 36, 210, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('FORTLINE CRM', 14, 18);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Support & Warehouse Outbound Dispatch Note', 14, 26);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY NOTE', 196, 18, { align: 'right' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ref #: ${reference}`, 196, 26, { align: 'right' });
};

const drawLegacyFooter = doc => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Fortline CRM Logistics System - Official Outbound Delivery Document', 105, 288, { align: 'center' });
};

export const createDeliveryNotePdf = async (deliveryNote, { showPrices = false, assetLoader } = {}) => {
  const note = deliveryNote || {};
  const reference = note.deliveryNumber || note.deliveryNoteNumber || 'DN-PENDING';
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const letterhead = await loadDocumentLetterhead(note, { assetLoader });
  const hasCompany = Boolean(letterhead.source?.issuingCompany?.code);
  const drawHeader = () => {
    if (hasCompany) {
      drawLetterheadHeader(doc, letterhead, { title: 'Delivery Note' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text('DELIVERY NOTE', 105, 47, { align: 'center' });
    } else {
      drawLegacyHeader(doc, reference);
    }
  };
  const drawFooter = () => hasCompany ? drawLetterheadFooter(doc, letterhead) : drawLegacyFooter(doc);
  drawHeader();

  const contentTop = hasCompany ? 54 : 44;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, contentTop, 182, 34, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161);
  doc.text('CUSTOMER / RECIPIENT', 19, contentTop + 8);
  doc.text('DOCUMENT DETAILS', 114, contentTop + 8);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(note.clientName || note.recipientName || 'Valued Consignee', 19, contentTop + 14, { maxWidth: 82 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Recipient: ${note.recipientName || note.clientName || '-'}`, 19, contentTop + 20, { maxWidth: 82 });
  doc.text(`Phone: ${note.recipientPhone || '-'}`, 19, contentTop + 25, { maxWidth: 82 });
  doc.text(`Address: ${note.deliveryAddress || '-'}`, 19, contentTop + 30, { maxWidth: 82 });
  const orderNumber = note.salesOrderNumber || note.salesOrder?.orderNumber || note.salesOrder?.orderReference || note.sourceDocument || '-';
  doc.text(`Delivery Note: ${reference}`, 114, contentTop + 14);
  doc.text(`Sales Order: ${orderNumber}`, 114, contentTop + 20);
  doc.text(`Dispatch Date: ${date(note.scheduledDate || note.createdAt)}`, 114, contentTop + 26);
  doc.text(`Carrier: ${note.carrier || 'Fortline Logistics'}`, 114, contentTop + 31, { maxWidth: 78 });

  const rows = (note.items?.length ? note.items : [{ description: 'Delivered Item', quantity: 1 }]).map((item, index) => [
    index + 1,
    item.partNumber || '',
    item.product || item.description || 'Delivered Item',
    item.demand || item.totalOrderedQty || item.quantity || 1,
    item.quantity || item.demand || 1,
    item.unit || 'pcs',
    ...(showPrices ? [
      `PKR ${money(item.unitPrice)}`,
      `PKR ${money(item.lineTotal || ((Number(item.quantity) || 1) * Number(item.unitPrice || 0)))}`
    ] : [])
  ]);

  autoTable(doc, {
    startY: contentTop + 41,
    margin: { left: 14, right: 14, top: hasCompany ? 54 : 44, bottom: hasCompany ? 42 : 18 },
    head: [[
      '#', 'Part Number', 'Description', 'Ordered', 'Delivered', 'Unit',
      ...(showPrices ? ['Unit Price', 'Line Total'] : [])
    ]],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
    didDrawPage: data => {
      if (data.pageNumber > 1) drawHeader();
      drawFooter();
    }
  });

  let finalY = doc.lastAutoTable.finalY + 7;
  const signatureHeight = showPrices ? 49 : 40;
  if (finalY + signatureHeight > (hasCompany ? 251 : 278)) {
    doc.addPage();
    drawHeader();
    drawFooter();
    finalY = hasCompany ? 55 : 45;
  }
  if (showPrices) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Grand Total: PKR ${money(note.grandTotal ?? note.salesOrder?.netAmount)}`, 196, finalY, { align: 'right' });
    finalY += 8;
  }
  if (note.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(`Notes: ${note.notes}`, 178), 16, finalY);
    finalY += 12;
  }
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY, 182, 28, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Dispatched By', 18, finalY + 8);
  doc.text('Received in Good Condition By', 108, finalY + 8);
  doc.line(18, finalY + 20, 88, finalY + 20);
  doc.line(108, finalY + 20, 178, finalY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Support / Warehouse', 18, finalY + 25);
  doc.text('Customer Signature & Stamp', 108, finalY + 25);
  return doc;
};

export const downloadDeliveryNotePdf = async (deliveryNote, options = {}) => {
  const doc = await createDeliveryNotePdf(deliveryNote, options);
  const reference = deliveryNote?.deliveryNumber || deliveryNote?.deliveryNoteNumber || 'DN';
  doc.save(`Delivery_Note_${String(reference).replace(/[\\/]/g, '_')}.pdf`);
};
