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
