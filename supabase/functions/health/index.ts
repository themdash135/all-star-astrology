import { jsonResponse, optionsResponse } from "../_shared/cors.ts";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
});
