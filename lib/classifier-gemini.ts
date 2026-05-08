import { parseClassifierOutput } from "./classifier.ts";
import type { ClassifierOutput, StructuredAttributes, UploadContext } from "./types.ts";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const CLASSIFICATION_SCHEMA = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description: "A concise but rich natural-language description of the garment image.",
    },
    attributes: {
      type: "object",
      properties: {
        garmentType: { type: "string" },
        style: { type: "string" },
        material: { type: "string" },
        colorPalette: {
          type: "array",
          items: { type: "string" },
        },
        pattern: { type: "string" },
        season: { type: "string" },
        occasion: {
          type: "array",
          items: { type: "string" },
        },
        consumerProfile: { type: "string" },
        trendNotes: {
          type: "array",
          items: { type: "string" },
        },
        locationContext: {
          type: "object",
          properties: {
            continent: { type: "string" },
            country: { type: "string" },
            city: { type: "string" },
            venue: { type: "string" },
          },
          required: ["continent", "country", "city", "venue"],
          additionalProperties: false,
        },
      },
      required: [
        "garmentType",
        "style",
        "material",
        "colorPalette",
        "pattern",
        "season",
        "occasion",
        "consumerProfile",
        "trendNotes",
        "locationContext",
      ],
      additionalProperties: false,
    },
  },
  required: ["description", "attributes"],
  additionalProperties: false,
} as const;

function buildPrompt(context: UploadContext) {
  return `
You are classifying a fashion inspiration image for a designer research library.

Return:
1. A rich but concise natural-language description.
2. Structured garment metadata matching the provided JSON schema.

Guidance:
- Focus on the single most important primary garment in the image for structured classification.
- If multiple garments or people are visible, choose the most visually dominant or most design-relevant garment as the primary garment.
- Mention secondary garments or other visible styling elements only in the natural-language description or trend notes.
- Focus on garment silhouette, visible material cues, styling language, pattern, and color story.
- `garmentType`, `style`, `material`, `pattern`, `season`, and `colorPalette` should describe the primary garment, not the entire outfit.
- Keep `description` centered on the primary garment first, with any secondary styling context afterward.
- Use the upload context only when helpful.
- If a field cannot be inferred reliably from the image/context, use "Unknown".
- Keep arrays non-empty when possible, but use ["Unknown"] if needed.
- Do not return comma-separated multiple garment types in one field. Use one primary category only.

Upload context:
- designer: ${context.designer || "Unknown"}
- continent: ${context.continent || "Unknown"}
- country: ${context.country || "Unknown"}
- city: ${context.city || "Unknown"}
- venue: ${context.venue || "Unknown"}
- capturedAt: ${context.capturedAt || "Unknown"}
`.trim();
}

function extractTextPayload(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidate = payload as {
    text?: string;
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  if (candidate.text) {
    return candidate.text;
  }

  return (
    candidate.candidates
      ?.flatMap((item) => item.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("") ?? ""
  );
}

export async function classifyWithGemini(input: {
  imageBase64: string;
  mimeType: string;
  context?: UploadContext;
}): Promise<ClassifierOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt(input.context ?? {}) },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: CLASSIFICATION_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini classification failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as unknown;
  const rawText = extractTextPayload(payload);
  if (!rawText) {
    throw new Error("Gemini returned an empty classification payload");
  }

  return parseClassifierOutput(rawText);
}

export function shouldUseGeminiClassifier() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type { StructuredAttributes };
