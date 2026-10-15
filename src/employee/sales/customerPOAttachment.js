export const CUSTOMER_PO_ATTACHMENT_ACCEPT = '.pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.bmp';

const ALLOWED_EXTENSIONS = /\.(pdf|xls|xlsx|png|jpe?g|webp|gif|bmp)$/i;
const ALLOWED_DATA_URL = /^data:(application\/pdf|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|image\/(png|jpeg|webp|gif|bmp));base64,/i;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp'
]);
const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024;

export const hasCustomerPOAttachment = (po) => Boolean(
  po?.uploadedDocument?.trim() &&
  po?.documentName?.trim() &&
  ALLOWED_EXTENSIONS.test(po.documentName.trim()) &&
  ALLOWED_DATA_URL.test(po.uploadedDocument.trim())
);

export const readCustomerPOAttachment = (file) => new Promise((resolve, reject) => {
  if (!file || !ALLOWED_EXTENSIONS.test(file.name) || (file.type && !ALLOWED_MIME_TYPES.has(file.type))) {
    reject(new Error('Attach the Customer PO as a PDF, Excel file, or screenshot.'));
    return;
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    reject(new Error('The Customer PO attachment must be 3 MB or smaller.'));
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve({ uploadedDocument: reader.result, documentName: file.name });
  reader.onerror = () => reject(new Error('The Customer PO attachment could not be read.'));
  reader.readAsDataURL(file);
});
