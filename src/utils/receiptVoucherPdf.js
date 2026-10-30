import { jsPDF } from 'jspdf';
import { loadDocumentLetterhead } from './documentLetterhead.js';
import { drawDetailsBox, drawProfessionalFrame, drawProfessionalTable, drawSummaryBox, pdfDate, pdfMoney, repeatProfessionalFrame } from './professionalDocumentPdf.js';

export const createReceiptVoucherPdf = async (payment, { assetLoader } = {}) => {
  const voucher = payment || {};
  const letterhead = await loadDocumentLetterhead(voucher, { assetLoader });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const drawFrame = () => drawProfessionalFrame(doc, letterhead, { title: 'Receipt Voucher' });
  drawFrame();
  const allocations = voucher.allocations?.length
    ? voucher.allocations
    : [{ invoiceNumber: voucher.invoiceNumber, salesOrderNumber: voucher.salesOrderNumber, amount: voucher.amount }];
  const detailsBottom = drawDetailsBox(doc, {
    leftTitle: 'RECEIVED FROM',
    rightTitle: 'VOUCHER DETAILS',
    leftLines: [
      voucher.customerName || '-',
      `Payment Method: ${voucher.paymentMethod || '-'}`,
      `Reference: ${voucher.reference || voucher.notes || '-'}`,
      `Received By: ${voucher.createdBy?.fullName || voucher.receivedByName || '-'}`
    ],
    rightRows: [
      ['RV Number', voucher.receiptVoucherNumber || '-'],
      ['Date', pdfDate(voucher.paymentDate)],
      ['Invoices', allocations.map(item => item.invoiceNumber).filter(Boolean).join(', ') || '-'],
      ['Amount', `PKR ${pdfMoney(voucher.amount)}`]
    ],
    height: 38
  });
  drawProfessionalTable(doc, {
    startY: detailsBottom + 5,
    head: ['Invoice Number', 'Sales Order', 'Amount Settled (PKR)'],
    body: allocations.map(item => [item.invoiceNumber || '-', item.salesOrderNumber || '-', pdfMoney(item.amount)]),
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 62 },
      2: { cellWidth: 62, halign: 'right' }
    },
    drawFrame
  });
  const y = doc.lastAutoTable.finalY + 7;
  drawSummaryBox(doc, {
    y,
    title: 'RECEIPT SUMMARY',
    rows: [['Total Received', `PKR ${pdfMoney(voucher.amount)}`, true]]
  });
  repeatProfessionalFrame(doc, drawFrame);
  return doc;
};

export const downloadReceiptVoucherPdf = async (payment, options = {}) => {
  const doc = await createReceiptVoucherPdf(payment, options);
  doc.save(`${payment?.receiptVoucherNumber || 'Receipt_Voucher'}.pdf`);
};
