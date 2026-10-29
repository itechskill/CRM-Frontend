import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { companyName, letterheadFor } from './companies.js';

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
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB');
};

const money = value => Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const fitFontSize = (doc, text, maxWidth, preferred = 18, minimum = 9) => {
  let size = preferred;
  doc.setFontSize(size);
  while (size > minimum && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
};

const drawPlainHeader = (doc, issuerName) => {
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 3, 190, 34, 'F');
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.6);
  doc.line(10, 37, 200, 37);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  fitFontSize(doc, issuerName, 176);
  doc.text(issuerName, 105, 18, { align: 'center' });
};

const drawFooter = (doc, issuerName, footerImage) => {
  if (footerImage) {
    doc.addImage(footerImage, 'PNG', 10, 263, 190, 32.1, undefined, 'FAST');
  } else {
    doc.setDrawColor(220, 38, 38);
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

export const createSupplierPoPdf = async (supplierPO, { assetLoader = defaultAssetLoader } = {}) => {
  const po = supplierPO || {};
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const issuerName = companyName(po) === '-' ? 'Fortline' : companyName(po);
  const configuredLetterhead = letterheadFor(po);
  let headerImage = null;
  let footerImage = null;

  if (configuredLetterhead) {
    try {
      [headerImage, footerImage] = await Promise.all([
        assetLoader(configuredLetterhead.header),
        assetLoader(configuredLetterhead.footer)
      ]);
    } catch (error) {
      console.warn('Supplier PO letterhead assets unavailable; using plain company header.', error);
    }
  }

  const drawHeader = () => {
    if (headerImage) doc.addImage(headerImage, 'PNG', 10, 3, 190, 35.9, undefined, 'FAST');
    else drawPlainHeader(doc, issuerName);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 0, 0);
    doc.text('SUPPLIER PURCHASE ORDER', 105, 46, { align: 'center' });
  };

  drawHeader();
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 52, 182, 27, 2, 2);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier', 17, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(String(po.supplierName || ''), 17, 65);
  doc.text(String(po.supplierCountry || ''), 17, 71);
  doc.setFont('helvetica', 'bold');
  doc.text('PO Number', 126, 59);
  doc.text('Date', 126, 65);
  doc.text('Type', 126, 71);
  doc.setFont('helvetica', 'normal');
  doc.text(String(po.poNumber || ''), 153, 59);
  doc.text(dateLabel(po.poDate || po.createdAt), 153, 65);
  doc.text(String(po.poType || ''), 153, 71);

  const currency = po.currency || 'PKR';
  const items = Array.isArray(po.items) ? po.items : [];
  const rows = items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const total = item.totalAmount !== undefined ? Number(item.totalAmount) : quantity * unitPrice;
    return [index + 1, item.partNumber || '', item.productName || item.description || '', item.description || '', quantity, money(unitPrice), money(total)];
  });

  autoTable(doc, {
    startY: 84,
    margin: { left: 14, right: 14, top: 52, bottom: 47 },
    tableWidth: 182,
    head: [['#', 'Part Number', 'Item', 'Description', 'QTY', `Unit Price (${currency})`, `Amount (${currency})`]],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.3 },
    styles: { fontSize: 8.5, cellPadding: 2.2, valign: 'middle', lineColor: [100, 116, 139], lineWidth: 0.2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 34 },
      3: { cellWidth: 39 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 30, halign: 'right' }
    },
    didDrawPage: data => {
      if (data.pageNumber > 1) drawHeader();
      drawFooter(doc, issuerName, footerImage);
    }
  });

  let y = doc.lastAutoTable.finalY + 7;
  if (y > 224) {
    doc.addPage();
    drawHeader();
    drawFooter(doc, issuerName, footerImage);
    y = 57;
  }

  const subtotal = Number(po.subtotal ?? po.totalAmount ?? po.total) || 0;
  const taxRate = Number(po.poType === 'Global' ? po.vatRate : po.gstRate) || 0;
  const taxAmount = Number(po.poType === 'Global' ? po.vatAmount : po.gstAmount) || 0;
  const grandTotal = Number(po.total ?? po.totalAmount) || subtotal + taxAmount;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: ${currency} ${money(subtotal)}`, 196, y, { align: 'right' });
  if (taxRate > 0 || taxAmount > 0) {
    doc.text(`${po.poType === 'Global' ? 'VAT' : 'GST'} (${money(taxRate)}%): ${currency} ${money(taxAmount)}`, 196, y + 6, { align: 'right' });
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${currency} ${money(grandTotal)}`, 196, y + (taxRate > 0 || taxAmount > 0 ? 12 : 6), { align: 'right' });

  if (po.paymentTerms || po.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const terms = [po.paymentTerms ? `Payment Terms: ${po.paymentTerms}` : '', po.notes ? `Notes: ${po.notes}` : ''].filter(Boolean);
    doc.text(doc.splitTextToSize(terms.join('\n'), 112), 14, y);
  }

  return doc;
};

export const downloadSupplierPoPdf = async supplierPO => {
  const doc = await createSupplierPoPdf(supplierPO);
  doc.save(`Supplier_PO_${supplierPO?.poNumber || 'document'}.pdf`);
};
