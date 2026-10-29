import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawLetterheadFooter, drawLetterheadHeader, loadDocumentLetterhead } from './documentLetterhead.js';

const money = value => Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const createReceiptVoucherPdf = async (payment, { assetLoader } = {}) => {
  const voucher = payment || {};
  const letterhead = await loadDocumentLetterhead(voucher, { assetLoader });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawLetterheadHeader(doc, letterhead, { title: 'Receipt Voucher' });
  drawLetterheadFooter(doc, letterhead);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('RECEIPT VOUCHER', 105, 47, { align: 'center' });
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 55, 182, 46, 2.5, 2.5, 'FD');
  doc.setFontSize(9);
  const rows = [
    ['RV Number', voucher.receiptVoucherNumber || '-'],
    ['Date', voucher.paymentDate ? new Date(voucher.paymentDate).toLocaleDateString('en-GB') : '-'],
    ['Received From', voucher.customerName || '-'],
    ['Amount', `PKR ${money(voucher.amount)}`],
    ['Payment Method', voucher.paymentMethod || '-'],
    ['Reference', voucher.reference || voucher.notes || '-'],
    ['Invoice(s)', (voucher.allocations?.length ? voucher.allocations.map(item => item.invoiceNumber).filter(Boolean).join(', ') : voucher.invoiceNumber) || '-'],
    ['Received By', voucher.createdBy?.fullName || voucher.receivedByName || '-']
  ];
  rows.forEach(([label, value], index) => {
    const y = 64 + index * 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(String(value), 120).slice(0, 2), 65, y);
  });
  const allocations = voucher.allocations?.length ? voucher.allocations : [{ invoiceNumber: voucher.invoiceNumber, salesOrderNumber: voucher.salesOrderNumber, amount: voucher.amount }];
  autoTable(doc, {
    startY: 110,
    margin: { left: 14, right: 14, bottom: 43 },
    head: [['Invoice Number', 'Sales Order', 'Amount Settled (PKR)']],
    body: allocations.map(item => [item.invoiceNumber || '-', item.salesOrderNumber || '-', `PKR ${money(item.amount)}`]),
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 }
  });
  return doc;
};

export const downloadReceiptVoucherPdf = async (payment, options = {}) => {
  const doc = await createReceiptVoucherPdf(payment, options);
  doc.save(`${payment?.receiptVoucherNumber || 'Receipt_Voucher'}.pdf`);
};
