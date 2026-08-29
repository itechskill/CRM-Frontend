import { getToken } from './authStorage';
export { getToken };

export const API_BASE = 'http://localhost:5000';

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && token !== 'undefined' && token !== 'null') {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: 'Invalid server response.' };
  }

  return { response, data };
}

export function authHeaders() {
  const token = getToken();
  return (token && token !== 'undefined' && token !== 'null')
    ? { Authorization: `Bearer ${token}` }
    : {};
}
