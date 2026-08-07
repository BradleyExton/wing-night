import assert from "node:assert/strict";
import test from "node:test";

import { applyFooterColumns } from "./styles";

// The footer's track listing is written imperatively through a ref, so it is exercised
// directly here — the component tests render to static markup, which never runs refs.
const createFooterStub = (): { style: { gridTemplateColumns: string } } => ({
  style: { gridTemplateColumns: "" }
});

const applyTo = (
  element: { style: { gridTemplateColumns: string } },
  columnCount: number
): void => {
  applyFooterColumns(columnCount)(element as unknown as HTMLElement);
};

test("gives every team an equal track when standings are populated", () => {
  const footer = createFooterStub();

  applyTo(footer, 4);

  assert.equal(footer.style.gridTemplateColumns, "repeat(4, minmax(0, 1fr))");
});

test("clears the track listing when standings empty out", () => {
  const footer = createFooterStub();
  applyTo(footer, 3);

  applyTo(footer, 0);

  assert.equal(footer.style.gridTemplateColumns, "");
});

test("leaves the element untouched when the ref detaches", () => {
  assert.doesNotThrow(() => {
    applyFooterColumns(3)(null);
  });
});
