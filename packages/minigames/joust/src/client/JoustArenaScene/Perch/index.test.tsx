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

test("does ring a standing tower's legs when the band is drawn hard enough to fold it", () => {
  const legs = uprightLegs(SHELF);

  assert.doesNotMatch(
    render(<Perch perch={SHELF} legs={legs} isRubble={false} />),
    /data-joust-leg-target/,
    "a slack band marks nothing"
  );

  const targeted = render(<Perch perch={SHELF} legs={legs} isRubble={false} isAimTarget />);
  const rings = targeted.match(/<line[^>]*data-joust-leg-target[^>]*>/g) ?? [];

  assert.equal(rings.length, 2, "both legs are the target, not just the near one");
  assert.match(targeted, /data-joust-leg[^-]/, "the timber itself is still drawn");
});

test("does paint the strain on a leg a shot is leaning on, and leave an untouched one clean", () => {
  const upright = uprightLegs(SHELF);

  assert.doesNotMatch(
    render(<Perch perch={SHELF} legs={upright} isRubble={false} />),
    /data-joust-leg-strain/,
    "a tower nothing has touched does not shudder"
  );

  // A lean the integrator would let spring back: invisible in the timber, loud in the overlay.
  const [nearLeg, farLeg] = upright;
  const nudged = [{ ...nearLeg!, top: { x: nearLeg!.top.x + 3, y: nearLeg!.top.y } }, farLeg!];
  const html = render(<Perch perch={SHELF} legs={nudged} isRubble={false} />);
  const strained = html.match(/data-joust-leg-strain="([\d.]+)"/g) ?? [];

  assert.equal(strained.length, 1, "only the leg that was hit is strained");
  assert.match(html, /data-joust-leg-strain="0\.[1-9]/, "the strain is well clear of the floor");
});

test("does report strain against the leg's own rest height, so a taller tower is not over-read", () => {
  const lean = (perch: typeof SHELF): number => {
    const [near, far] = uprightLegs(perch);
    const html = render(
      <Perch perch={perch} legs={[{ ...near!, top: { x: near!.top.x + 4, y: near!.top.y } }, far!]} isRubble={false} />
    );

    return Number(/data-joust-leg-strain="([\d.]+)"/.exec(html)?.[1] ?? 0);
  };

  assert.ok(lean(HIGH_SHELF) < lean(SHELF), "the same shove leans a long leg proportionally less");
});

// A shelf's dressing is its height, not its content: under a points tier of rise it is a dock at
// the water's edge, and from there up it is a lifeguard tower. The sand is dressed as nothing.
test("does dress a low shelf as a dock and a high one as a lifeguard tower", () => {
  const DOCK = { x: 54, y: 64, width: 28 };
  const dock = render(<Perch perch={DOCK} legs={uprightLegs(DOCK)} isRubble={false} />);
  const tower = render(<Perch perch={SHELF} legs={uprightLegs(SHELF)} isRubble={false} />);

  assert.match(dock, /data-joust-perch-skin="dock"/);
  assert.doesNotMatch(dock, /data-joust-perch-skin="lifeguard-tower"/);
  assert.match(tower, /data-joust-perch-skin="lifeguard-tower"/);
  assert.doesNotMatch(tower, /data-joust-perch-skin="dock"/);
  // The skin repaints the same timber rather than adding any: still two legs, still one plank.
  assert.equal((dock.match(/data-joust-leg[^-]/g) ?? []).length, 2);
  assert.equal((tower.match(/data-joust-leg[^-]/g) ?? []).length, 2);
});

test("does carry the tower's rail down with the plank when the frame folds", () => {
  const railTop = (html: string): number => {
    const skin = /<g data-joust-perch-skin="lifeguard-tower">([\s\S]*?)<\/g>/.exec(html)?.[1] ?? "";
    const ys = [...skin.matchAll(/y2="([-\d.]+)"/g)].map((match) => Number(match[1]));

    return Math.min(...ys);
  };
  const upright = railTop(render(<Perch perch={SHELF} legs={uprightLegs(SHELF)} isRubble={false} />));
  const folded = railTop(
    render(
      <Perch
        perch={SHELF}
        legs={uprightLegs(SHELF).map((leg) => ({ ...leg, top: { x: leg.top.x + 18, y: JOUST_WORLD.floorY - 6 } }))}
        isRubble={false}
      />
    )
  );

  assert.ok(upright < SHELF.y, "upright, the rail stands above the shelf it was authored at");
  assert.ok(folded > upright + 10, "folded, the rail has come down with the plank");
});

test("does lay a fallen tower flat on the sand as rubble", () => {
  const html = render(<Perch perch={SHELF} legs={[]} isRubble />);

  assert.match(html, /data-joust-rubble/);
  assert.doesNotMatch(html, /data-joust-leg/);
  assert.doesNotMatch(html, /data-joust-perch-points/);
});
