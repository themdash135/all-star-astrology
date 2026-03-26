// API layer — uses relative /api/ URLs which resolve to the Cloud Run backend
// (since the Capacitor WebView loads from the Cloud Run server.url).
// Supabase gateway is the fallback for when the primary backend is unreachable.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

async function primaryGet(endpoint) {
  const response = await fetch(`/api/${endpoint}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function primaryPost(endpoint, body) {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Time': String(Date.now() / 1000),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function fallbackGet(endpoint) {
  if (!SUPABASE_ANON_KEY) throw new Error('Fallback not configured');
  const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function fallbackPost(endpoint, body) {
  if (!SUPABASE_ANON_KEY) throw new Error('Fallback not configured');
  const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'X-Request-Time': String(Date.now() / 1000),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

export async function apiGet(endpoint) {
  try {
    return await primaryGet(endpoint);
  } catch (err) {
    console.warn(`[API] Primary failed (${err.message}), trying fallback`);
    return fallbackGet(endpoint);
  }
}

export async function apiPost(endpoint, body) {
  try {
    return await primaryPost(endpoint, body);
  } catch (err) {
    console.warn(`[API] Primary failed (${err.message}), trying fallback`);
    return fallbackPost(endpoint, body);
  }
}
