import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_VARIANT_ID, VARIANTS, resolveVariantId, resolveVariantMeta } from "./index";

test("falls back to the default variant when no ?variant= param is present", () => {
  assert.equal(resolveVariantId(null), DEFAULT_VARIANT_ID);
});

test("falls back to the default variant when the param names an unknown variant", () => {
  assert.equal(resolveVariantId("does-not-exist"), DEFAULT_VARIANT_ID);
});

test("resolves a variant id regardless of case and surrounding whitespace", () => {
  assert.equal(resolveVariantId("  ARENA "), "arena");
});

test("offers exactly the three variants the ticket asks for", () => {
  assert.equal(VARIANTS.length, 3);
});

// AC#3 is the whole risk of this lab: variants that are restyled rather than structurally
// different. Each variant records its own position on the three declared axes, so a variant that
// duplicates another's structure is visible here rather than only under a human's eye.
test("keeps every variant structurally distinct on all three declared axes", () => {
  const placements = new Set(VARIANTS.map((variant) => variant.throwerPlacement));
  const scales = new Set(VARIANTS.map((variant) => variant.throwScale));
  const targets = new Set(VARIANTS.map((variant) => variant.targetTreatment));

  assert.equal(placements.size, 3);
  assert.equal(scales.size, 3);
  assert.equal(targets.size, 3);
});

test("foregrounds the target in exactly one variant so the contrast is drivable", () => {
  const foregrounded = VARIANTS.filter((variant) =>
    variant.targetTreatment.startsWith("Foregrounded")
  );

  assert.equal(foregrounded.length, 1);
});

test("resolves each variant id to its own metadata", () => {
  for (const variant of VARIANTS) {
    assert.equal(resolveVariantMeta(variant.id).id, variant.id);
  }
});
