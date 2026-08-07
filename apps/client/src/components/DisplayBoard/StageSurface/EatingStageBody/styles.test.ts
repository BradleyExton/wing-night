import assert from "node:assert/strict";
import test from "node:test";

import { applyHeatFillWidth } from "./styles";

// The fill width is written imperatively through a ref, so it is exercised directly here —
// the component tests render to static markup, which never runs refs.
const applyTo = (element: { style: { width: string } }, percent: number): void => {
  applyHeatFillWidth(percent)(element as unknown as HTMLDivElement);
};

test("sizes the fill to the share of the countdown still remaining", () => {
  const fill = { style: { width: "" } };

  applyTo(fill, 62.5);

  assert.equal(fill.style.width, "62.5%");
});

test("collapses the fill when the countdown reaches zero", () => {
  const fill = { style: { width: "100%" } };

  applyTo(fill, 0);

  assert.equal(fill.style.width, "0%");
});

test("leaves the element untouched when the ref detaches", () => {
  assert.doesNotThrow(() => {
    applyHeatFillWidth(50)(null);
  });
});
