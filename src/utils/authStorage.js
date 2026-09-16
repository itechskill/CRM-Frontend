/**
 * Per-tab authentication storage.
 *
 * IMPORTANT: Auth data (token, user, portal) is stored in sessionStorage ONLY.
 * sessionStorage is isolated per browser tab — so logging into Tab A does NOT
 * affect Tab B's session, and refreshing a tab restores its own session.
 *
 * Non-auth UI state (active tab) uses sessionStorage too, so each tab remembers
 * its own last-visited section independently.
 */

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';
const VIEW_PORTAL_KEY = 'crm_view_portal';
const ACTIVE_TAB_KEY = 'crm_active_tab';

// ─── sessionStorage helpers ───────────────────────────────────────────────────

function sessionRead(key) {
  try {
    const val = sessionStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return null;
    return val;
  } catch {
    return null;
  }
}

function sessionWrite(key, value) {
  try {
    if (value === null || value === undefined || value === 'undefined' || value === 'null') {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // sessionStorage may be unavailable in some private-browsing contexts
  }
}

// ─── Legacy migration ─────────────────────────────────────────────────────────

/**
 * One-time migration: if the user had data in localStorage from the old version,
 * copy it into this tab's sessionStorage and remove it from localStorage so it
 * no longer bleeds across tabs.
 */
export function migrateLegacyAuth() {
  try {
    const lsToken = localStorage.getItem(TOKEN_KEY);
    const lsUser  = localStorage.getItem(USER_KEY);

    // Only migrate if sessionStorage is empty (first tab open after upgrade)
    if (lsToken && !sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.setItem(TOKEN_KEY, lsToken);
      if (lsUser) sessionStorage.setItem(USER_KEY, lsUser);

      const lsPortal = localStorage.getItem(VIEW_PORTAL_KEY);
      if (lsPortal) sessionStorage.setItem(VIEW_PORTAL_KEY, lsPortal);

      const lsTab = localStorage.getItem(ACTIVE_TAB_KEY);
      if (lsTab) sessionStorage.setItem(ACTIVE_TAB_KEY, lsTab);
    }

    // Always clean up localStorage so it can't poison future tabs
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(VIEW_PORTAL_KEY);
    localStorage.removeItem(ACTIVE_TAB_KEY);
  } catch {
    // ignore
  }
}

// ─── Token ────────────────────────────────────────────────────────────────────

export function getToken() {
  const token = sessionRead(TOKEN_KEY);
  if (!token || !token.trim()) return null;
  return token.trim();
}

export function setToken(token) {
  sessionWrite(TOKEN_KEY, token);
}

// ─── User ─────────────────────────────────────────────────────────────────────

export function getUser() {
  const raw = sessionRead(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user) {
  sessionWrite(USER_KEY, JSON.stringify(user));
}

// ─── Clear (logout) ───────────────────────────────────────────────────────────

export function clearAuth() {
  // Clear this tab's sessionStorage
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(VIEW_PORTAL_KEY);
  sessionStorage.removeItem(ACTIVE_TAB_KEY);

  // Also nuke any residual localStorage entries (safety net)
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(VIEW_PORTAL_KEY);
    localStorage.removeItem(ACTIVE_TAB_KEY);
  } catch {
    // ignore
  }
}

// ─── View Portal ──────────────────────────────────────────────────────────────

export function getViewPortal() {
  return sessionRead(VIEW_PORTAL_KEY);
}

export function setViewPortal(portal) {
  sessionWrite(VIEW_PORTAL_KEY, portal || '');
}

// ─── Active Tab ───────────────────────────────────────────────────────────────

export function getActiveTab() {
  return sessionRead(ACTIVE_TAB_KEY) || 'dashboard';
}

export function setActiveTabStorage(tab) {
  sessionWrite(ACTIVE_TAB_KEY, tab || 'dashboard');
}

// ─── Portal resolution ────────────────────────────────────────────────────────

import { getFrontendRole } from '../config/roleConfig';

/** User remains strictly in their authorized portal environment. */
export function resolveDisplayPortal(backendRole, frontendRole) {
  return frontendRole;
}

export function canSwitchPortal(backendRole) {
  return false;
}
