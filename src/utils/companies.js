export const DOCUMENT_TYPES = Object.freeze({
  QUOTATION: 'Quotation',
  LOCAL_PO: 'LocalPO',
  GLOBAL_PO: 'GlobalPO'
});

export const COMPANY_OPTIONS = Object.freeze([
  {
    code: 'FORTLINE_ENTERPRISES',
    legalName: 'Fortline Enterprises',
    letterhead: {
      header: '/letterheads/fortline-enterprises-header.png',
      footer: '/letterheads/fortline-enterprises-footer.png'
    },
    allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.LOCAL_PO, DOCUMENT_TYPES.GLOBAL_PO]
  },
  {
    code: 'FORTLINE_PRIVATE_LIMITED',
    legalName: 'Fortline Private Limited',
    letterhead: {
      header: '/letterheads/fortline-private-limited-header.png',
      footer: '/letterheads/fortline-private-limited-footer.png'
    },
    allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.LOCAL_PO, DOCUMENT_TYPES.GLOBAL_PO]
  },
  {
    code: 'HIGH_CLOUD_TRADING_LLC',
    legalName: 'High Cloud Trading LLC',
    letterhead: {
      header: '/letterheads/high-cloud-trading-llc-header.png',
      footer: '/letterheads/high-cloud-trading-llc-footer.png'
    },
    allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.LOCAL_PO, DOCUMENT_TYPES.GLOBAL_PO]
  },
  {
    code: 'WWTS',
    legalName: 'Worldwide Techsolutions (WWTS)',
    letterhead: {
      header: '/letterheads/wwts-header.png',
      footer: '/letterheads/wwts-footer.png'
    },
    allowedDocumentTypes: [DOCUMENT_TYPES.QUOTATION, DOCUMENT_TYPES.LOCAL_PO, DOCUMENT_TYPES.GLOBAL_PO]
  }
]);

export const companiesFor = (documentType) => COMPANY_OPTIONS.filter(company => company.allowedDocumentTypes.includes(documentType));

export const companyName = (record) => record?.issuingCompany?.legalName || '-';

export const companyByCode = code => COMPANY_OPTIONS.find(company => company.code === code) || null;

export const letterheadFor = record => companyByCode(record?.issuingCompany?.code)?.letterhead || null;

export const defaultCompanyCode = (record, documentType) => {
  const code = record?.issuingCompany?.code || '';
  return companiesFor(documentType).some(company => company.code === code) ? code : '';
};
