import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterheadFooter, drawLetterheadHeader, isFinalizedInvoice, loadDocumentLetterhead } from './documentLetterhead.js';

const money = value => Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString('en-GB') : '-';

export const createInvoicePdf = async (invoice, { assetLoader, includeLateCharge = false } = {}) => {
  const inv = invoice || {};
  const finalized = isFinalizedInvoice(inv);
  const letterhead = await loadDocumentLetterhead(inv, { assetLoader });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const title = inv.invoiceType || 'COMMERCIAL INVOICE';
  const drawPageFrame = () => {
    drawLetterheadHeader(doc, letterhead, { title, draft: !finalized });
    drawLetterheadFooter(doc, letterhead, { draft: !finalized });
  };
  drawPageFrame();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), 105, 47, { align: 'center' });
  if (!finalized) {
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text('NOT FINALIZED', 105, 52, { align: 'center' });
  }

  const metaY = finalized ? 55 : 58;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, metaY, 182, 37, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(37, 99, 235);
  doc.text('BILLED TO', 19, metaY + 8);
  doc.text('INVOICE DETAILS', 114, metaY + 8);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(inv.clientName || inv.customerName || 'Customer', 19, metaY + 14, { maxWidth: 82 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${inv.customerEmail || '-'}`, 19, metaY + 20, { maxWidth: 82 });
  doc.text(`Phone: ${inv.customerPhone || '-'}`, 19, metaY + 25, { maxWidth: 82 });
  doc.text(`Address: ${inv.customerAddress || '-'}`, 19, metaY + 30, { maxWidth: 82 });
  doc.text(`Invoice #: ${inv.invoiceNumber || '-'}`, 114, metaY + 14);
  doc.text(`Issue Date: ${date(inv.issueDate || inv.createdAt)}`, 114, metaY + 20);
  doc.text(`Due Date: ${date(inv.dueDate)}`, 114, metaY + 26);
  doc.text(`Status: ${inv.status || (finalized ? 'Finalized' : 'Draft')}`, 114, metaY + 32);

  let refsY = metaY + 99;
  const items = inv.items?.length ? inv.items : [{ description: inv.description || 'Deliverables', quantity: 1, unitPrice: inv.amount, total: inv.amount }];
  const rows = items.map((item, index) => [
    index + 1,
    item.partNumber || item.sku || item.productCode || '',
    item.description || 'Item',
    item.quantity || 1,
    `PKR ${money(item.unitPrice)}`,
    `PKR ${money(item.total || ((Number(item.quantity) || 1) * Number(item.unitPrice || 0)))}`
  ]);
  autoTable(doc, {
    startY: metaY + 44,
    margin: { left: 14, right: 14, top: 56, bottom: 43 },
    head: [['#', 'Part Number', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: finalized ? [37, 99, 235] : [180, 83, 9], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
    didDrawPage: data => {
      if (data.pageNumber > 1) {
        drawPageFrame();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`${title.toUpperCase()} - ${inv.invoiceNumber || ''}`, 105, 47, { align: 'center' });
      }
    }
  });
  refsY = doc.lastAutoTable.finalY + 7;
  const isOverdue = includeLateCharge && inv.dueDate && new Date(inv.dueDate) < new Date() && !['Paid', 'Cancelled'].includes(inv.status);
  const lateCharge = isOverdue ? Math.round(Number(inv.amount || 0) * 0.03 * 100) / 100 : 0;
  const summaryHeight = 42 + (isOverdue ? 12 : 0);
  if (refsY + summaryHeight > 250) {
    doc.addPage();
    drawPageFrame();
    refsY = 55;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Sales Order: ${inv.salesOrderNumber || inv.salesOrderId?.orderNumber || '-'}`, 14, refsY);
  doc.text(`Delivery Note: ${inv.deliveryNoteNumber || '-'}`, 14, refsY + 6);
  if (inv.poReference) doc.text(`PO Reference: ${inv.poReference}`, 14, refsY + 12, { maxWidth: 95 });
  let summaryY = refsY;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Subtotal: PKR ${money(inv.subtotal || items.reduce((sum, item) => sum + Number(item.total || 0), 0))}`, 196, summaryY, { align: 'right' });
  if (Number(inv.discount) > 0) {
    summaryY += 6;
    doc.text(`Discount: -PKR ${money(inv.discount)}`, 196, summaryY, { align: 'right' });
  }
  summaryY += 6;
  doc.text(`Tax / GST (${money(inv.taxRate)}%): PKR ${money(inv.tax)}`, 196, summaryY, { align: 'right' });
  summaryY += 6;
  doc.setFontSize(10);
  doc.text(`Invoice Total: PKR ${money(inv.amount)}`, 196, summaryY, { align: 'right' });
  doc.setFontSize(8.5);
  if (isOverdue) {
    summaryY += 6;
    doc.setTextColor(220, 38, 38);
    doc.text(`Overdue 3% Charge: PKR ${money(lateCharge)}`, 196, summaryY, { align: 'right' });
    summaryY += 6;
    doc.text(`Total Payable: PKR ${money(Number(inv.amount || 0) + lateCharge)}`, 196, summaryY, { align: 'right' });
  }
  return doc;
};

export const downloadInvoicePdf = async (invoice, options = {}) => {
  const doc = await createInvoicePdf(invoice, options);
  const type = invoice?.invoiceType ? String(invoice.invoiceType).replace(/\s+/g, '_') : 'Invoice';
  doc.save(`${type}_${invoice?.invoiceNumber || 'Draft'}.pdf`);
};
