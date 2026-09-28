import assert from "node:assert/strict";
import test from "node:test";

import { WING_FLIGHT_MAX, flyWings, resolveCentre, resolveWingFlightCount } from "./index.js";

test("does fly at most a dozen wings, and none for an empty handful", () => {
  assert.equal(resolveWingFlightCount(0), 0);
  assert.equal(resolveWingFlightCount(5), 5);
  assert.equal(resolveWingFlightCount(80), WING_FLIGHT_MAX);
  assert.equal(resolveWingFlightCount(-3), 0);
});

test("does aim at the middle of a box", () => {
  assert.deepEqual(resolveCentre({ left: 10, top: 20, width: 40, height: 10 }), { x: 30, y: 25 });
});

test("does start one staggered animation per flying wing and nothing without the API", () => {
  const started: number[] = [];
  const wing = (withApi: boolean): Element =>
    ({
      animate: withApi
        ? (_keyframes: unknown, options: { delay: number }): void => {
            started.push(options.delay);
          }
        : undefined
    }) as unknown as Element;
  const layer = { children: [wing(true), wing(true), wing(false), wing(true)] } as unknown as HTMLElement;

  flyWings(layer, { x: 0, y: 0 }, { x: 100, y: -50 }, 3);
  assert.deepEqual(started, [0, 55]);

  flyWings(null, { x: 0, y: 0 }, { x: 1, y: 1 }, 3);
});
