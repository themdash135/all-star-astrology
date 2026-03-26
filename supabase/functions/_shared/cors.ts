const ALLOWED_ORIGINS = [
  "https://allstar-astrology-816912350023.us-central1.run.app",
  "http://localhost:5173",
  "http://localhost:8892",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-time",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// Backend URL — Supabase Edge Functions proxy to Cloud Run
const BACKEND_URL = Deno.env.get("BACKEND_URL") || "https://allstar-astrology-816912350023.us-central1.run.app";
const BACKEND_API_KEY = Deno.env.get("BACKEND_API_KEY") || "";

export async function proxyToBackend(req: Request, path: string): Promise<Response> {
  const cors = getCorsHeaders(req);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BACKEND_API_KEY) headers["X-Backend-Key"] = BACKEND_API_KEY;

  // Forward the request timestamp for replay protection
  const reqTime = req.headers.get("x-request-time");
  if (reqTime) headers["X-Request-Time"] = reqTime;

  const body = req.method === "POST" ? await req.text() : undefined;

  const resp = await fetch(`${BACKEND_URL}/api/${path}`, {
    method: req.method,
    headers,
    body,
  });

  const data = await resp.text();
  return new Response(data, {
    status: resp.status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function jsonResponse(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

export function errorResponse(req: Request, message: string, status = 400): Response {
  return jsonResponse(req, { detail: message }, status);
}

export function optionsResponse(req: Request): Response {
  return new Response("ok", { headers: getCorsHeaders(req) });
}
