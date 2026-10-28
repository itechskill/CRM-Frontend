export const PRICE_REQUEST_LABEL_ROLES = Object.freeze([
  'sales_member',
  'sales_rep',
  'sales_person',
  'sales_manager',
  'purchaser',
  'admin',
  'ceo'
]);

export const normalizeUserRole = role => String(role || '')
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, '_');

export const canEditPriceRequestLabelForRole = role => (
  PRICE_REQUEST_LABEL_ROLES.includes(normalizeUserRole(role))
);
