import { optionsResponse, proxyToBackend } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse(req);
  return proxyToBackend(req, "ask");
});
