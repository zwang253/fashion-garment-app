import test from "node:test";
import assert from "node:assert/strict";

import { applyImageFilters, buildFilterOptions } from "../../lib/filters.ts";
import type { GarmentImage } from "../../lib/types.ts";

const images: GarmentImage[] = [
  {
    id: 1,
    filename: "tokyo-look.jpg",
    imageUrl: "/uploads/tokyo-look.jpg",
    aiDescription: "An embroidered top from a Tokyo market.",
    attributes: {
      garmentType: "Top",
      style: "Bohemian",
      material: "Cotton",
      colorPalette: ["Ivory"],
      pattern: "Embroidered",
      season: "Spring",
      occasion: ["Festival"],
      consumerProfile: "Womenswear",
      trendNotes: ["Craft Detail"],
      locationContext: {
        continent: "Asia",
        country: "Japan",
        city: "Tokyo",
        venue: "market",
      },
    },
    userAnnotations: [],
    designer: "Mika",
    capturedAt: "2025-03-10",
    createdAt: "2025-03-10T00:00:00.000Z",
  },
  {
    id: 2,
    filename: "milan-look.jpg",
    imageUrl: "/uploads/milan-look.jpg",
    aiDescription: "A tailored blazer spotted in Milan.",
    attributes: {
      garmentType: "Jacket",
      style: "Tailored",
      material: "Wool",
      colorPalette: ["Gray"],
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
    userAnnotations: [],
    designer: "Luca",
    capturedAt: "2025-10-02",
    createdAt: "2025-10-02T00:00:00.000Z",
  },
];

test("filter options are data-driven across location and time", () => {
  const options = buildFilterOptions(images);

  assert.deepEqual(options.countries, ["Italy", "Japan"]);
  assert.deepEqual(options.months, ["March", "October"]);
  assert.deepEqual(options.seasons, ["Fall", "Spring"]);
});

test("filters combine search, location, and time", () => {
  const filtered = applyImageFilters(images, {
    search: "embroidered market",
    country: "Japan",
    month: "March",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.filename, "tokyo-look.jpg");
});
