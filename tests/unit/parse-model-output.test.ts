import test from "node:test";
import assert from "node:assert/strict";

import { parseClassifierOutput } from "../../lib/classifier.ts";

test("parseClassifierOutput normalizes string fields and arrays", () => {
  const result = parseClassifierOutput({
    description: "  Artisan blouse  ",
    attributes: {
      garmentType: "Shirt",
      style: "Bohemian",
      material: "Cotton",
      colorPalette: "ivory, red",
      pattern: "Embroidered",
      season: "Spring",
      occasion: "festival, travel",
      consumerProfile: "Womenswear",
      trendNotes: "craft detail, floral revival",
      locationContext: {
        continent: "North America",
        country: "Mexico",
        city: "Oaxaca",
        venue: "artisan market",
      },
    },
  });

  assert.equal(result.description, "Artisan blouse");
  assert.deepEqual(result.attributes.colorPalette, ["Ivory", "Red"]);
  assert.deepEqual(result.attributes.occasion, ["Festival", "Travel"]);
  assert.deepEqual(result.attributes.trendNotes, ["Craft detail", "Floral revival"]);
  assert.equal(result.attributes.locationContext.city, "Oaxaca");
});
