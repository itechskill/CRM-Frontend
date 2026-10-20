export const DOCUMENT_TYPES = Object.freeze({
  QUOTATION: 'Quotation',
  LOCAL_PO: 'LocalPO',
  GLOBAL_PO: 'GlobalPO'
});

export const COMPANY_OPTIONS = Object.freeze([
  { code: 'FORTLINE_ENTERPRISES', legalName: 'Fortline Enterprises', allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.LOCAL_PO] },
  { code: 'FORTLINE_PRIVATE_LIMITED', legalName: 'Fortline Private Limited', allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.LOCAL_PO, DOCUMENT_TYPES.GLOBAL_PO] },
  { code: 'HIGH_CLOUD_TRADING_LLC', legalName: 'High Cloud Trading LLC', allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.GLOBAL_PO] },
  { code: 'WWTS', legalName: 'Worldwide Techsolutions (WWTS)', allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.GLOBAL_PO] }
]);

export const companiesFor = (documentType) => COMPANY_OPTIONS.filter(company => company.allowedDocumentTypes.includes(documentType));

export const companyName = (record) => record?.issuingCompany?.legalName || '-';

export const defaultCompanyCode = (record, documentType) => {
  const code = record?.issuingCompany?.code || '';
  return companiesFor(documentType).some(company => company.code === code) ? code : '';
};
