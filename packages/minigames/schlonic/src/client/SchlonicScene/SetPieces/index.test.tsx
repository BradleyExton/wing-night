import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveQueensPatioX, resolveSouldiersDoorX } from "@wingnight/scenery";
import { SCHLONIC_WORLD, resolveSchlonicZone } from "@wingnight/shared";

import { QUEENS_SCALE, SOULDIERS_SCALE, SetPieces, resolveQueensX, resolveSouldiersX } from "./index.js";

test("does stand Souldiers' door on the start line, under the runner", () => {
  assert.equal(resolveSouldiersDoorX(resolveSouldiersX(), SOULDIERS_SCALE), SCHLONIC_WORLD.runnerX);
});

test("does stand the middle of the Queen's patio on the post", () => {
  assert.equal(resolveQueensPatioX(resolveQueensX(840), QUEENS_SCALE), 840);
});

test("draws the shop at the start and the hotel at the finish of a real zone", () => {
  const zone = resolveSchlonicZone({ seed: 4, chunks: 14 });
  const markup = renderToStaticMarkup(
    <svg>
      <SetPieces zone={zone} goalGroundY={SCHLONIC_WORLD.groundBaseY} />
    </svg>
  );

  assert.ok(markup.includes("data-scenery-souldiers"));
  assert.ok(markup.includes("data-scenery-queens"));
});
