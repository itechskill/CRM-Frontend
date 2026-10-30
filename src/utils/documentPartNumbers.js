const text = value => String(value || '').trim();
const idText = value => text(value?._id || value);

export const ownPartNumber = line => text(line?.partNumber);

const idsFor = line => [
  line?._id,
  line?.orderItemId,
  line?.sourceItemId,
  line?.productId,
  line?.inventoryItem,
  line?.inventoryItemId
].map(idText).filter(Boolean);

const findSourceLine = (line, index, rows) => {
  const source = Array.isArray(rows) ? rows : [];
  const targetIds = new Set(idsFor(line));
  const byId = targetIds.size && source.find(candidate => idsFor(candidate).some(id => targetIds.has(id)));
  if (byId) return byId;
  const description = text(line?.description || line?.product || line?.productName || line?.name).toLowerCase();
  if (description) {
    const matches = source.filter(candidate => text(candidate?.description || candidate?.product || candidate?.productName || candidate?.name).toLowerCase() === description);
    if (matches.length === 1) return matches[0];
  }
  return source[index] || null;
};

export const documentSourceCollections = record => [
  record?.salesOrder?.items,
  record?.salesOrderId?.items,
  record?.deliveryNote?.items,
  record?.deliveryNoteId?.items,
  record?.supplierPO?.items,
  record?.supplierPOId?.items,
  record?.productFile?.products,
  record?.customerPO?.items,
  record?.quotation?.items
].filter(rows => Array.isArray(rows) && rows.length);

export const resolvePartNumber = (line, index = 0, record = {}, sourceCollections = documentSourceCollections(record)) => {
  const direct = ownPartNumber(line);
  if (direct) return direct;
  for (const rows of sourceCollections) {
    const inherited = ownPartNumber(findSourceLine(line, index, rows));
    if (inherited) return inherited;
  }
  const inventory = line?.inventoryItem && typeof line.inventoryItem === 'object' ? line.inventoryItem : null;
  return ownPartNumber(inventory);
};

export const resolveDocumentLines = (record, key = 'items') => {
  const rows = Array.isArray(record?.[key]) ? record[key] : [];
  const sources = documentSourceCollections(record);
  return rows.map((line, index) => ({ ...line, partNumber: resolvePartNumber(line, index, record, sources) }));
};
