const roundMoney = value => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const calculateQuotationFinancials = ({ items = [], discount = 0, taxPercentage = 0 }) => {
  const normalizedItems = (Array.isArray(items) ? items : []).map(item => {
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
    return {
      ...item,
      quantity,
      unitPrice,
      total: roundMoney(quantity * unitPrice)
    };
  });
  const totalAmount = roundMoney(normalizedItems.reduce((sum, item) => sum + item.total, 0));
  const normalizedDiscount = Math.min(totalAmount, Math.max(0, Number(discount) || 0));
  const normalizedTaxPercentage = Math.max(0, Math.min(100, Number(taxPercentage) || 0));
  const taxableAmount = roundMoney(Math.max(0, totalAmount - normalizedDiscount));
  const tax = roundMoney(taxableAmount * normalizedTaxPercentage / 100);
  const netAmount = roundMoney(taxableAmount + tax);
  const discountPercentage = totalAmount > 0
    ? Math.round((normalizedDiscount / totalAmount) * 10000) / 100
    : 0;
  return {
    items: normalizedItems,
    totalAmount,
    discount: normalizedDiscount,
    discountPercentage,
    taxableAmount,
    tax,
    taxPercentage: normalizedTaxPercentage,
    netAmount
  };
};

export const buildQuotationPayload = form => {
  const items = (Array.isArray(form.items) ? form.items : []).map(item => ({
    inventoryItem: item.inventoryItem || null,
    sku: String(item.sku || '').trim(),
    partNumber: String(item.partNumber || item.sku || '').trim(),
    description: String(item.description || '').trim(),
    quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
    unitPrice: Math.max(0, parseFloat(item.unitPrice) || 0)
  }));
  const financials = calculateQuotationFinancials({
    items,
    discount: form.discount === '' || form.discount === null ? 0 : form.discount,
    taxPercentage: form.taxPercentage === '' || form.taxPercentage === null ? 0 : form.taxPercentage
  });
  return {
    ...form,
    items: financials.items,
    totalAmount: financials.totalAmount,
    discount: financials.discount,
    discountPercentage: financials.discountPercentage,
    tax: financials.tax,
    taxPercentage: financials.taxPercentage,
    netAmount: financials.netAmount,
    productSummary: form.productSummary || financials.items.map(item => item.description).filter(Boolean).join(', '),
    creationDate: form.creationDate || null,
    validUntil: form.validUntil || null
  };
};

export const quotationGrandTotal = quotation => Number(
  quotation?.netAmount !== undefined && quotation?.netAmount !== null
    ? quotation.netAmount
    : quotation?.totalAmount || 0
);

