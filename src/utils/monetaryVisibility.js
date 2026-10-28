const FULL_MONETARY_ROLES = new Set(['finance', 'accountant', 'purchaser', 'admin', 'ceo']);

export const canViewFullMonetaryData = user => FULL_MONETARY_ROLES.has(String(user?.role || '').toLowerCase());
