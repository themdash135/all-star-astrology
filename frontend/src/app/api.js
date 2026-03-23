// API layer — tries local backend first, falls back to Supabase Edge Functions.
const SUPABASE_URL = 'https://qpjrdljrxpsoezurqgts.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwanJkbGpyeHBzb2V6dXJxZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzE2MjMsImV4cCI6MjA4OTY0NzYyM30.cYLP8Uq71xZfPBLYSyE6RUvWViN-raS0Dbn5uwuJhIU';

async function localGet(endpoint) {
  const response = await fetch(`/api/${endpoint}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function localPost(endpoint, body) {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function supabaseGet(endpoint) {
  const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

async function supabasePost(endpoint, body) {
  const response = await fetch(`${SUPABASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `API error ${response.status}`);
  return payload;
}

export async function apiGet(endpoint) {
  try {
    return await localGet(endpoint);
  } catch {
    return supabaseGet(endpoint);
  }
}

export async function apiPost(endpoint, body) {
  try {
    return await localPost(endpoint, body);
  } catch {
    return supabasePost(endpoint, body);
  }
}
