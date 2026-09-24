import { getToken } from './authStorage';
export { getToken };

// In local development (npm run dev), uses http://localhost:5000
// In production deployment, uses https://nexuscrm-backend-six.vercel.app
export const API_BASE = import.meta.env?.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://nexuscrm-backend-six.vercel.app');

export async function apiRequest(path, optionsOrMethod = {}, possibleBody = null) {
  let options = {};
  if (typeof optionsOrMethod === 'string') {
    options = {
      method: optionsOrMethod,
      body: possibleBody ? (typeof possibleBody === 'string' ? possibleBody : JSON.stringify(possibleBody)) : undefined
    };
  } else if (optionsOrMethod && typeof optionsOrMethod === 'object') {
    options = { ...optionsOrMethod };
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.body = JSON.stringify(options.body);
    }
  }

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && token !== 'undefined' && token !== 'null') {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  let data = null;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
    try {
      data = await response.json();
    } catch {
      data = { success: response.ok, message: response.statusText || 'Invalid server response.' };
    }
  } catch (netErr) {
    console.error(`apiRequest network error for ${path}:`, netErr);
    response = { ok: false, status: 500, statusText: netErr.message };
    data = { success: false, message: netErr.message || 'Network request failed.' };
  }

  const result = {
    ...(typeof data === 'object' && data !== null ? data : {}),
    response,
    data, // Ensure data is ALWAYS the full parsed JSON object, overriding any nested 'data' key from the spread
    success: data?.success ?? response?.ok ?? false
  };

  return result;
}

export function authHeaders() {
  const token = getToken();
  return (token && token !== 'undefined' && token !== 'null')
    ? { Authorization: `Bearer ${token}` }
    : {};
}
