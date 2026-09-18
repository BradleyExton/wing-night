import assert from "node:assert/strict";
import test from "node:test";

import { resolveSchlongFace, resolveSchlongPaths } from "./index.js";

const PROPORTIONS = { shaftRadius: 2, headRadius: 3 };

// Every vertex of an outline built from `M x y L x y ... Z`.
const vertices = (path: string): { x: number; y: number }[] => {
  return [...path.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2])
  }));
};

const straight = resolveSchlongPaths(
  [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 10, y: 0 },
    { x: 15, y: 0 },
    { x: 20, y: 0 }
  ],
  PROPORTIONS
);

test("does cap the glans one head radius past the head's centre, so the drawn head is the collided one", () => {
  const points = vertices(straight.body);
  const tip = Math.max(...points.map((at) => at.x));

  assert.ok(Math.abs(tip - 23) < 0.05, `tip reached ${tip}`);
  assert.deepEqual(straight.head, { x: 20, y: 0 });
  assert.deepEqual(straight.direction, { x: 1, y: 0 });
});

test("does flare the head wider than the shaft and thin the tail behind it", () => {
  const points = vertices(straight.body);
  const widest = Math.max(...points.map((at) => Math.abs(at.y)));
  const atTail = Math.max(...points.filter((at) => at.x < 0.5).map((at) => Math.abs(at.y)));
  const midShaft = Math.max(
    ...points.filter((at) => at.x > 8 && at.x < 12).map((at) => Math.abs(at.y))
  );

  assert.ok(Math.abs(widest - 3) < 0.05, `head half-width ${widest}`);
  assert.ok(Math.abs(midShaft - 2) < 0.05, `shaft half-width ${midShaft}`);
  assert.ok(atTail < 2, `tail half-width ${atTail} should taper`);
});

test("does keep the gloss inside the body, up the lit side", () => {
  const body = vertices(straight.body);
  // The shaft highlight is the first subpath; the head's spot follows it as an arc.
  const gloss = vertices(straight.gloss.split(" M ")[0] ?? "");
  const bodyTop = Math.min(...body.map((at) => at.y));

  assert.ok(gloss.length > 4);
  assert.ok(gloss.every((at) => at.y > bodyTop), "the highlight sits below the body's upper edge");
  assert.ok(gloss.filter((at) => at.x < 15).every((at) => at.y < 0), "and above the centreline");
});

test("does point a standing spine's head up and put the slit at its tip", () => {
  const standing = resolveSchlongPaths(
    [
      { x: 50, y: 80 },
      { x: 50, y: 70 },
      { x: 50, y: 60 }
    ],
    PROPORTIONS
  );
  const slit = vertices(standing.slit);

  assert.deepEqual(standing.direction, { x: 0, y: -1 });
  assert.ok(slit.every((at) => at.y < 60 && at.y > 57), `slit ${standing.slit}`);
  assert.ok(vertices(standing.corona).every((at) => at.y > 60), "the rim is behind the head");
});

test("does still draw a head when every spine point is the same", () => {
  const collapsed = resolveSchlongPaths(
    [
      { x: 4, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 4 }
    ],
    PROPORTIONS
  );

  assert.match(collapsed.body, /^M /);
  assert.deepEqual(collapsed.head, { x: 4, y: 4 });
});

test("does set the eyes side by side on the head and turn the pupils towards what it looks at", () => {
  const ahead = resolveSchlongFace({ x: 20, y: 0 }, 3, null);
  const looking = resolveSchlongFace({ x: 20, y: 0 }, 3, { x: 120, y: 0 });

  assert.equal(ahead.leftEye.y, ahead.rightEye.y);
  assert.ok(ahead.leftEye.x < 20 && ahead.rightEye.x > 20);
  assert.deepEqual(ahead.pupilOffset, { x: 0, y: 0 });
  assert.ok(looking.pupilOffset.x > 0.3 && looking.pupilOffset.x <= 0.34, `${looking.pupilOffset.x}`);
  assert.equal(looking.pupilOffset.y, 0);
});
