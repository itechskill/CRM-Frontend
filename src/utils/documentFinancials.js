export const roundMoney = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const linePartNumber = item => String(item?.partNumber || '').trim();

export const calculateInvoiceTotals = ({ items = [], discount = 0, taxRate = 0 } = {}) => {
  const normalizedItems = (Array.isArray(items) ? items : []).map(item => {
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    const unitPrice = Math.max(0, Number(item?.unitPrice) || 0);
    return {
      ...item,
      partNumber: linePartNumber(item),
      quantity,
      unitPrice,
      total: roundMoney(quantity * unitPrice)
    };
  });
  const subtotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.total, 0));
  const normalizedDiscount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const taxableAmount = roundMoney(Math.max(0, subtotal - normalizedDiscount));
  const normalizedTaxRate = Math.max(0, Math.min(100, Number(taxRate) || 0));
  const tax = roundMoney(taxableAmount * normalizedTaxRate / 100);
  return {
    items: normalizedItems,
    subtotal,
    discount: normalizedDiscount,
    taxableAmount,
    taxRate: normalizedTaxRate,
    tax,
    amount: roundMoney(taxableAmount + tax)
  };
};
