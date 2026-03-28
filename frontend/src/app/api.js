// API layer — uses relative /api/ URLs which resolve to the Cloud Run backend
// (since the Capacitor WebView loads from the Cloud Run server.url).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY || '';
const HAS_FALLBACK = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

async function readPayload(response) {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) {
    return null;
  }
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return text ? { detail: text } : null;
}

function normalizeTransportError(err) {
  const message = err?.message || '';
  if (message === 'Failed to fetch' || /fetch/i.test(message)) {
    return new Error('Could not reach the server. Check your connection and try again.');
  }
  return err instanceof Error ? err : new Error('Unexpected network error.');
}

function errorFromResponse(response, payload) {
  const detail = typeof payload?.detail === 'string' ? payload.detail : '';
  return new Error(detail || `API error ${response.status}`);
}

async function primaryGet(endpoint) {
  try {
    const response = await fetch(`/api/${endpoint}`);
    const payload = await readPayload(response);
    if (!response.ok) throw errorFromResponse(response, payload);
    return payload;
  } catch (err) {
    throw normalizeTransportError(err);
  }
}

async function primaryPost(endpoint, body) {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Time': String(Date.now() / 1000),
      },
      body: JSON.stringify(body),
    });
    const payload = await readPayload(response);
    if (!response.ok) throw errorFromResponse(response, payload);
    return payload;
  } catch (err) {
    throw normalizeTransportError(err);
  }
}

async function fallbackGet(endpoint) {
  try {
    const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const payload = await readPayload(response);
    if (!response.ok) throw errorFromResponse(response, payload);
    return payload;
  } catch (err) {
    throw normalizeTransportError(err);
  }
}

async function fallbackPost(endpoint, body) {
  try {
    const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'X-Request-Time': String(Date.now() / 1000),
      },
      body: JSON.stringify(body),
    });
    const payload = await readPayload(response);
    if (!response.ok) throw errorFromResponse(response, payload);
    return payload;
  } catch (err) {
    throw normalizeTransportError(err);
  }
}

export async function apiGet(endpoint) {
  try {
    return await primaryGet(endpoint);
  } catch (err) {
    if (!HAS_FALLBACK) throw err;
    console.warn(`[API] Primary failed (${err.message}), trying fallback`);
    return fallbackGet(endpoint);
  }
}

export async function apiPost(endpoint, body) {
  try {
    return await primaryPost(endpoint, body);
  } catch (err) {
    if (!HAS_FALLBACK) throw err;
    console.warn(`[API] Primary failed (${err.message}), trying fallback`);
    return fallbackPost(endpoint, body);
  }
}

export function trackEvent(event, data = {}) {
  fetch('/api/admin/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, data }),
  }).catch(() => {});
}
