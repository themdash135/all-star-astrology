import { jsonResponse, errorResponse, optionsResponse } from "../_shared/cors.ts";
import {
  buildContext,
  calculateWestern,
  calculateVedic,
  calculateChinese,
  calculateBazi,
  calculateNumerology,
  calculateKabbalistic,
  calculateGematria,
  calculatePersian,
  calculateCombined,
  calculateDaily,
} from "../_shared/engines.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const birthDate = typeof body.birth_date === "string" ? body.birth_date.trim() : "";
  const birthTime = typeof body.birth_time === "string" ? body.birth_time.trim() : "";
  const birthLocation = typeof body.birth_location === "string" ? body.birth_location.trim() : "";

  if (!birthDate || !birthTime || !birthLocation) {
    return errorResponse("birth_date, birth_time, and birth_location are required");
  }

  try {
    const ctx = buildContext({
      birth_date: birthDate,
      birth_time: birthTime,
      birth_location: birthLocation,
      full_name: typeof body.full_name === "string" ? body.full_name : undefined,
      hebrew_name: typeof body.hebrew_name === "string" ? body.hebrew_name : undefined,
    });

    const systems: Record<string, ReturnType<typeof calculateWestern>> = {
      western: calculateWestern(ctx),
      vedic: calculateVedic(ctx),
      chinese: calculateChinese(ctx),
      bazi: calculateBazi(ctx),
      numerology: calculateNumerology(ctx),
      kabbalistic: calculateKabbalistic(ctx),
      gematria: calculateGematria(ctx),
      persian: calculatePersian(ctx),
    };

    const combined = calculateCombined(systems);
    const daily = calculateDaily(systems, combined);

    return jsonResponse({
      meta: {
        birth_date: birthDate,
        birth_time: birthTime,
        birth_location: birthLocation,
        full_name: body.full_name || null,
        hebrew_name: body.hebrew_name || null,
        calculated_at: new Date().toISOString(),
        age: ctx.age,
      },
      systems,
      combined,
      daily,
    });
  } catch (e) {
    console.error("Reading calculation error:", e);
    return errorResponse("Internal calculation error", 500);
  }
});
