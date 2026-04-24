import type { ClassifierOutput, StructuredAttributes, UploadContext } from "./types.ts";

type NormalizableAttributes = Partial<{
  garmentType: string;
  type: string;
  style: string;
  material: string;
  colorPalette: string[] | string;
  color_palette: string[] | string;
  pattern: string;
  season: string;
  occasion: string[] | string;
  consumerProfile: string;
  consumer_profile: string;
  trendNotes: string[] | string;
  trend_notes: string[] | string;
  locationContext:
    | StructuredAttributes["locationContext"]
    | Partial<StructuredAttributes["locationContext"]>
    | string;
  location_context:
    | StructuredAttributes["locationContext"]
    | Partial<StructuredAttributes["locationContext"]>
    | string;
}>;

const UNKNOWN = "Unknown";

const GARMENT_KEYWORDS: Record<string, string[]> = {
  Dress: ["dress", "gown", "maxi", "mini", "slipdress", "sundress"],
  Shirt: ["shirt", "blouse", "oxford", "buttondown", "button-up"],
  Jacket: ["jacket", "blazer", "bomber", "parka", "outerwear"],
  Skirt: ["skirt", "midi", "pleatedskirt"],
  Pants: ["pants", "trousers", "slacks", "cargo"],
  Jeans: ["jeans", "denim"],
  Knitwear: ["knit", "cardigan", "sweater"],
  Top: ["top", "tank", "camisole", "tee", "tshirt", "t-shirt"],
  Coat: ["coat", "trench", "overcoat"],
};

const STYLE_KEYWORDS: Record<string, string[]> = {
  Casual: ["casual", "relaxed", "easy"],
  Tailored: ["tailored", "structured", "sharp", "clean"],
  Streetwear: ["streetwear", "urban", "sport"],
  Bohemian: ["boho", "bohemian", "artisan", "crafted"],
  Minimal: ["minimal", "minimalist", "cleanline"],
  Romantic: ["romantic", "ruffle", "soft"],
  Resort: ["resort", "vacation", "coastal"],
};

const MATERIAL_KEYWORDS: Record<string, string[]> = {
  Cotton: ["cotton", "poplin", "jersey"],
  Linen: ["linen"],
  Denim: ["denim"],
  Wool: ["wool", "tweed"],
  Silk: ["silk", "satin"],
  Leather: ["leather", "suede"],
  Knit: ["knit", "crochet", "ribbed"],
};

const COLOR_KEYWORDS = [
  "black",
  "white",
  "ivory",
  "cream",
  "gray",
  "charcoal",
  "navy",
  "blue",
  "indigo",
  "red",
  "burgundy",
  "pink",
  "orange",
  "rust",
  "yellow",
  "olive",
  "green",
  "teal",
  "brown",
  "tan",
  "beige",
  "gold",
  "silver",
];

const PATTERN_KEYWORDS: Record<string, string[]> = {
  Solid: ["solid", "plain"],
  Floral: ["floral", "flower", "botanical"],
  Stripe: ["stripe", "striped"],
  Plaid: ["plaid", "check", "checked"],
  Embroidered: ["embroidered", "embroidery"],
  Animal: ["animal", "leopard", "zebra"],
};

const OCCASION_KEYWORDS: Record<string, string[]> = {
  Everyday: ["daily", "everyday", "casual"],
  Work: ["office", "work", "tailored"],
  Evening: ["evening", "party", "night"],
  Travel: ["travel", "resort", "vacation"],
  Festival: ["festival", "market", "artisan"],
};

const CONSUMER_KEYWORDS: Record<string, string[]> = {
  Womenswear: ["women", "womens", "female", "romantic"],
  Menswear: ["men", "mens", "male", "tailored"],
  Unisex: ["unisex", "shared", "streetwear"],
  Youth: ["teen", "youth", "playful"],
};

const TREND_KEYWORDS: Record<string, string[]> = {
  "Craft Detail": ["embroidery", "artisan", "handmade", "crafted"],
  "Soft Tailoring": ["tailored", "relaxed tailoring", "soft"],
  Utility: ["cargo", "utility", "pocket"],
  "Vacation Dressing": ["resort", "coastal", "vacation"],
  "Floral Revival": ["floral", "botanical"],
};

function normalizeToken(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function tokenize(...parts: Array<string | undefined>) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[\s/_-]+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function matchKeywordGroup(map: Record<string, string[]>, tokens: string[], fallback = UNKNOWN) {
  for (const [label, keywords] of Object.entries(map)) {
    if (keywords.some((keyword) => tokens.includes(normalizeToken(keyword)))) {
      return label;
    }
  }

  return fallback;
}

function matchManyFromMap(map: Record<string, string[]>, tokens: string[]) {
  const matches = Object.entries(map)
    .filter(([, keywords]) => keywords.some((keyword) => tokens.includes(normalizeToken(keyword))))
    .map(([label]) => label);

  return matches.length > 0 ? matches : [UNKNOWN];
}

function pickColors(tokens: string[]) {
  const colors = COLOR_KEYWORDS.filter((color) => tokens.includes(normalizeToken(color))).map((color) =>
    color[0].toUpperCase() + color.slice(1),
  );

  return colors.length > 0 ? colors : ["Neutral"];
}

function inferSeason(capturedAt?: string, tokens: string[] = []) {
  const matched = matchKeywordGroup(
    {
      Spring: ["spring", "march", "april", "may"],
      Summer: ["summer", "june", "july", "august"],
      Fall: ["fall", "autumn", "september", "october", "november"],
      Winter: ["winter", "december", "january", "february"],
    },
    tokens,
    "",
  );

  if (matched) {
    return matched;
  }

  if (!capturedAt) {
    return UNKNOWN;
  }

  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) {
    return UNKNOWN;
  }

  const month = date.getUTCMonth() + 1;
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

function sentenceCase(input: string) {
  return input === UNKNOWN ? input : `${input.charAt(0).toUpperCase()}${input.slice(1)}`;
}

function toArray(value: string[] | string | undefined, fallback: string[] = [UNKNOWN]) {
  if (Array.isArray(value)) {
    const items = value.map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items : fallback;
  }

  if (typeof value === "string") {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : fallback;
  }

  return fallback;
}

export function parseClassifierOutput(raw: string | Partial<ClassifierOutput>) {
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as Partial<ClassifierOutput>) : raw;
  const attrs = (parsed.attributes ?? {}) as NormalizableAttributes;
  const rawLocation = attrs.locationContext ?? attrs.location_context;
  const location: Partial<StructuredAttributes["locationContext"]> =
    typeof rawLocation === "string"
      ? { venue: rawLocation }
      : rawLocation && typeof rawLocation === "object"
        ? rawLocation
        : {};

  const attributes: StructuredAttributes = {
    garmentType: attrs.garmentType?.trim() || attrs.type?.trim() || UNKNOWN,
    style: attrs.style?.trim() || UNKNOWN,
    material: attrs.material?.trim() || UNKNOWN,
    colorPalette: toArray(attrs.colorPalette ?? attrs.color_palette, ["Neutral"]).map(sentenceCase),
    pattern: attrs.pattern?.trim() || UNKNOWN,
    season: attrs.season?.trim() || UNKNOWN,
    occasion: toArray(attrs.occasion).map(sentenceCase),
    consumerProfile: attrs.consumerProfile?.trim() || attrs.consumer_profile?.trim() || UNKNOWN,
    trendNotes: toArray(attrs.trendNotes ?? attrs.trend_notes).map(sentenceCase),
    locationContext: {
      continent: location.continent?.trim() || UNKNOWN,
      country: location.country?.trim() || UNKNOWN,
      city: location.city?.trim() || UNKNOWN,
      venue: location.venue?.trim() || UNKNOWN,
    },
  };

  return {
    description: parsed.description?.trim() || "Unspecified fashion inspiration image.",
    attributes,
  } satisfies ClassifierOutput;
}

export function classifyGarment(filename: string, context: UploadContext = {}): ClassifierOutput {
  const basename = filename.replace(/\.[^.]+$/, "");
  const tokens = tokenize(
    basename,
    context.designer,
    context.city,
    context.country,
    context.venue,
    context.capturedAt,
  );

  const garmentType = matchKeywordGroup(GARMENT_KEYWORDS, tokens);
  const style = matchKeywordGroup(STYLE_KEYWORDS, tokens);
  const material = matchKeywordGroup(MATERIAL_KEYWORDS, tokens);
  const pattern = matchKeywordGroup(PATTERN_KEYWORDS, tokens, "Solid");
  const occasion = matchManyFromMap(OCCASION_KEYWORDS, tokens);
  const trendNotes = matchManyFromMap(TREND_KEYWORDS, tokens);
  const consumerProfile = matchKeywordGroup(CONSUMER_KEYWORDS, tokens, "Unisex");
  const colorPalette = pickColors(tokens);
  const season = inferSeason(context.capturedAt, tokens);

  return parseClassifierOutput({
    description: [
      `A ${colorPalette.join(" and ").toLowerCase()} ${material.toLowerCase()} ${garmentType.toLowerCase()}.`,
      `The silhouette reads ${style.toLowerCase()} with a ${pattern.toLowerCase()} surface treatment.`,
      `Likely suited for ${occasion.map((item) => item.toLowerCase()).join(" / ")} and tagged for ${consumerProfile.toLowerCase()}.`,
      `Captured around ${context.city || UNKNOWN}, ${context.country || UNKNOWN}.`,
    ].join(" "),
    attributes: {
      garmentType,
      style,
      material,
      colorPalette,
      pattern,
      season,
      occasion,
      consumerProfile,
      trendNotes,
      locationContext: {
        continent: context.continent?.trim() || UNKNOWN,
        country: context.country?.trim() || UNKNOWN,
        city: context.city?.trim() || UNKNOWN,
        venue: context.venue?.trim() || UNKNOWN,
      },
    },
  });
}
