import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicZone } from "@wingnight/shared";

import { Roadworks } from "./index.js";

const flatZone = (props: SchlonicZone["props"]): SchlonicZone => ({
  heights: Array.from({ length: 21 }, () => SCHLONIC_WORLD.groundBaseY),
  pits: [{ fromX: 100, toX: 122, lipY: SCHLONIC_WORLD.groundBaseY }],
  props,
  goalX: 200
});

const countOf = (markup: string, needle: string): number => markup.split(needle).length - 1;

test("does dress every trench in a real zone", () => {
  const zone = resolveSchlonicZone({ seed: 4, chunks: 14 });
  const markup = renderToStaticMarkup(
    <svg>
      <Roadworks zone={zone} />
    </svg>
  );

  assert.equal(countOf(markup, "data-schlonic-trench="), zone.pits.length);
});

test("keeps the sawhorse away when kit stands where it would go", () => {
  const bare = renderToStaticMarkup(
    <svg>
      <Roadworks zone={flatZone([])} />
    </svg>
  );
  const withSpring = renderToStaticMarkup(
    <svg>
      <Roadworks zone={flatZone([{ index: 0, kind: "kicker", x: 90, y: SCHLONIC_WORLD.groundBaseY }])} />
    </svg>
  );

  // The sawhorse is the only thing in the dressing drawn with a stroked path of legs.
  assert.ok(countOf(bare, "<path d=\"M ") > countOf(withSpring, "<path d=\"M "));
});
