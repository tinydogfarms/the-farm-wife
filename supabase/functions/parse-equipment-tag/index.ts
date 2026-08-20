// Extracts make/model/year/serial number from a photo of an equipment
// identification tag or nameplate (the riveted metal or stamped plate found
// on tractors, mowers, trucks, and implements) using Claude vision.
//
// Uses a raw JSON-schema output_config (not the SDK's zodOutputFormat helper
// from "@anthropic-ai/sdk/helpers/zod") because that subpath fails to boot
// under Supabase's Deno edge runtime — the top-level SDK import works fine,
// only the /helpers/zod submodule does not resolve here.
import Anthropic from "npm:@anthropic-ai/sdk@^0.71.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tagJsonSchema = {
  type: "object",
  properties: {
    make: { type: "string", description: "Manufacturer/brand printed on the tag, e.g. 'John Deere'. Empty string if not visible." },
    model: { type: "string", description: "Model name or number printed on the tag. Empty string if not visible." },
    year: { type: "string", description: "Model year, 4 digits, if printed on the tag. Empty string if not visible." },
    serial_number: { type: "string", description: "Serial number exactly as printed (sometimes labeled PIN, VIN, or Serial No.), preserving letters, digits, and dashes. Empty string if not visible." },
  },
  required: ["make", "model", "year", "serial_number"],
  additionalProperties: false,
};

interface ParsedTag {
  make: string;
  model: string;
  year: string;
  serial_number: string;
}

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const imageBase64 = body?.imageBase64 as string | undefined;
    const mediaType = (body?.mediaType as string | undefined) ?? "image/jpeg";

    if (!imageBase64) {
      return jsonResponse({ success: false, error: "No image provided" }, 400);
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system:
        "You read equipment identification tags/nameplates — the metal or sticker plate riveted or " +
        "stamped onto tractors, mowers, trucks, and implements. Extract the manufacturer, model, " +
        "model year, and serial number (sometimes labeled PIN, VIN, or Serial No.). Read characters " +
        "very precisely — serial numbers are alphanumeric and easy to misread (0 vs O, 1 vs I, 8 vs B). " +
        "If a field is not visible on the tag, return an empty string for it rather than guessing.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            { type: "text", text: "Extract the make, model, year, and serial number from this equipment tag." },
          ],
        },
      ],
      output_config: { format: { type: "json_schema", schema: tagJsonSchema } },
    });

    // output_config.format guarantees the first content block is text with valid JSON
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return jsonResponse({ success: false, error: "Could not extract data from tag" }, 200);
    }

    const parsed = JSON.parse(textBlock.text) as ParsedTag;
    const year = /^\d{4}$/.test(parsed.year) ? parseInt(parsed.year, 10) : null;

    return jsonResponse(
      {
        success: true,
        data: {
          make: parsed.make || "",
          model: parsed.model || "",
          year,
          serial_number: parsed.serial_number || "",
        },
      },
      200
    );
  } catch (error) {
    console.error("parse-equipment-tag error:", error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      200
    );
  }
});
