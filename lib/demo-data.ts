import type { GarmentImage } from "./types.ts";

const seedImages: GarmentImage[] = [
  {
    id: 1001,
    filename: "tokyo_red_cotton_dress_floral.jpg",
    imageUrl: "/demo/tokyo-dress.svg",
    aiDescription:
      "A red cotton dress with a floral surface and a market-sourced bohemian mood. The silhouette feels easy, feminine, and spring-ready, with strong artisanal inspiration cues.",
    attributes: {
      garmentType: "Dress",
      style: "Bohemian",
      material: "Cotton",
      colorPalette: ["Red", "Ivory"],
      pattern: "Floral",
      season: "Spring",
      occasion: ["Festival", "Everyday"],
      consumerProfile: "Womenswear",
      trendNotes: ["Craft Detail", "Floral Revival"],
      locationContext: {
        continent: "Asia",
        country: "Japan",
        city: "Tokyo",
        venue: "street market",
      },
    },
    userAnnotations: [
      {
        id: "seed-note-1",
        kind: "note",
        value: "Interesting neckline embroidery direction for holiday capsule.",
        createdAt: "2025-03-12T00:00:00.000Z",
      },
    ],
    designer: "Aiko",
    capturedAt: "2025-03-12",
    createdAt: "2025-03-12T00:00:00.000Z",
  },
  {
    id: 1002,
    filename: "milan_tailored_gray_blazer_office.jpg",
    imageUrl: "/demo/milan-blazer.svg",
    aiDescription:
      "A gray tailored blazer with a softened structured line, suited to polished workwear. The image suggests modern office dressing with soft tailoring and menswear crossover cues.",
    attributes: {
      garmentType: "Jacket",
      style: "Tailored",
      material: "Wool",
      colorPalette: ["Gray", "Charcoal"],
      pattern: "Solid",
      season: "Fall",
      occasion: ["Work"],
      consumerProfile: "Menswear",
      trendNotes: ["Soft Tailoring"],
      locationContext: {
        continent: "Europe",
        country: "Italy",
        city: "Milan",
        venue: "trade show",
      },
    },
    userAnnotations: [
      {
        id: "seed-tag-1",
        kind: "tag",
        value: "commercial hero",
        createdAt: "2025-10-02T00:00:00.000Z",
      },
    ],
    designer: "Luca",
    capturedAt: "2025-10-02",
    createdAt: "2025-10-02T00:00:00.000Z",
  },
  {
    id: 1003,
    filename: "mexicocity_embroidered_white_top_artisan.jpg",
    imageUrl: "/demo/mexico-top.svg",
    aiDescription:
      "An ivory artisan top with visible embroidery and handcrafted texture. It reads as a strong resort-to-festival inspiration piece with elevated craft storytelling.",
    attributes: {
      garmentType: "Top",
      style: "Bohemian",
      material: "Cotton",
      colorPalette: ["Ivory", "Gold"],
      pattern: "Embroidered",
      season: "Summer",
      occasion: ["Festival", "Travel"],
      consumerProfile: "Womenswear",
      trendNotes: ["Craft Detail", "Vacation Dressing"],
      locationContext: {
        continent: "North America",
        country: "Mexico",
        city: "Mexico City",
        venue: "artisan market",
      },
    },
    userAnnotations: [],
    designer: "Sofia",
    capturedAt: "2025-06-20",
    createdAt: "2025-06-20T00:00:00.000Z",
  },
];

export function getDemoSeedImages() {
  return structuredClone(seedImages);
}
