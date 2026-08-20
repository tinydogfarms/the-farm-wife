// Extracts structured transaction data from a photo of a farm receipt using
// Claude vision, constrained to the app's Schedule F category list.
//
// Uses a raw JSON-schema output_config (not the SDK's zodOutputFormat helper
// from "@anthropic-ai/sdk/helpers/zod") because that subpath fails to boot
// under Supabase's Deno edge runtime — the top-level SDK import works fine,
// only the /helpers/zod submodule does not resolve here.
import Anthropic from "npm:@anthropic-ai/sdk@^0.71.0";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../../lib/constants/categories.ts";

const RECEIPTS_BUCKET = "receipts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DATE_DESCRIPTION =
  "Transaction date in YYYY-MM-DD format. Read the date printed on the receipt itself " +
  "(e.g. a header date, transaction date, or timestamp) — do not use today's date unless " +
  "no date is visible anywhere on the receipt.";

const receiptJsonSchema = {
  anyOf: [
    {
      type: "object",
      properties: {
        type: { const: "expense" },
        date: { type: "string", description: DATE_DESCRIPTION },
        category: { type: "string", enum: [...EXPENSE_CATEGORIES] },
        description: { type: "string", description: "Vendor name and/or what was purchased" },
        amount: { type: "number", description: "Total amount in dollars" },
      },
      required: ["type", "date", "category", "description", "amount"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { const: "income" },
        date: { type: "string", description: DATE_DESCRIPTION },
        category: { type: "string", enum: [...INCOME_CATEGORIES] },
        description: { type: "string", description: "Source of income and/or what was sold" },
        amount: { type: "number", description: "Total amount in dollars" },
      },
      required: ["type", "date", "category", "description", "amount"],
      additionalProperties: false,
    },
  ],
};

interface ParsedReceipt {
  type: "expense" | "income";
  date: string;
  category: string;
  description: string;
  amount: number;
}

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function loadImageFromStorage(imagePath: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Storage lookup is not configured");
  }

  const downloadUrl = `${supabaseUrl}/storage/v1/object/${RECEIPTS_BUCKET}/${imagePath}`;
  const fileResponse = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${serviceRoleKey}` },
  });

  if (!fileResponse.ok) {
    throw new Error(`Could not load image from storage (${fileResponse.status})`);
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const imageBase64 = body?.imageBase64 as string | undefined;
    const imagePath = body?.imagePath as string | undefined;
    const mediaType = (body?.mediaType as string | undefined) ?? "image/jpeg";

    let base64Data = imageBase64;
    if (!base64Data && imagePath) {
      base64Data = await loadImageFromStorage(imagePath);
    }

    if (!base64Data) {
      return jsonResponse({ success: false, error: "No image provided" }, 400);
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system:
        "You extract structured transaction data from a photo of a farm business receipt or invoice. " +
        "Read the vendor, line items, total, and date from the image. " +
        "Always use the date printed on the receipt (header date, transaction date, or timestamp) " +
        "rather than today's date — only fall back to today's date if the receipt has no date at all. " +
        "Classify as 'income' only if this is clearly a sale or payment received by the farm business " +
        "(e.g. a sales receipt for produce or livestock); otherwise classify as 'expense'. " +
        "Pick the single closest category from the allowed list for that type — never invent a category. " +
        "If the total amount isn't clearly legible, make your best estimate rather than returning zero.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            { type: "text", text: "Extract the transaction details from this receipt." },
          ],
        },
      ],
      output_config: { format: { type: "json_schema", schema: receiptJsonSchema } },
    });

    // output_config.format guarantees the first content block is text with valid JSON
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return jsonResponse({ success: false, error: "Could not extract data from receipt" }, 200);
    }

    const parsed = JSON.parse(textBlock.text) as ParsedReceipt;
    const date = isIsoDate(parsed.date) ? parsed.date : new Date().toISOString().split("T")[0];
    const amount = Number.isFinite(parsed.amount) && parsed.amount > 0 ? parsed.amount : 0;

    return jsonResponse(
      {
        success: true,
        data: {
          date,
          type: parsed.type,
          category: parsed.category,
          description: parsed.description || "",
          amount,
          method: "cash",
        },
      },
      200
    );
  } catch (error) {
    console.error("parse-receipt error:", error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      200
    );
  }
});
