// API layer — routes through Supabase Edge Functions (gateway) in production,
// falls back to local backend for development.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY || '';
const IS_DEV = import.meta.env.DEV;

async function localGet(endpoint) {
  const response = await fetch(`/api/${endpoint}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function localPost(endpoint, body) {
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

async function gatewayGet(endpoint) {
  if (!SUPABASE_ANON_KEY) throw new Error('Gateway not configured');
  const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function gatewayPost(endpoint, body) {
  if (!SUPABASE_ANON_KEY) throw new Error('Gateway not configured');
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
  // Dev: hit local backend directly. Production: route through gateway.
  if (IS_DEV) {
    try { return await localGet(endpoint); } catch { /* fall through */ }
  }
  return gatewayGet(endpoint);
}

export async function apiPost(endpoint, body) {
  // Dev: hit local backend directly. Production: route through gateway.
  if (IS_DEV) {
    try { return await localPost(endpoint, body); } catch { /* fall through */ }
  }
  return gatewayPost(endpoint, body);
}
