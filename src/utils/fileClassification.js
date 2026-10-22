export const normalizeFileType = (value) => (
  value === 'Green' || value === 'Blue' ? value : ''
);

export const fileTypeLabel = (value, { detailed = false } = {}) => {
  const type = normalizeFileType(value);
  if (!type) return 'Unassigned';
  if (!detailed) return `${type} File`;
  return type === 'Blue' ? 'Blue File (Imported)' : 'Green File (Local)';
};

export const formatFileNumber = (value, fileType = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/\s+(?:Green|Blue)$/i.test(raw)) return raw;
  const type = normalizeFileType(fileType);
  return type ? `${raw} ${type}` : raw;
};

export const fileNumberCore = value => String(value || '').trim().replace(/\s+(?:Green|Blue)$/i, '').trim();

export const formatFileClassification = (value, fileType = '') => {
  const raw = String(value || '').trim();
  const type = normalizeFileType(fileType);
  if (type) return formatFileNumber(raw, type) || fileTypeLabel(type);
  return raw ? `${raw} — Unassigned` : 'Unassigned';
};

export const fileTypeTheme = (value) => {
  const type = normalizeFileType(value);
  if (type === 'Blue') {
    return { background: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' };
  }
  if (type === 'Green') {
    return { background: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' };
  }
  return { background: '#F8FAFC', color: '#64748B', border: '#CBD5E1', dot: '#94A3B8' };
};
