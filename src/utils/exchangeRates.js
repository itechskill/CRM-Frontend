export const SUPPORTED_CURRENCIES = Object.freeze(['PKR', 'USD', 'EUR', 'AED', 'GBP']);

export const exchangeRateFor = (rows, currency) => {
  if (currency === 'PKR') return 1;
  const row = (rows || []).find(item => item.currency === currency);
  return Number(row?.rateToPKR) > 0 ? Number(row.rateToPKR) : null;
};
