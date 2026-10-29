import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDocumentIssuerName } from './salesDocumentPdfLayout.js';
import { letterheadFor } from './companies.js';

const DEFAULT_TERMS = Object.freeze({
  currency: 'Pakistani Rupee',
  availability: 'Ex-stock (Limited)',
  paymentTerms: '100% Advance',
  priceValidity: '5 calendar days',
  commercialNote: 'In case the Govt. imposes any additional duties/taxes/any change in Pak Rs. customer has to pay the difference.'
});

const fitFontSize = (doc, text, maxWidth, preferred = 18, minimum = 9) => {
  let size = preferred;
  doc.setFontSize(size);
  while (size > minimum && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
};

const defaultAssetLoader = async path => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load letterhead asset: ${path}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

const dateLabel = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'short' });
  return `${day}-${month}-${date.getFullYear()}`;
};

const money = value => Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const drawPlainHeader = (doc, issuerName) => {
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 3, 190, 34, 'F');
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.6);
  doc.line(10, 37, 200, 37);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  fitFontSize(doc, issuerName, 176, 19, 9);
  doc.text(issuerName, 105, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Official Commercial Quotation', 105, 27, { align: 'center' });
};

const drawFooter = (doc, issuerName, footerImage) => {
  if (footerImage) {
    doc.addImage(footerImage, 'PNG', 10, 263, 190, 32.1, undefined, 'FAST');
  } else {
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.4);
    doc.line(10, 266, 200, 266);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    fitFontSize(doc, issuerName, 180, 8, 6);
    doc.text(issuerName, 105, 275, { align: 'center' });
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('This is a system generated document and does not require a signature.', 105, 253.5, { align: 'center' });
};

export const createQuotationPdf = async (quotation, { assetLoader = defaultAssetLoader } = {}) => {
  const q = quotation || {};
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuerName = getDocumentIssuerName(q);
  const configuredLetterhead = letterheadFor(q);
  let headerImage = null;
  let footerImage = null;
  if (configuredLetterhead) {
    try {
      [headerImage, footerImage] = await Promise.all([
        assetLoader(configuredLetterhead.header),
        assetLoader(configuredLetterhead.footer)
      ]);
    } catch (error) {
      console.warn('Quotation letterhead assets unavailable; using plain company header.', error);
    }
  }

  const drawHeader = () => {
    if (headerImage) doc.addImage(headerImage, 'PNG', 10, 3, 190, 35.9, undefined, 'FAST');
    else drawPlainHeader(doc, issuerName);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('** QUOTATION **', 105, 46, { align: 'center' });
  };

  drawHeader();

  const quotationNumber = q.orderReference || q.quotationNumber || '';
  const customerName = q.clientName || q.customerName || '';
  const customerAddress = q.clientAddress || '';
  const currency = q.currency || DEFAULT_TERMS.currency;
  const reference = q.reference || '';

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(14, 53, 98, 29);
  doc.setFillColor(230, 230, 230);
  doc.rect(14, 53, 98, 5, 'F');
  doc.line(14, 58, 112, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CUSTOMER', 15, 57);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(doc.splitTextToSize(customerName, 94), 15, 63);
  const customerNameLines = doc.splitTextToSize(customerName, 94).length;
  doc.text(doc.splitTextToSize(customerAddress ? `Address: ${customerAddress}` : '', 94), 15, 63 + customerNameLines * 4.2);

  const metaRows = [
    ['Quotation #', quotationNumber],
    ['Date', dateLabel(q.creationDate || q.createdAt)],
    ['Currency', currency],
    ['Reference:', reference]
  ];
  metaRows.forEach(([label, value], index) => {
    const y = 58 + index * 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, 130, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(String(value || ''), 49);
    doc.text(lines.slice(0, 2), 151, y);
  });

  const items = q.items?.length ? q.items : [{
    sku: '',
    description: q.productSummary || '',
    quantity: 1,
    unitPrice: Number(q.totalAmount || q.netAmount || 0)
  }];
  const tableRows = items.map((item, index) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.unitPrice) || 0;
    const amount = item.total !== undefined ? Number(item.total) : quantity * unitPrice;
    return [index + 1, item.partNumber || item.sku || '', item.description || '', quantity, money(unitPrice), money(amount)];
  });

  autoTable(doc, {
    startY: 87,
    margin: { left: 14, right: 14, top: 51, bottom: 43 },
    tableWidth: 182,
    head: [['S.no', 'Part Number', 'Description', 'QTY', 'Unit Price', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.35 },
    styles: { fontSize: 8.5, cellPadding: 2.4, valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.25, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 74, halign: 'left' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    },
    didDrawPage: data => {
      if (data.pageNumber > 1) drawHeader();
      drawFooter(doc, issuerName, footerImage);
    }
  });

  let y = doc.lastAutoTable.finalY + 7;
  const ensureSpace = height => {
    if (y + height <= 250) return;
    doc.addPage();
    drawHeader();
    drawFooter(doc, issuerName, footerImage);
    y = 55;
  };

  ensureSpace(82);
  const subtotal = Number(q.totalAmount) || items.reduce((sum, item) => sum + (Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))), 0);
  const discount = Number(q.discount) || 0;
  const gstPercentage = q.taxPercentage === undefined || q.taxPercentage === null ? 0 : Number(q.taxPercentage) || 0;
  const gst = Number(q.tax) || 0;
  const grandTotal = q.netAmount === undefined || q.netAmount === null ? subtotal - discount + gst : Number(q.netAmount);

  const summaryX = 105;
  const summaryWidth = 91;
  const summaryRows = discount > 0 ? 5 : 4;
  const summaryHeight = summaryRows * 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFillColor(230, 230, 230);
  doc.rect(summaryX, y, summaryWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('QUOTATION SUMMARY', summaryX + summaryWidth / 2, y + 4.5, { align: 'center' });
  let summaryY = y + 6;
  const summaryLine = (label, value, bold = false) => {
    doc.setFillColor(bold ? 230 : 255, bold ? 230 : 255, bold ? 230 : 255);
    doc.rect(summaryX, summaryY, summaryWidth, 6, 'FD');
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.text(label, summaryX + 1, summaryY + 4.3);
    doc.text(value, summaryX + summaryWidth - 1, summaryY + 4.3, { align: 'right' });
    summaryY += 6;
  };
  summaryLine('Sub Total', money(subtotal));
  if (discount > 0) summaryLine('Discount', `-${money(discount)}`);
  summaryLine(`GST ${gstPercentage}%`, money(gst));
  summaryLine('Grand Total with Taxes', money(grandTotal), true);

  y += summaryHeight + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Commercial Terms:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const terms = [
    `Availability: ${q.availability || DEFAULT_TERMS.availability}`,
    `Payment Terms: ${q.paymentTerms || DEFAULT_TERMS.paymentTerms}`,
    `Price Validity: ${q.priceValidity || DEFAULT_TERMS.priceValidity}`,
    `Note: ${q.commercialNote || q.notes || DEFAULT_TERMS.commercialNote}`
  ];
  terms.forEach(term => {
    const lines = doc.splitTextToSize(term, 182);
    doc.text(lines, 14, y + 6);
    y += Math.max(5, lines.length * 4.2);
  });

  return doc;
};

export const downloadQuotationPdf = async quotation => {
  const doc = await createQuotationPdf(quotation);
  const reference = quotation?.orderReference || quotation?.quotationNumber || 'Quotation';
  doc.save(`Quotation_${reference}.pdf`);
};

export { DEFAULT_TERMS };
