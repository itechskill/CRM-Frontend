import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { letterheadFor } from './companies.js';

export const LEGACY_ISSUER_NAME = 'FORTLINE CRM';

export const getDocumentIssuerName = (record) => (
  record?.issuingCompany?.legalName?.trim() || LEGACY_ISSUER_NAME
);

const fitFontSize = (doc, text, maxWidth, maxSize, minSize) => {
  let fontSize = maxSize;
  doc.setFontSize(fontSize);

  while (fontSize > minSize && doc.getTextWidth(text) > maxWidth) {
    fontSize -= 0.5;
    doc.setFontSize(fontSize);
  }

  return fontSize;
};

export const drawSalesDocumentHeader = (doc, {
  issuerName,
  subtitle,
  documentTitle,
  referenceLabel,
  reference
}) => {
  const resolvedIssuerName = issuerName?.trim() || LEGACY_ISSUER_NAME;

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 36, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  fitFontSize(doc, resolvedIssuerName, 96, 20, 12);
  doc.text(resolvedIssuerName, 14, 18);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(subtitle, 14, 26);

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(documentTitle, 196, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254);
  doc.text(`${referenceLabel}: ${reference}`, 196, 26, { align: 'right' });
};

export const getClientContactLayout = (doc, {
  customer,
  email,
  phone,
  address,
  addressLabel = 'Address',
  maxWidth = 85
}) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const customerLines = doc.splitTextToSize(customer, maxWidth);
  const customerY = 58;
  const customerLineHeight = 4;
  const contactY = customerY + ((customerLines.length - 1) * customerLineHeight) + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const contactLines = doc.splitTextToSize(`Email: ${email}   -   Phone: ${phone}`, maxWidth);
  const contactLineHeight = 3.6;
  const addressY = contactY + (contactLines.length * contactLineHeight) + 1.5;
  const addressLines = doc.splitTextToSize(`${addressLabel}: ${address}`, maxWidth);
  const addressBottom = addressY + ((addressLines.length - 1) * contactLineHeight);

  return {
    customerLines,
    customerY,
    contactLines,
    contactY,
    addressLines,
    addressY,
    boxBottom: Math.max(82, addressBottom + 6)
  };
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

const money = value => `Rs. ${Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const roundMoney = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const firstFinite = (...values) => {
  for (const value of values) {
    if (value === '' || value === null || value === undefined) continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
};

export const getSalesOrderPdfFinancials = order => {
  const source = order || {};
  const itemSubtotal = Array.isArray(source.items)
    ? source.items.reduce((sum, item) => {
        const quantity = Math.max(1, Number(item?.quantity) || 1);
        const explicitTotal = firstFinite(item?.total);
        return sum + (explicitTotal ?? quantity * (Number(item?.unitPrice) || 0));
      }, 0)
    : 0;
  const discount = Math.max(0, firstFinite(source.discount) ?? 0);
  const gstAmount = Math.max(0, firstFinite(source.tax, source.gstAmount) ?? 0);
  const storedSubtotal = firstFinite(source.subtotal, source.totalAmount);
  const storedTotal = firstFinite(source.netAmount);
  const subtotal = Math.max(0, storedSubtotal ?? (itemSubtotal || Math.max(0, (storedTotal ?? 0) + discount - gstAmount)));
  const taxableBase = Math.max(0, subtotal - discount);
  const explicitGstPercentage = firstFinite(source.taxPercentage, source.gstPercentage, source.gstRate, source.taxRate);
  const gstPercentage = Math.max(0, explicitGstPercentage ?? (gstAmount > 0 && taxableBase > 0 ? (gstAmount / taxableBase) * 100 : 0));
  const total = Math.max(0, storedTotal ?? (taxableBase + gstAmount));

  return {
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    gstPercentage: Math.round((gstPercentage + Number.EPSILON) * 100) / 100,
    gstAmount: roundMoney(gstAmount),
    total: roundMoney(total)
  };
};

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
  doc.text('Official Sales Order', 105, 27, { align: 'center' });
};

const drawFooter = (doc, issuerName, footerImage) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('This is a system generated document and does not require a signature.', 105, 253.5, { align: 'center' });

  if (footerImage) {
    doc.saveGraphicsState();
    doc.addImage(footerImage, 'PNG', 10, 263, 190, 32.1, undefined, 'FAST');
    doc.restoreGraphicsState();
    return;
  }

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.4);
  doc.line(10, 266, 200, 266);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  fitFontSize(doc, issuerName, 180, 8, 6);
  doc.text(issuerName, 105, 275, { align: 'center' });
};

export const createSalesOrderPdf = async (order, { assetLoader = defaultAssetLoader } = {}) => {
  const salesOrder = order || {};
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuerName = getDocumentIssuerName(salesOrder);
  const configuredLetterhead = letterheadFor(salesOrder);
  let headerImage = null;
  let footerImage = null;

  if (configuredLetterhead) {
    try {
      [headerImage, footerImage] = await Promise.all([
        assetLoader(configuredLetterhead.header),
        assetLoader(configuredLetterhead.footer)
      ]);
    } catch (error) {
      console.warn('Sales Order letterhead assets unavailable; using plain company header.', error);
    }
  }

  const drawHeader = () => {
    if (headerImage) {
      doc.saveGraphicsState();
      doc.addImage(headerImage, 'PNG', 10, 3, 190, 35.9, undefined, 'FAST');
      doc.restoreGraphicsState();
    } else {
      drawPlainHeader(doc, issuerName);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('** SALES ORDER **', 105, 46, { align: 'center' });
  };

  drawHeader();

  const orderReference = salesOrder.orderReference || salesOrder.orderNumber || '';
  const customerName = salesOrder.clientName || salesOrder.customerName || '';
  const customerAddress = salesOrder.clientAddress || '';
  const orderDate = salesOrder.orderDate || salesOrder.creationDate || salesOrder.createdAt;
  const fileClassification = [salesOrder.fileNo, salesOrder.fileType].filter(Boolean).join(' ');

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
  const customerLines = doc.splitTextToSize(customerName, 94).slice(0, 2);
  doc.text(customerLines, 15, 63);
  const addressY = 63 + customerLines.length * 4.2;
  doc.text(doc.splitTextToSize(customerAddress ? `Address: ${customerAddress}` : '', 94).slice(0, 2), 15, addressY);

  const metaRows = [
    ['Sales Order #', orderReference],
    ['Date', dateLabel(orderDate)],
    ['Customer PO #', salesOrder.customerPONumber || ''],
    ['File # / Type', fileClassification]
  ];
  metaRows.forEach(([label, value], index) => {
    const y = 58 + index * 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, 124, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(String(value || ''), 50).slice(0, 2), 150, y);
  });

  const sourceItems = Array.isArray(salesOrder.items) && salesOrder.items.length
    ? salesOrder.items
    : [{
        sku: '',
        description: salesOrder.productSummary || '',
        quantity: 1,
        unitPrice: Number(salesOrder.totalAmount || salesOrder.netAmount || 0),
        total: Number(salesOrder.totalAmount || salesOrder.netAmount || 0)
      }];
  const tableRows = sourceItems.map((item, index) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.unitPrice) || 0;
    const amount = firstFinite(item.total) ?? quantity * unitPrice;
    return [index + 1, item.partNumber || item.sku || item.productCode || '', item.description || '', quantity, money(unitPrice), money(amount)];
  });

  autoTable(doc, {
    startY: 87,
    margin: { left: 14, right: 14, top: 51, bottom: 48 },
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
    if (y + height <= 247) return;
    doc.addPage();
    drawHeader();
    drawFooter(doc, issuerName, footerImage);
    y = 55;
  };

  ensureSpace(72);
  const financials = getSalesOrderPdfFinancials(salesOrder);
  const summaryX = 105;
  const summaryWidth = 91;
  const summaryRows = financials.discount > 0 ? 6 : 5;
  const summaryHeight = summaryRows * 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFillColor(230, 230, 230);
  doc.rect(summaryX, y, summaryWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SALES ORDER SUMMARY', summaryX + summaryWidth / 2, y + 4.5, { align: 'center' });
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
  summaryLine('Subtotal', money(financials.subtotal));
  if (financials.discount > 0) summaryLine('Discount', `-${money(financials.discount)}`);
  summaryLine('GST %', `${financials.gstPercentage}%`);
  summaryLine('GST Amount', money(financials.gstAmount));
  summaryLine('Total', money(financials.total), true);

  const statusY = y;
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, statusY, 84, summaryHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ORDER STATUS', 16, statusY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  const statusLines = [
    `Delivery: ${salesOrder.deliveryStatus || 'Not Delivered'}`,
    `Invoice: ${salesOrder.invoiceStatus || 'Not Invoiced'}`,
    `Payment: ${salesOrder.paymentStatus || 'Pending'}`,
    salesOrder.salePerson ? `Sales Representative: ${salesOrder.salePerson}` : ''
  ].filter(Boolean);
  statusLines.forEach((line, index) => doc.text(doc.splitTextToSize(line, 80).slice(0, 2), 16, statusY + 11 + index * 5));

  y += summaryHeight + 8;
  if (salesOrder.notes) {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Notes:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(salesOrder.notes, 182).slice(0, 4), 14, y + 6);
  }

  return doc;
};

export const downloadSalesOrderPdf = async order => {
  const doc = await createSalesOrderPdf(order);
  const reference = order?.orderReference || order?.orderNumber || 'Sales_Order';
  doc.save(`Sales_Order_${reference}.pdf`);
};
