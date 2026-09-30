import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Character, CharacterWing } from "./index.js";
import {
  CHARACTER_FOOT,
  CHARACTER_LEG_STROKE_WIDTH,
  CHARACTER_PARTS,
  CHARACTER_PIVOTS,
  CHARACTER_POSES,
  CHARACTER_RIDE_STANCE
} from "./geometry/index.js";
import { resolveCharacterRideStance, resolveCharacterShapes, resolveCharacterWingPath } from "./shapes/index.js";
import {
  CHARACTER_BODIES,
  CHARACTER_DANCES,
  type CharacterBody,
  type CharacterDance
} from "../resolvePlayerAppearance/index.js";
import { CHARACTER_SILHOUETTES, type CharacterSilhouette } from "../resolveTeamSilhouette/index.js";
import * as figureStyles from "./CharacterFigure/styles.js";

const drawn = { body: "round", comb: "none", tail: "fan", dance: "bounce" } as const;
const costume = {
  ...drawn,
  avatarSrc: "http://127.0.0.1:3000/content-assets/avatars/brad.png"
} as const;

test("does draw the two-eye face on a circle head when the appearance has no avatar", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} />);

  assert.match(html, /data-character-body="round"/);
  assert.match(html, /data-character-comb="none"/);
  assert.match(html, /data-character-tail="fan"/);
  assert.equal((html.match(/<circle/g) ?? []).length, 5);
  assert.doesNotMatch(html, /<image/);
  assert.doesNotMatch(html, /<filter/);
});

test("does draw the two mandibles, the wattle and both legs in primary whatever the fill", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} fillClassName="text-teamA" />);

  assert.equal((html.match(/fill-primary/g) ?? []).length, 3);
  assert.equal((html.match(/stroke-primary/g) ?? []).length, 2);
});

test("does wear the avatar as its own silhouette in place of the drawn head when the appearance has one", () => {
  const html = renderToStaticMarkup(<Character appearance={costume} />);

  assert.match(
    html,
    /<image href="http:\/\/127\.0\.0\.1:3000\/content-assets\/avatars\/brad\.png"[^>]*filter="url\(#[^"]+\)"/
  );
  assert.match(html, /preserveAspectRatio="xMidYMax meet"/);
  assert.doesNotMatch(html, /clipPath/);
  assert.equal((html.match(/<circle/g) ?? []).length, 0, "no head circle and no drawn eyes");
});

test("does halo the avatar in the bg ink when the appearance has one", () => {
  const html = renderToStaticMarkup(<Character appearance={costume} />);

  assert.match(html, /<feMorphology in="SourceAlpha" operator="dilate"/);
  assert.match(html, /<feFlood class="\[flood-color:theme\(colors\.bg\)\]"/);
});

test("does perch the comb on the drawn head and leave it off a costume head", () => {
  const drawnHtml = renderToStaticMarkup(<Character appearance={{ ...drawn, comb: "crest" }} />);
  const costumeHtml = renderToStaticMarkup(<Character appearance={{ ...costume, comb: "crest" }} />);

  assert.match(drawnHtml, /transform="translate\(2 -1\)"/);
  assert.doesNotMatch(costumeHtml, /transform="translate\(2 -21\)"/);
  assert.match(costumeHtml, /data-character-comb="crest"/, "the roll is still the player's");
});

test("does keep the beak and wattle off a costume head so no second head shows behind the face", () => {
  const drawnHtml = renderToStaticMarkup(<Character appearance={drawn} />);
  const costumeHtml = renderToStaticMarkup(<Character appearance={costume} />);

  assert.match(drawnHtml, /d="M 69 16 L 81 20 L 69 21 Z"/);
  assert.doesNotMatch(costumeHtml, /class="fill-primary[^"]*"/);
});

test("does give each character its own halo id when several render together", () => {
  const html = renderToStaticMarkup(
    <div>
      <Character appearance={{ ...drawn, avatarSrc: "/a.png" }} />
      <Character appearance={{ ...drawn, avatarSrc: "/b.png" }} />
    </div>
  );
  const haloIds = [...html.matchAll(/<filter id="([^"]+)"/g)].map((match) => match[1]);

  assert.equal(haloIds.length, 2);
  assert.notEqual(haloIds[0], haloIds[1]);
});

test("does use the given fill class instead of the muted default when one is passed", () => {
  const html = renderToStaticMarkup(
    <Character appearance={{ body: "wide", comb: "mohawk", tail: "plume", dance: "flap" }} fillClassName="text-teamB" />
  );

  assert.match(html, /text-teamB/);
  assert.doesNotMatch(html, /text-mutedWarm/);
});

test("does dress the bird in the team's apparel only when one is given", () => {
  const bare = renderToStaticMarkup(<Character appearance={drawn} />);
  const dressed = renderToStaticMarkup(<Character appearance={drawn} apparel="hat" />);

  assert.doesNotMatch(bare, /data-character-apparel/);
  assert.match(dressed, /data-character-apparel="hat"/);
});

test("does take the apparel off the face when the bird wears its own head", () => {
  for (const apparel of ["hat", "shades"] as const) {
    const onDrawn = renderToStaticMarkup(<Character appearance={drawn} apparel={apparel} />);
    const onCostume = renderToStaticMarkup(<Character appearance={costume} apparel={apparel} />);

    assert.match(onDrawn, new RegExp(`data-character-apparel="${apparel}"`));
    assert.doesNotMatch(onCostume, /data-character-apparel/);
  }
});

// Every y coordinate inside an apparel group, whatever shape carries it.
const apparelYs = (html: string, apparel: string): number[] => {
  const group = html.match(new RegExp(`data-character-apparel="${apparel}"(.*?)</g>`, "s"))?.[1];
  assert.ok(group !== undefined, `no ${apparel} group in the markup`);

  const ys = [
    ...[...group.matchAll(/[MLQ]\s[-\d.]+\s([-\d.]+)/g)].map((m) => Number(m[1])),
    ...[...group.matchAll(/\s([-\d.]+)\s[-\d.]+\s[-\d.]+\s([-\d.]+)/g)].map((m) => Number(m[2])),
    ...[...group.matchAll(/cy="([-\d.]+)"\s+r="([\d.]+)"/g)].flatMap((m) => [
      Number(m[1]) - Number(m[2]),
      Number(m[1]) + Number(m[2])
    ])
  ].filter((y) => Number.isFinite(y));

  assert.ok(ys.length > 0, `no coordinates parsed out of the ${apparel} group`);
  return ys;
};

test("does keep the apparel that hangs below the head, dropped clear of a photographed jaw", () => {
  // The guarantee is not a coordinate, it is a relationship: a prop that hangs
  // below the head must sit ENTIRELY under a costume head's photo, whose
  // bottom edge is the drawn chin at 32, or it crops somebody's jaw. Asserted
  // as a property rather than as a path string so redrawing a prop cannot
  // quietly reintroduce the bite.
  for (const apparel of ["medallion"] as const) {
    const onDrawn = renderToStaticMarkup(<Character appearance={drawn} apparel={apparel} />);
    const onCostume = renderToStaticMarkup(<Character appearance={costume} apparel={apparel} />);

    assert.ok(
      Math.min(...apparelYs(onCostume, apparel)) > 32,
      `${apparel} rises into a photographed jaw`
    );
    // And it hangs lower on a costume head than on a drawn one, which is the
    // COSTUME_SHOULDER_DROP doing its job rather than the two coinciding.
    assert.ok(
      Math.min(...apparelYs(onCostume, apparel)) >
        Math.min(...apparelYs(onDrawn, apparel)),
      `${apparel} does not drop for a costume head`
    );
  }
});

test("does leave the wing off the figure when the surface draws it on its own layer", () => {
  const winged = renderToStaticMarkup(<Character appearance={drawn} />);
  const wingless = renderToStaticMarkup(<Character appearance={drawn} wing="none" />);

  assert.match(winged, /data-character-wing/);
  assert.doesNotMatch(wingless, /data-character-wing/);
});

test("does draw the wing alone in the bird's box with its origin on the shoulder when asked for the wing layer", () => {
  const html = renderToStaticMarkup(<CharacterWing fillClassName="text-teamA" />);

  assert.match(html, /<svg[^>]*viewBox="0 0 80 72"[^>]*data-character-wing/);
  assert.match(html, /origin-\[58\.75%_48\.6%\]/);
  assert.match(html, /text-teamA/);
  assert.equal((html.match(/<path/g) ?? []).length, 1);
});

test("does draw the silhouette's own wing on the standalone wing layer", () => {
  for (const silhouette of CHARACTER_SILHOUETTES) {
    const html = renderToStaticMarkup(<CharacterWing silhouette={silhouette} />);

    assert.ok(
      html.includes(`d="${resolveCharacterWingPath(silhouette)}"`),
      `${silhouette} wing layer draws the stock wing`
    );
  }
});


test("does keep the wing layer's origin on the shoulder pivot the figure turns the wing about", () => {
  const html = renderToStaticMarkup(<CharacterWing />);
  const [, x, y] = html.match(/origin-\[([\d.]+)%_([\d.]+)%\]/) ?? [];

  assert.ok(Math.abs(Number(x) / 100 - CHARACTER_PIVOTS.wing.x / 80) < 0.001);
  assert.ok(Math.abs(Number(y) / 100 - CHARACTER_PIVOTS.wing.y / 72) < 0.001);
});

test("does wrap every part on its own pivot so a pose turns it in place", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} />);

  for (const part of CHARACTER_PARTS) {
    const { x, y } = CHARACTER_PIVOTS[part];
    const wrapped = new RegExp(
      `<g transform="translate\\(${x} ${y}\\)"><g data-character-part="${part}"[^>]*><g transform="translate\\(${-x} ${-y}\\)">`
    );

    assert.match(html, wrapped, `${part} is on its pivot`);
  }
});

test("does stand still with no beat on any part unless a pose is asked for", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} />);

  assert.match(html, /data-character-pose="still"/);
  assert.doesNotMatch(html, /animation:|transform:rotate/);
});

test("does put each pose's beats on the parts the pose table names", () => {
  for (const pose of CHARACTER_POSES) {
    if (pose === "dance") {
      continue;
    }

    const html = renderToStaticMarkup(<Character appearance={drawn} pose={pose} />);

    assert.match(html, new RegExp(`data-character-pose="${pose}"`));

    for (const part of CHARACTER_PARTS) {
      const className = figureStyles.poses[pose][part];
      const partTag = html.match(new RegExp(`<g data-character-part="${part}"[^>]*>`))?.[0] ?? "";

      if (className === undefined) {
        assert.doesNotMatch(partTag, /class=/, `${pose}: ${part} has no beat`);
      } else {
        assert.ok(partTag.includes(className), `${pose}: ${part} carries ${className}`);
      }
    }
  }
});

test("does tuck both legs and loop nothing when flying", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} pose="fly" />);

  assert.equal((html.match(/transform:rotate\(55deg\)/g) ?? []).length, 2);
  assert.doesNotMatch(html, /animation:/);
});

test("does swing the far leg half a stride behind the near one when walking", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} pose="walk" />);

  // The stride's own phase is the bird's (`--cast-step-phase`, from its
  // groove); the half-stride between the two legs is the walk's, and is baked
  // into the far leg's fallback so a bird nobody grooved still walks properly.
  assert.match(html, /data-character-part="legNear" class="[^"]*cast-step_0\.5s_ease-in-out_var\(--cast-step-phase,0ms\)_infinite/);
  assert.match(html, /data-character-part="legFar" class="[^"]*cast-step_0\.5s_ease-in-out_var\(--cast-step-phase-far,-0\.25s\)_infinite/);
});

test("does shade the belly in the outline ink at a fifth and nothing else", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} />);

  assert.equal((html.match(/fill-bg\/20/g) ?? []).length, 1);
});

test("does dance the player's own move, answering the beat on a group ancestor, when asked to dance", () => {
  for (const dance of CHARACTER_DANCES) {
    const html = renderToStaticMarkup(<Character appearance={{ ...drawn, dance }} pose="dance" />);

    assert.match(html, /data-character-pose="dance"/);

    for (const part of CHARACTER_PARTS) {
      const className = figureStyles.dances[dance][part];
      const partTag = html.match(new RegExp(`<g data-character-part="${part}"[^>]*>`))?.[0] ?? "";

      if (className === undefined) {
        assert.doesNotMatch(partTag, /class=/, `${dance}: ${part} holds still`);
      } else {
        assert.ok(partTag.includes(className), `${dance}: ${part} carries ${className}`);
        assert.match(className, /transition:transform/);
        assert.match(className, /group-data-\[beat=1\]\/beat:/);
      }
    }
  }
});

test("does keep the beat off a clock, so the step is the one the room is hearing", () => {
  for (const dance of CHARACTER_DANCES) {
    const html = renderToStaticMarkup(<Character appearance={{ ...drawn, dance }} pose="dance" />);
    const beaten = html.match(/<g data-character-part="[^"]*" class="[^"]*"/g) ?? [];

    for (const partTag of beaten) {
      assert.doesNotMatch(partTag, /animation:/, `${dance} is on the beat, not a clock`);
    }
  }
});

test("does run a jig under the beat on a layer of its own, so quick feet and the beat both move a leg", () => {
  for (const dance of CHARACTER_DANCES) {
    const html = renderToStaticMarkup(<Character appearance={{ ...drawn, dance }} pose="dance" />);

    // Every dance has quick feet, whatever else it does.
    assert.match(html, /data-character-jig="legNear"/, `${dance} has a near foot going`);
    assert.match(html, /data-character-jig="legFar"/, `${dance} has a far foot going`);

    for (const part of CHARACTER_PARTS) {
      const className = figureStyles.danceJigs[dance][part];

      if (className === undefined) {
        assert.doesNotMatch(
          html,
          new RegExp(`data-character-jig="${part}"`),
          `${dance}: ${part} is not wrapped when it has no jig`
        );
        continue;
      }

      // The jig wraps the beat, not the other way round: one element carries
      // one transform, and the beat is already using the inner one.
      assert.match(
        html,
        new RegExp(`<g data-character-jig="${part}" class="[^"]*"><g data-character-part="${part}"`),
        `${dance}: ${part}'s jig is the layer around its beat`
      );
      assert.match(className, /motion-safe:\[animation:cast-jig/);
      assert.match(className, /var\(--cast-(jig|jive)-ms/, `${dance}: ${part} runs at the bird's own tempo`);
    }
  }
});

test("does leave the drawing untouched by the jig for every pose but dancing", () => {
  for (const pose of CHARACTER_POSES) {
    if (pose === "dance") {
      continue;
    }

    const html = renderToStaticMarkup(<Character appearance={drawn} pose={pose} />);

    assert.doesNotMatch(html, /data-character-jig/, `${pose} is not a dance`);
  }
});

test("does step differently from bird to bird so a dancing team is not one bird four times", () => {
  const steps = new Set(
    CHARACTER_DANCES.map((dance: CharacterDance) =>
      renderToStaticMarkup(<Character appearance={{ ...drawn, dance }} pose="dance" />)
    )
  );

  assert.equal(steps.size, CHARACTER_DANCES.length);
});

// Every shape a riding bird can be: each stock body, and each genre's.
const RIDERS: { body: CharacterBody; silhouette: CharacterSilhouette | undefined }[] = [
  ...CHARACTER_BODIES.map((body) => ({ body, silhouette: undefined })),
  ...CHARACTER_SILHOUETTES.map((silhouette) => ({ body: "round" as const, silhouette }))
];

type Point = { x: number; y: number };

const pointsOf = (d: string): Point[] => {
  const numbers = (d.match(/-?[\d.]+/g) ?? []).map(Number);
  const points: Point[] = [];

  for (let index = 0; index + 1 < numbers.length; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }

  return points;
};

// The two legs of a riding bird, as drawn: `[hip, knee, ankle, heel, ankle, toe]`.
const ridingLegs = (html: string): { near: Point[]; far: Point[] } => {
  const leg = (part: string): Point[] => {
    const d = html.match(
      new RegExp(`data-character-part="${part}"[\\s\\S]*?<path class="${figureStyles.legs.replace(/[[\]().:]/g, "\\$&")}" d="([^"]+)"`)
    )?.[1];
    assert.ok(d !== undefined, `no ${part} drawn`);
    return pointsOf(d);
  };

  return { near: leg("legNear"), far: leg("legFar") };
};

const partDrop = (html: string, part: string): number => {
  const [, y] = html.match(new RegExp(`<g transform="translate\\([-\\d.]+ ([-\\d.]+)\\)"><g data-character-part="${part}"`)) ?? [];
  return Number(y) - CHARACTER_PIVOTS[part as keyof typeof CHARACTER_PIVOTS].y;
};

// The lowest point a path reaches, walking its curves rather than trusting
// their control points (a curve's handles hang below the curve itself).
const lowestYOf = (d: string): number => {
  const tokens = d.match(/[MLCQZ]|-?[\d.]+/g) ?? [];
  let index = 0;
  let command = "";
  let at: Point = { x: 0, y: 0 };
  let lowest = -Infinity;
  const next = (): number => Number(tokens[index++]);

  while (index < tokens.length) {
    if (/[MLCQZ]/.test(tokens[index])) {
      command = tokens[index++];
    }
    if (command === "Z") {
      continue;
    }
    if (command === "M" || command === "L") {
      at = { x: next(), y: next() };
      lowest = Math.max(lowest, at.y);
      continue;
    }

    const handles = command === "C" ? [at.y, (next(), next()), (next(), next())] : [at.y, (next(), next())];
    const end = { x: next(), y: next() };
    const ys = [...handles, end.y];

    for (let step = 0; step <= 64; step += 1) {
      const u = step / 64;
      const y =
        ys.length === 4
          ? (1 - u) ** 3 * ys[0] + 3 * (1 - u) ** 2 * u * ys[1] + 3 * (1 - u) * u ** 2 * ys[2] + u ** 3 * ys[3]
          : (1 - u) ** 2 * ys[0] + 2 * (1 - u) * u * ys[1] + u ** 2 * ys[2];
      lowest = Math.max(lowest, y);
    }
    at = end;
  }

  return lowest;
};

test("does plant both feet flat on one line when riding", () => {
  for (const rider of RIDERS) {
    for (const appearance of [drawn, costume]) {
      const html = renderToStaticMarkup(
        <Character appearance={{ ...appearance, body: rider.body }} silhouette={rider.silhouette} pose="ride" />
      );
      const { near, far } = ridingLegs(html);

      for (const leg of [near, far]) {
        const lowest = Math.max(...leg.map((point) => point.y));
        const onTheLine = leg.filter((point) => point.y === CHARACTER_RIDE_STANCE.toeY);

        assert.equal(lowest, CHARACTER_RIDE_STANCE.toeY, `${rider.silhouette ?? rider.body}: nothing below the toe line`);
        assert.ok(onTheLine.length >= 2, `${rider.silhouette ?? rider.body}: heel and toe both down, so the foot is flat`);
      }
    }
  }
});

test("does stand the feet on the exported stance whatever the bird's shape when riding", () => {
  const { backFootX, frontFootX, footReach, deckFromX, deckToX, toeY } = CHARACTER_RIDE_STANCE;

  for (const rider of RIDERS) {
    const html = renderToStaticMarkup(
      <Character appearance={{ ...drawn, body: rider.body }} silhouette={rider.silhouette} pose="ride" />
    );
    const { near, far } = ridingLegs(html);
    const soleXs = (leg: Point[]): number[] => leg.filter((point) => point.y === toeY).map((point) => point.x);

    assert.deepEqual(
      [Math.min(...soleXs(near)), Math.max(...soleXs(near))],
      [backFootX - footReach, backFootX + footReach],
      "the near foot is the back foot"
    );
    assert.deepEqual(
      [Math.min(...soleXs(far)), Math.max(...soleXs(far))],
      [frontFootX - footReach, frontFootX + footReach],
      "the far foot is the front foot"
    );
    // The deck the stance names reaches the painted end of both feet, round caps and all.
    assert.equal(deckFromX, backFootX - footReach - CHARACTER_LEG_STROKE_WIDTH / 2);
    assert.equal(deckToX, frontFootX + footReach + CHARACTER_LEG_STROKE_WIDTH / 2);
  }
});

test("does put the deck's top under the painted sole, on the cast's own foot line, when riding", () => {
  // The legs are stroked as wide as the stance says they are, so half of it is
  // the paint under the toes' centreline and the deck is exactly under that.
  assert.match(figureStyles.legs, new RegExp(`\\[stroke-width:${CHARACTER_LEG_STROKE_WIDTH}\\]`));
  assert.equal(CHARACTER_RIDE_STANCE.deckY, CHARACTER_RIDE_STANCE.toeY + CHARACTER_LEG_STROKE_WIDTH / 2);
  // A surface that already stands the cast on `CHARACTER_FOOT` keeps it on its board.
  assert.equal(CHARACTER_RIDE_STANCE.toeY, CHARACTER_FOOT.y);
  assert.equal((CHARACTER_RIDE_STANCE.backFootX + CHARACTER_RIDE_STANCE.frontFootX) / 2, CHARACTER_FOOT.x);
});

test("does raise the wings when riding", () => {
  const degrees = Number(figureStyles.poses.ride.wing?.match(/rotate\((-?[\d.]+)deg\)/)?.[1]);
  const radians = (degrees * Math.PI) / 180;
  const pivot = CHARACTER_PIVOTS.wing;

  assert.ok(Number.isFinite(degrees), "the wing turns on the board");

  for (const silhouette of [undefined, ...CHARACTER_SILHOUETTES]) {
    const wing = pointsOf(resolveCharacterWingPath(silhouette));
    const tip = wing.reduce((far, point) =>
      Math.hypot(point.x - pivot.x, point.y - pivot.y) > Math.hypot(far.x - pivot.x, far.y - pivot.y) ? point : far
    );
    const dx = tip.x - pivot.x;
    const dy = tip.y - pivot.y;
    // SVG turns clockwise on screen, y down.
    const raisedY = dx * Math.sin(radians) + dy * Math.cos(radians);

    assert.ok(dy > 0, `${silhouette ?? "stock"}: the folded wing's tip hangs below the shoulder`);
    assert.ok(raisedY < 0, `${silhouette ?? "stock"}: on the board it is held up above the shoulder`);
  }
});

test("does crouch everything above the knees and leave the feet where they stand when riding", () => {
  for (const rider of RIDERS) {
    const html = renderToStaticMarkup(
      <Character appearance={{ ...drawn, body: rider.body }} silhouette={rider.silhouette} pose="ride" />
    );
    const { crouch } = resolveCharacterRideStance(rider);

    assert.ok(crouch > 0, `${rider.silhouette ?? rider.body} crouches`);

    for (const part of ["tail", "body", "wing", "head"]) {
      assert.equal(partDrop(html, part), crouch, `${rider.silhouette ?? rider.body}: the ${part} sinks`);
    }
    for (const part of ["legNear", "legFar"]) {
      assert.equal(partDrop(html, part), 0, `${rider.silhouette ?? rider.body}: the ${part} stays planted`);
    }

    const { near, far } = ridingLegs(html);
    assert.equal(near[0].y, CHARACTER_PIVOTS.legNear.y + crouch, "the near leg hangs from the sunk hip");
    assert.equal(far[0].y, CHARACTER_PIVOTS.legFar.y + crouch, "the far leg hangs from the sunk hip");
  }
});

test("does bow each knee out from between the feet when riding", () => {
  const { near, far } = ridingLegs(renderToStaticMarkup(<Character appearance={drawn} pose="ride" />));
  const [nearHip, nearKnee, nearAnkle] = near;
  const [farHip, farKnee, farAnkle] = far;

  assert.ok(nearKnee.x < (nearHip.x + nearAnkle.x) / 2, "the back knee bends back");
  assert.ok(farKnee.x > (farHip.x + farAnkle.x) / 2, "the front knee bends forward");
  assert.ok(nearKnee.y < nearAnkle.y && farKnee.y < farAnkle.y, "each knee is above its foot");
});

test("does keep the crouched belly off the toes for every shape when riding", () => {
  // The body's own outline is a 2-unit stroke; the toes' is the leg stroke.
  const bellyInk = 1;
  const toeTop = CHARACTER_RIDE_STANCE.toeY - CHARACTER_LEG_STROKE_WIDTH / 2;

  for (const rider of RIDERS) {
    const shapes = resolveCharacterShapes({ body: rider.body, comb: "none", tail: "fan", silhouette: rider.silhouette });
    const { crouch } = resolveCharacterRideStance(rider);
    const lowest = Math.max(lowestYOf(shapes.body), lowestYOf(shapes.belly)) + crouch + bellyInk;

    assert.ok(lowest < toeTop, `${rider.silhouette ?? rider.body} sits its belly on its feet (${lowest} ≥ ${toeTop})`);
  }
});

test("does loop nothing and groove nothing when riding, so a surface can move the rider itself", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} pose="ride" />);

  assert.match(html, /data-character-pose="ride"/);
  assert.doesNotMatch(html, /animation:/);
  assert.doesNotMatch(html, /var\(--cast-/);
  assert.doesNotMatch(html, /data-character-jig/);
});

test("does carry the costume head and the apparel down through the crouch when riding", () => {
  const html = renderToStaticMarkup(<Character appearance={{ ...costume, body: "wide" }} apparel="medallion" pose="ride" />);
  const head = html.match(/<g data-character-part="head"[\s\S]*$/)?.[0] ?? "";

  assert.equal(partDrop(html, "head"), resolveCharacterRideStance({ body: "wide", silhouette: undefined }).crouch);
  assert.match(head, /<image href="http:\/\/127\.0\.0\.1:3000/);
  assert.match(head, /data-character-apparel="medallion"/);
});
