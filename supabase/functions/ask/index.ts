import { jsonResponse, errorResponse, optionsResponse } from "../_shared/cors.ts";
import { composeOracleResponse } from "../_shared/engines.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return errorResponse("question is required");
  }

  const readingData = (body.reading_data && typeof body.reading_data === "object")
    ? body.reading_data as Record<string, unknown>
    : {};

  try {
    const result = composeOracleResponse(question, readingData);
    return jsonResponse(result);
  } catch (e) {
    console.error("Oracle error:", e);
    return errorResponse("Internal oracle error", 500);
  }
});
