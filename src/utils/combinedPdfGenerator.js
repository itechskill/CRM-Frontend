import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a Single Combined PDF for the Accounts 4-Document Package
 * Order of documents:
 * 1. Finalized Invoice
 * 2. Delivery Note
 * 3. Undertaking
 * 4. Goods Declaration Form
 */
export function generateCombinedDocumentPackagePDF(packageData) {
  const { order, invoice, deliveryNote, undertaking, goodsDeclaration } = packageData;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const formatPKR = (num) => `PKR ${Number(num || 0).toLocaleString('en-PK')}`;

  // Helper Header
  const addDocumentHeader = (title, subTitle, docNumber) => {
    // Header Banner
    doc.setFillColor(30, 64, 175); // #1E40AF Navy
    doc.rect(0, 0, 210, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('FORTLINE CRM & COMMERCIAL SOLUTIONS', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(title.toUpperCase(), 14, 19);

    if (docNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`REF: ${docNumber}`, 196, 15, { align: 'right' });
    }

    doc.setTextColor(15, 23, 42); // Reset text color
  };

  // Helper Footer
  const addDocumentFooter = (pageLabel) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 280, 196, 280);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Fortline CRM Master Document Package • Authorized Commercial Record', 14, 285);
    doc.text(pageLabel, 196, 285, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: FINALIZED INVOICE
  // ==========================================
  addDocumentHeader('Official Finalized Invoice', 'Commercial Invoice', invoice?.invoiceNumber || `INV-${order.orderNumber}`);

  let y = 32;

  // Invoice Details Box
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE TO:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(invoice?.clientName || order.clientName || 'Customer', 14, y + 5);
  doc.text(invoice?.customerEmail || order.clientEmail || 'Email: N/A', 14, y + 10);
  doc.text(invoice?.customerPhone || order.clientPhone || 'Phone: N/A', 14, y + 15);
  if (invoice?.customerAddress || order.clientAddress) {
    doc.text(`Address: ${invoice?.customerAddress || order.clientAddress}`, 14, y + 20);
  }

  // Right Side Details
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE META:', 130, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice Number: ${invoice?.invoiceNumber || 'INV-PENDING'}`, 130, y + 5);
  doc.text(`Sales Order #: ${order.orderNumber || order.orderReference}`, 130, y + 10);
  doc.text(`Issue Date: ${invoice?.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 130, y + 15);
  doc.text(`Payment Terms: ${invoice?.paymentTerms || 'Net 30'}`, 130, y + 20);
  doc.text(`Status: ${invoice?.status || 'Finalized'}`, 130, y + 25);

  y += 32;

  // Invoice Items Table
  const invoiceItems = (invoice?.items || order.items || []).map((item, idx) => [
    idx + 1,
    item.description || item.productName || 'Item',
    item.quantity || 1,
    formatPKR(item.unitPrice || 0),
    formatPKR(item.total || (item.quantity * item.unitPrice) || 0)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price (PKR)', 'Total Amount (PKR)']],
    body: invoiceItems,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(120, finalY, 76, 28, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Subtotal: ${formatPKR(invoice?.subtotal || order.totalAmount || 0)}`, 124, finalY + 7);
  doc.text(`Tax: ${formatPKR(invoice?.tax || 0)}`, 124, finalY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 64, 175);
  doc.text(`Total Amount: ${formatPKR(invoice?.amount || order.netAmount || order.totalAmount || 0)}`, 124, finalY + 23);

  doc.setTextColor(15, 23, 42);
  addDocumentFooter('Document 1 of 4 • Finalized Invoice');

  // ==========================================
  // PAGE 2: DELIVERY NOTE
  // ==========================================
  doc.addPage();
  addDocumentHeader('Official Delivery Note', 'Goods Delivery Receipt', deliveryNote?.deliveryNoteNumber || `DN-${order.orderNumber}`);

  y = 32;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVER TO:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(deliveryNote?.clientName || order.clientName || 'Customer', 14, y + 5);
  doc.text(`Shipping Address: ${deliveryNote?.customerAddress || order.clientAddress || 'As per Sales Contract'}`, 14, y + 10);
  doc.text(`Contact Phone: ${deliveryNote?.customerPhone || order.clientPhone || 'N/A'}`, 14, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY META:', 130, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Delivery Note #: ${deliveryNote?.deliveryNoteNumber || 'DN-PENDING'}`, 130, y + 5);
  doc.text(`Sales Order #: ${order.orderNumber || order.orderReference}`, 130, y + 10);
  doc.text(`Dispatched Date: ${deliveryNote?.createdAt ? new Date(deliveryNote.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 130, y + 15);
  doc.text(`File Type: ${order.fileType || 'Green'}`, 130, y + 20);

  y += 28;

  const dnItems = (deliveryNote?.items || order.items || []).map((item, idx) => [
    idx + 1,
    item.description || item.productName || 'Delivered Product',
    item.quantity || 1,
    'Good / Inspected'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Delivered Item Description', 'Delivered Qty', 'Condition']],
    body: dnItems,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' } }
  });

  const dnFinalY = doc.lastAutoTable.finalY + 12;

  // Signature Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Received in Good Condition By:', 14, dnFinalY);
  doc.line(14, dnFinalY + 12, 80, dnFinalY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Customer Signature & Stamp', 14, dnFinalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Dispatched By:', 130, dnFinalY);
  doc.line(130, dnFinalY + 12, 196, dnFinalY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Fortline Warehouse / Support Officer', 130, dnFinalY + 16);

  addDocumentFooter('Document 2 of 4 • Delivery Note');

  // ==========================================
  // PAGE 3: UNDERTAKING
  // ==========================================
  doc.addPage();
  addDocumentHeader('Company Undertaking Form', 'Official Warranty & Compliance Declaration', undertaking?.undertakingNumber);

  y = 36;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('UNDERTAKING & GUARANTEE DECLARATION', 105, y, { align: 'center' });

  y += 12;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const p1 = `We, Fortline CRM & Commercial Solutions, hereby solemnly declare and undertake that all products, goods, and machinery delivered under Sales Order #${order.orderNumber || order.orderReference} to M/s ${order.clientName} meet all required technical specifications, international quality standards, and warranty terms agreed upon in the commercial contract.`;
  const splitP1 = doc.splitTextToSize(p1, 180);
  doc.text(splitP1, 14, y);

  y += splitP1.length * 6 + 6;

  const p2 = `Furthermore, we guarantee that the goods are brand new, genuine, and free from any legal encumbrance, manufacturing defect, or title defect. Any operational issue covered under warranty shall be serviced promptly as per contract terms.`;
  const splitP2 = doc.splitTextToSize(p2, 180);
  doc.text(splitP2, 14, y);

  y += splitP2.length * 6 + 10;

  // Particulars Box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('UNDERTAKING PARTICULARS:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Undertaking Ref #: ${undertaking?.undertakingNumber}`, 18, y + 14);
  doc.text(`Sales Order Reference: ${order.orderNumber || order.orderReference}`, 18, y + 21);
  doc.text(`Client Name: ${order.clientName}`, 18, y + 28);
  doc.text(`Issue Date: ${undertaking?.issuedDate ? new Date(undertaking.issuedDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 110, y + 14);
  doc.text(`File Classification: ${order.fileType || 'Green'} File`, 110, y + 21);

  y += 50;

  // Stamp & Signatures
  doc.setFont('helvetica', 'bold');
  doc.text('For & On Behalf of Fortline CRM:', 14, y);
  doc.line(14, y + 15, 85, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Commercial Director', 14, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Corporate Seal & Official Stamp:', 130, y);
  doc.rect(130, y + 4, 45, 20);
  doc.setFontSize(8);
  doc.text('[ OFFICIAL SEAL ]', 152.5, y + 15, { align: 'center' });

  addDocumentFooter('Document 3 of 4 • Company Undertaking');

  // ==========================================
  // PAGE 4: GOODS DECLARATION FORM
  // ==========================================
  doc.addPage();
  addDocumentHeader('Goods Declaration Form', 'Customs & Product Declaration', goodsDeclaration?.gdNumber);

  y = 36;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('GOODS & CUSTOMS DECLARATION FORM (GD)', 105, y, { align: 'center' });

  y += 10;
  doc.setTextColor(15, 23, 42);

  // GD Fields Box
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 45, 'F');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('GD Number:', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(goodsDeclaration?.gdNumber || 'GD-PENDING', 60, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text('GD Date:', 18, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(goodsDeclaration?.gdDate ? new Date(goodsDeclaration.gdDate).toLocaleDateString() : new Date().toLocaleDateString(), 60, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('Customs Port Name:', 18, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(goodsDeclaration?.portName || 'Karachi Customs Port', 60, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Declaration Type:', 18, y + 32);
  doc.setFont('helvetica', 'normal');
  doc.text(goodsDeclaration?.declarationType || 'Commercial Import & Customs Clearance', 60, y + 32);

  doc.setFont('helvetica', 'bold');
  doc.text('Consignee / Importer:', 18, y + 40);
  doc.setFont('helvetica', 'normal');
  doc.text(goodsDeclaration?.consignee || order.clientName, 60, y + 40);

  y += 52;

  // Declaration Items Table
  const gdItems = (order.items || []).map((item, idx) => [
    idx + 1,
    item.description || item.productName || 'Declared Item',
    item.quantity || 1,
    order.fileType || 'Green',
    formatPKR(item.total || (item.quantity * item.unitPrice) || 0)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Declared Commodity Description', 'Qty', 'Category', 'Declared Value (PKR)']],
    body: gdItems,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'center' }, 4: { halign: 'right' } }
  });

  const gdFinalY = doc.lastAutoTable.finalY + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Customs & Commercial Verification:', 14, gdFinalY);
  doc.setFont('helvetica', 'normal');
  doc.text('This document verifies that the above declared goods have passed customs inspection and internal commercial audit.', 14, gdFinalY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Verified By:', 14, gdFinalY + 18);
  doc.line(14, gdFinalY + 28, 85, gdFinalY + 28);
  doc.setFont('helvetica', 'normal');
  doc.text('Customs Clearing & Procurement Compliance Officer', 14, gdFinalY + 33);

  addDocumentFooter('Document 4 of 4 • Goods Declaration Form (GD)');

  // Save File
  const filename = `Fortline_Complete_Document_Package_${order.orderNumber || order.orderReference}.pdf`;
  doc.save(filename);
}
