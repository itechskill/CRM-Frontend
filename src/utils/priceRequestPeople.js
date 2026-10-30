export const priceRequestPersonLabel = user => {
  if (!user) return '';
  const name = user.name || user.fullName || 'Unknown';
  const label = String(user.label || user.priceRequestLabel || '').trim();
  return label ? `${name} - ${label}` : name;
};

