export const initialsFromName = fullName => String(fullName || '')
  .trim()
  .split(/[^A-Za-z0-9]+/)
  .filter(Boolean)
  .map(part => part[0])
  .join('')
  .toUpperCase()
  .slice(0, 12) || 'SP';

export const sanitizeQuotationCode = value => String(value || '')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .slice(0, 12);
