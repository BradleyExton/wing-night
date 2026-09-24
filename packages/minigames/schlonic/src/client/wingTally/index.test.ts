import assert from "node:assert/strict";
import test from "node:test";

import { paintWingTally } from "./index.js";

const createElement = (): HTMLElement => {
  let text = "";
  let writes = 0;

  return {
    get textContent(): string {
      return text;
    },
    set textContent(value: string) {
      text = value;
      writes += 1;
    },
    get writes(): number {
      return writes;
    }
  } as unknown as HTMLElement;
};

test("writes the wings in hand into the element", () => {
  const element = createElement();

  paintWingTally(element, 12);

  assert.equal(element.textContent, "12");
});

test("does not touch the element when the count has not moved", () => {
  const element = createElement();

  paintWingTally(element, 4);
  paintWingTally(element, 4);

  assert.equal((element as unknown as { writes: number }).writes, 1);
});

test("does nothing when there is no element to write to", () => {
  assert.doesNotThrow(() => {
    paintWingTally(null, 9);
  });
});
