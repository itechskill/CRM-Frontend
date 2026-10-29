import { companyByCode, letterheadFor } from './companies.js';

export const defaultLetterheadAssetLoader = async path => {
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

export const companyRecordFor = record => {
  const source = record || {};
  if (source.issuingCompany?.code) return source;
  const candidates = [source.salesOrder, source.salesOrderId, source.order, source.invoice];
  return candidates.find(candidate => candidate?.issuingCompany?.code) || source;
};

export const issuerNameFor = record => {
  const source = companyRecordFor(record);
  const codeCompany = companyByCode(source?.issuingCompany?.code);
  return source?.issuingCompany?.legalName || codeCompany?.legalName || 'Fortline CRM';
};

export const loadDocumentLetterhead = async (record, { assetLoader = defaultLetterheadAssetLoader } = {}) => {
  const source = companyRecordFor(record);
  const configured = letterheadFor(source);
  if (!configured) return { source, issuerName: issuerNameFor(source), headerImage: null, footerImage: null };
  try {
    const [headerImage, footerImage] = await Promise.all([
      assetLoader(configured.header),
      assetLoader(configured.footer)
    ]);
    return { source, issuerName: issuerNameFor(source), headerImage, footerImage };
  } catch (error) {
    console.warn('Document letterhead assets unavailable; using a plain company header.', error);
    return { source, issuerName: issuerNameFor(source), headerImage: null, footerImage: null };
  }
};

const fitText = (doc, value, maxWidth, preferred = 18, minimum = 9) => {
  let size = preferred;
  doc.setFontSize(size);
  while (size > minimum && doc.getTextWidth(String(value || '')) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
};

export const drawLetterheadHeader = (doc, letterhead, { title = '', draft = false } = {}) => {
  if (!draft && letterhead.headerImage) {
    doc.addImage(letterhead.headerImage, 'PNG', 10, 3, 190, 35.9, undefined, 'FAST');
  } else {
    doc.setFillColor(248, 250, 252);
    doc.rect(10, 3, 190, 35.9, 'F');
    doc.setDrawColor(draft ? 180 : 30, draft ? 83 : 64, draft ? 9 : 175);
    doc.setLineWidth(0.6);
    doc.line(10, 38.9, 200, 38.9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    fitText(doc, letterhead.issuerName, 172, 19, 9);
    doc.text(letterhead.issuerName, 105, 18, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(title || 'Official Document', 105, 27, { align: 'center' });
  }
  if (draft) {
    doc.setFillColor(180, 83, 9);
    doc.roundedRect(164, 8, 29, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DRAFT', 178.5, 14.7, { align: 'center' });
  }
};

export const drawLetterheadFooter = (doc, letterhead, { draft = false, note = 'This is a system generated document and does not require a signature.' } = {}) => {
  if (!draft && letterhead.footerImage) {
    doc.addImage(letterhead.footerImage, 'PNG', 10, 263, 190, 32.1, undefined, 'FAST');
  } else {
    doc.setDrawColor(203, 213, 225);
    doc.line(10, 266, 200, 266);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    fitText(doc, letterhead.issuerName, 180, 8, 6);
    doc.text(letterhead.issuerName, 105, 275, { align: 'center' });
  }
  if (note) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(note, 105, 258, { align: 'center', maxWidth: 184 });
  }
};

export const isFinalizedInvoice = invoice => {
  const status = String(invoice?.status || '').trim();
  if (invoice?.isDraft === true) return false;
  return ['Finalized', 'Approved', 'Sent', 'Paid', 'Partially Paid', 'Overdue'].includes(status);
};
