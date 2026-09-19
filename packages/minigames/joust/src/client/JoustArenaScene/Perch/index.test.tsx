import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { JOUST_WORLD, resolveJoustLegs } from "@wingnight/shared";

import { Perch } from "./index.js";

const SAND = { x: 54, y: 78, width: 102 };
const SHELF = { x: 116, y: 50, width: 34 };
const HIGH_SHELF = { x: 62, y: 30, width: 32 };

const uprightLegs = (perch: typeof SHELF) =>
  resolveJoustLegs([perch]).map((leg) => ({
    perchIndex: 0,
    foot: { x: leg.x, y: leg.footY },
    top: { x: leg.x, y: leg.topY }
  }));

const render = (element: JSX.Element): string => renderToStaticMarkup(<svg>{element}</svg>);

test("does draw nothing for the sand", () => {
  assert.equal(render(<Perch perch={SAND} legs={[]} isRubble={false} />), "<svg></svg>");
});

test("does draw each leg between its own foot and top, and the plank across the tops", () => {
  const legs = uprightLegs(SHELF);
  const html = render(<Perch perch={SHELF} legs={legs} isRubble={false} />);
  const legLines = html.match(/<line[^>]*data-joust-leg[^>]*>/g) ?? [];

  assert.equal(legLines.length, 2);
  assert.match(legLines[0] ?? "", new RegExp(`x1="${legs[0]?.foot.x}"`));
  assert.match(legLines[0] ?? "", new RegExp(`y2="${legs[0]?.top.y}"`));
  assert.match(html, /<path d="M/, "the plank is a path laid across the tops");
});

test("does bring the plank down with the legs when the frame folds", () => {
  const folded = uprightLegs(SHELF).map((leg) => ({
    ...leg,
    top: { x: leg.top.x + 18, y: JOUST_WORLD.floorY - 6 }
  }));
  const html = render(<Perch perch={SHELF} legs={folded} isRubble={false} />);
  const plank = /<path d="M([\d.]+) ([\d.]+)/.exec(html);

  assert.ok(plank !== null);
  assert.ok(Number(plank[2]) > SHELF.y + 10, "the plank has left where it was authored");
});

test("does tag a shelf with what it pays and leave a single-point plank untagged", () => {
  assert.match(
    render(<Perch perch={SHELF} legs={uprightLegs(SHELF)} isRubble={false} />),
    /data-joust-perch-points="2"[^>]*>×2</
  );
  assert.match(
    render(<Perch perch={HIGH_SHELF} legs={uprightLegs(HIGH_SHELF)} isRubble={false} />),
    /data-joust-perch-points="3"/
  );
});

test("does lay a fallen tower flat on the sand as rubble", () => {
  const html = render(<Perch perch={SHELF} legs={[]} isRubble />);

  assert.match(html, /data-joust-rubble/);
  assert.doesNotMatch(html, /data-joust-leg/);
  assert.doesNotMatch(html, /data-joust-perch-points/);
});
