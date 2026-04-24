import { classifyGarment } from "../lib/classifier.ts";
import { labeledFixtures } from "./test-set/labeled-fixtures.ts";

const attributes = ["garmentType", "style", "material", "occasion", "country"] as const;

const results = Object.fromEntries(attributes.map((attribute) => [attribute, 0])) as Record<
  (typeof attributes)[number],
  number
>;

for (const fixture of labeledFixtures) {
  const output = classifyGarment(fixture.filename, fixture.context);

  if (output.attributes.garmentType === fixture.expected.garmentType) {
    results.garmentType += 1;
  }

  if (output.attributes.style === fixture.expected.style) {
    results.style += 1;
  }

  if (output.attributes.material === fixture.expected.material) {
    results.material += 1;
  }

  if (output.attributes.occasion[0] === fixture.expected.occasion) {
    results.occasion += 1;
  }

  if (output.attributes.locationContext.country === fixture.expected.country) {
    results.country += 1;
  }
}

console.log(`Evaluation set size: ${labeledFixtures.length}`);
for (const attribute of attributes) {
  const score = results[attribute] / labeledFixtures.length;
  console.log(`${attribute.padEnd(12)} ${(score * 100).toFixed(1)}%`);
}
