import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const dateLabel = value => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB');
};

export const getGrnDocumentType = grn => {
  const poType = String(grn?.supplierPO?.poType || grn?.poType || '').toLowerCase();
  const fileType = String(grn?.salesOrder?.fileType || grn?.fileType || '').toLowerCase();
  if (poType === 'global' || poType === 'international' || fileType === 'blue') return 'Global';
  return 'Local';
};

const value = (...candidates) => candidates.find(candidate => candidate !== undefined && candidate !== null && String(candidate).trim() !== '') || '-';

export const createGrnPdf = grn => {
  const source = grn || {};
  const documentType = getGrnDocumentType(source);
  const isLocal = documentType === 'Local';
  const accent = isLocal ? [5, 150, 105] : [37, 99, 235];
  const po = source.supplierPO && typeof source.supplierPO === 'object' ? source.supplierPO : {};
  const order = source.salesOrder && typeof source.salesOrder === 'object' ? source.salesOrder : {};
  const issuer = value(po.issuingCompany?.legalName, order.issuingCompany?.legalName, source.issuingCompany?.legalName, 'Fortline');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(...accent);
  doc.rect(0, 0, 210, 31, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text(`${documentType.toUpperCase()} GOODS RECEIVED NOTE`, 14, 15);
  doc.setFontSize(11);
  doc.text(String(value(source.grnNumber, 'GRN')), 14, 24);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  const supplierReference = value(source.supplierBillNumber, po.goodsReceiptReference);
  const supplierReceiptDate = value(source.supplierBillDate, po.goodsReceiptDate);
  const metadataRows = [
    [['GRN number', value(source.grnNumber)], ['Date received', dateLabel(value(source.grnDate, source.createdAt))]],
    [['Issuing company', issuer], ['Supplier', value(source.supplierName, po.supplierName)]],
    [['Supplier PO number', value(source.poNumber, po.poNumber)], ['Sales Order number', value(source.salesOrderNumber, order.orderNumber, order.orderReference)]],
    [['Supplier GRN reference', supplierReference], ['Supplier receipt date', supplierReceiptDate === '-' ? '-' : dateLabel(supplierReceiptDate)]],
    [['Received by', value(source.createdByName, source.receivedByName)], null]
  ];

  let y = 40;
  metadataRows.forEach(row => {
    let maxLines = 1;
    row.forEach((entry, column) => {
      if (!entry) return;
      const [label, text] = entry;
      const x = column === 0 ? 14 : 108;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accent);
      doc.text(`${label}:`, x, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(String(text), 82).slice(0, 2);
      maxLines = Math.max(maxLines, lines.length);
      doc.text(lines, x, y + 5);
    });
    y += 11 + (maxLines - 1) * 4;
  });

  const rows = (Array.isArray(source.items) ? source.items : []).map((item, index) => [
    index + 1,
    value(item.partNumber, item.sku, ''),
    value(item.productName, item.description, 'Item'),
    Number(item.orderedQty ?? item.quantity ?? 0),
    Number(item.receivedQty ?? item.quantityReceived ?? item.quantity ?? 0)
  ]);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: 14, right: 14 },
    head: [['#', 'Part Number', 'Description', 'Ordered Qty', 'Received Qty']],
    body: rows.length ? rows : [['', '', 'No items recorded', '', '']],
    theme: 'grid',
    headStyles: { fillColor: accent, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 79 },
      3: { cellWidth: 29, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' }
    }
  });

  const footerY = Math.min(282, Math.max(265, doc.lastAutoTable.finalY + 18));
  doc.setDrawColor(...accent);
  doc.line(14, footerY, 196, footerY);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Quantity-only system generated Goods Received Note.', 105, footerY + 6, { align: 'center' });
  return doc;
};

export const downloadGrnPdf = grn => {
  const type = getGrnDocumentType(grn);
  const number = String(grn?.grnNumber || 'GRN').replace(/[^A-Za-z0-9_-]+/g, '_');
  const doc = createGrnPdf(grn);
  doc.save(`${type}_GRN_${number}.pdf`);
};
