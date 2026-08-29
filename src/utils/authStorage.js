/**
 * Per-tab authentication storage (sessionStorage).
 * Prevents one browser tab's login from overwriting another tab's session.
 */

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';
const VIEW_PORTAL_KEY = 'crm_view_portal';
const ACTIVE_TAB_KEY = 'crm_active_tab';

function readSession(key) {
  return sessionStorage.getItem(key);
}

function writeSession(key, value) {
  if (value === null || value === undefined) {
    sessionStorage.removeItem(key);
  } else {
    sessionStorage.setItem(key, value);
  }
}

/** One-time migration from shared localStorage (legacy) into this tab's session. */
export function migrateLegacyAuth() {
  const sessionToken = readSession(TOKEN_KEY);
  if (!sessionToken) {
    const legacyToken = localStorage.getItem(TOKEN_KEY);
    const legacyUser = localStorage.getItem(USER_KEY);
    if (legacyToken) {
      writeSession(TOKEN_KEY, legacyToken);
      if (legacyUser) writeSession(USER_KEY, legacyUser);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getToken() {
  migrateLegacyAuth();
  return readSession(TOKEN_KEY);
}

export function setToken(token) {
  writeSession(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser() {
  migrateLegacyAuth();
  const raw = readSession(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user) {
  writeSession(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(USER_KEY);
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(VIEW_PORTAL_KEY);
  sessionStorage.removeItem(ACTIVE_TAB_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getViewPortal() {
  return readSession(VIEW_PORTAL_KEY);
}

export function setViewPortal(portal) {
  writeSession(VIEW_PORTAL_KEY, portal || '');
}

export function getActiveTab() {
  return readSession(ACTIVE_TAB_KEY) || 'dashboard';
}

export function setActiveTabStorage(tab) {
  writeSession(ACTIVE_TAB_KEY, tab || 'dashboard');
}

/** Admin/CEO may preview other portals; everyone else uses backend role only. */
export function resolveDisplayPortal(backendRole, frontendRole) {
  const role = (backendRole || '').toLowerCase();
  if (role === 'admin' || role === 'ceo') {
    const saved = getViewPortal();
    if (saved) return saved;
  }
  return frontendRole;
}

export function canSwitchPortal(backendRole) {
  const role = (backendRole || '').toLowerCase();
  return role === 'admin' || role === 'ceo';
}
