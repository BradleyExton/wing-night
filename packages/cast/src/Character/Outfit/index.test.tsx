import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OUTFIT_GENRES, OUTFIT_ITEMS, findOutfitItem, type Outfit } from "@wingnight/shared";

import { Character, CharacterStage, CharacterWing } from "../index.js";
import { CHARACTER_PIVOTS, COSTUME_HEAD_ANCHORS, DRAWN_HEAD_ANCHORS } from "../geometry/index.js";
import { resolveCharacterShapes } from "../shapes/index.js";
import { resolveTeamSilhouette } from "../../resolveTeamSilhouette/index.js";
import { resolveCharacterRagdollRest } from "../ragdoll/index.js";
import { CharacterRagdollFigure } from "../CharacterRagdollFigure/index.js";
import { OUTFIT_DRAWINGS } from "./index.js";
import { resolveSweepPoints } from "./propSweep/index.js";

const drawn = { body: "round", comb: "none", tail: "fan", dance: "bounce" } as const;

// The metal bird in every slot the run 2 port draws.
const METAL_KIT: Outfit = {
  top: { item: "battle-vest-a", style: "ink" },
  sleeve: { item: "flame-sleeve-a", style: "ink" },
  tail: { item: "chain-loop-b", style: "team" },
  boots: { item: "combat-boots-a", style: "white" },
  prop: { item: "flying-v-a", style: "gold" },
  stage: { item: "lava-disc-a", style: "ink" }
};

const dressed = { ...drawn, outfit: METAL_KIT };

const slotsIn = (html: string): string[] => [...html.matchAll(/data-outfit-slot="([a-z]+)"/g)].map((match) => match[1] ?? "");

test("does draw a bare bird with no outfit markup at all", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} silhouette="spiky" showpieces />);

  assert.doesNotMatch(html, /data-outfit/);
});

test("does draw the kit, back to front, and no showpiece when the bird is not on show", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" />);

  assert.deepEqual(slotsIn(html), ["tail", "boots", "boots", "sleeve", "top"]);
});

test("does draw the Stage first and the Prop over the Top when the bird is on show", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" showpieces />);

  assert.deepEqual(slotsIn(html), ["stage", "tail", "boots", "boots", "sleeve", "top", "prop"]);
});

test("does mark each worn item with its slot, item, style and side", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" showpieces />);

  assert.match(html, /data-outfit-slot="top" data-outfit-item="battle-vest-a" data-outfit-style="ink"/);
  assert.match(html, /data-outfit-slot="prop" data-outfit-item="flying-v-a" data-outfit-style="gold"/);
  assert.match(html, /data-outfit-slot="boots" data-outfit-item="combat-boots-a" data-outfit-style="white" data-outfit-side="far"/);
  assert.match(html, /data-outfit-slot="boots" data-outfit-item="combat-boots-a" data-outfit-style="white" data-outfit-side="near"/);
});

test("does put the Top on the body's rig between the wing and the head", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" pose="walk" />);
  const wing = html.indexOf('data-character-part="wing"');
  const top = html.indexOf('data-outfit-slot="top"');
  const head = html.indexOf('data-character-part="head"');
  const topPart = html.lastIndexOf("<g data-character-part=", top);

  assert.ok(wing < top && top < head);
  assert.match(html.slice(topPart), /^<g data-character-part="body" class="[^"]*cast-bob/);
});

test("does draw the Sleeve inside the wing, so it beats with it", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" />);
  const wing = html.indexOf('data-character-part="wing"');
  const sleeve = html.indexOf('data-outfit-slot="sleeve"');

  assert.ok(wing < sleeve && sleeve < html.indexOf('data-outfit-slot="top"'));
});

test("does leave the Sleeve and the Prop off a bird whose wing is drawn elsewhere", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" wing="none" showpieces />);

  assert.deepEqual(slotsIn(html), ["stage", "tail", "boots", "boots", "top"]);
});

test("does draw the Sleeve on a wing drawn on its own layer", () => {
  const html = renderToStaticMarkup(<CharacterWing appearance={dressed} silhouette="spiky" />);

  assert.deepEqual(slotsIn(html), ["sleeve"]);
  assert.deepEqual(slotsIn(renderToStaticMarkup(<CharacterWing silhouette="spiky" />)), []);
});

test("does leave the Stage to a surface's own ground when asked", () => {
  const bird = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" showpieces stage="none" />);
  const ground = renderToStaticMarkup(<CharacterStage appearance={dressed} />);

  assert.ok(!slotsIn(bird).includes("stage"));
  assert.deepEqual(slotsIn(ground), ["stage"]);
  assert.equal(renderToStaticMarkup(<CharacterStage appearance={drawn} />), "");
});

test("does take the boots off a bird riding a board, whose legs are redrawn bent", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" pose="ride" />);

  assert.deepEqual(slotsIn(html), ["tail", "sleeve", "top"]);
});

test("does draw a boot on each leg about that leg's own hip", () => {
  const html = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" />);

  // combat-boots a's shaft starts five units behind the ankle, one behind the hip.
  assert.match(html, new RegExp(`data-outfit-side="far"><g><path class="[^"]*" d="M ${CHARACTER_PIVOTS.legFar.x - 6} 56 `));
  assert.match(html, new RegExp(`data-outfit-side="near"><g><path class="[^"]*" d="M ${CHARACTER_PIVOTS.legNear.x - 6} 56 `));
});

test("does start the vest at the photo's shoulders under a costume head and the chin under a drawn one", () => {
  const underDrawn = renderToStaticMarkup(<Character appearance={dressed} silhouette="spiky" />);
  const underCostume = renderToStaticMarkup(
    <Character appearance={{ ...dressed, avatarSrc: "/a.png" }} silhouette="spiky" />
  );

  assert.match(underDrawn, /d="M 47\.8 32 L 72 32 /);
  assert.match(underCostume, /d="M 49\.03 37 L 72 37 /);
});

test("does skip an item the cast has no drawing for and keep the rest", () => {
  // Every catalogue item is drawn, so the undrawn one is an id a hand-edited
  // pack made up (the tolerant reader drops those first; the layer still holds).
  const html = renderToStaticMarkup(
    <Character
      appearance={{ ...drawn, outfit: { top: { item: "battle-vest-z" }, tail: { item: "chain-loop-b" } } }}
      silhouette="spiky"
    />
  );

  assert.deepEqual(slotsIn(html), ["tail"]);
});

test("does refuse an item worn in a slot it was not drawn for", () => {
  const html = renderToStaticMarkup(
    <Character appearance={{ ...drawn, outfit: { sleeve: { item: "battle-vest-a" } } }} silhouette="spiky" />
  );

  assert.deepEqual(slotsIn(html), []);
});

test("does give the ragdoll the kit, a Sleeve on both wings and the Top over the near wing", () => {
  const html = renderToStaticMarkup(
    <svg>
      <CharacterRagdollFigure appearance={dressed} silhouette="spiky" transforms={resolveCharacterRagdollRest()} />
    </svg>
  );
  const layers = [...html.matchAll(/data-character-ragdoll-part="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(slotsIn(html), ["sleeve", "tail", "boots", "boots", "sleeve", "top"]);
  assert.deepEqual(layers, ["wingFar", "tail", "legFar", "body", "legNear", "wingNear", "outfit", "head"]);
});

test("does draw only items the catalogue lists, each in the catalogue's slot", () => {
  for (const [id, drawing] of Object.entries(OUTFIT_DRAWINGS)) {
    assert.equal(findOutfitItem(id)?.slot, drawing?.slot, id);
  }
});

test("does draw every catalogue item", { todo: "run 3 ports the other kept items" }, () => {
  const undrawn = OUTFIT_ITEMS.filter((item) => item.slot !== "move" && OUTFIT_DRAWINGS[item.id] === undefined);

  assert.equal(undrawn.length, 0, `${undrawn.length} kept items have no drawing yet, from ${undrawn[0]?.id ?? "none"}`);
});

// The Prop sweep (docs/research/bird-wardrobe.md §2.1): a prop turns with the
// wing about the shoulder, so at rest and the walk tuck no point of it may
// enter the head box or drop through the floor, and at the dance extremes it
// may pass behind the head but dip at most four units under the floor.
//
// Measured as the harness measured it for Gate 1: points along the outline
// that SHOWS (`resolveSweepPoints`), on every body the prop is worn on, in
// every style, under both heads. The outline is the shape's own edge, not the
// outside of its ink, because that is the line every kept prop was drawn to.
// The Moves' own wing extremes are run 5's face-crossing sweep.
const HEAD_BOX = { x0: 36, x1: 80, y0: -12, y1: 37 };
const FLOOR_Y = 72.75;
const SOFT_DIP = 4;
const SWEEP = [
  { angle: 0, strict: true },
  { angle: -8, strict: true },
  { angle: -26, strict: false },
  { angle: -62, strict: false }
];

const turnAboutShoulder = ([x, y]: [number, number], degrees: number): [number, number] => {
  const { x: px, y: py } = CHARACTER_PIVOTS.wing;
  const radians = (degrees * Math.PI) / 180;

  return [
    px + (x - px) * Math.cos(radians) - (y - py) * Math.sin(radians),
    py + (x - px) * Math.sin(radians) + (y - py) * Math.cos(radians)
  ];
};

test("does keep every prop out of the face and above the floor through the sweep", () => {
  const props = OUTFIT_ITEMS.filter((item) => item.slot === "prop");

  assert.ok(props.length > 0);

  for (const item of props) {
    const drawing = OUTFIT_DRAWINGS[item.id];

    // An undrawn prop is the test above's failure, not this one's.
    if (drawing === undefined) {
      continue;
    }

    for (const genre of item.genre === "shared" ? OUTFIT_GENRES : [item.genre]) {
      const silhouette = resolveTeamSilhouette({ genre });
      const shapes = resolveCharacterShapes({ body: "round", comb: "crest", tail: "fan", silhouette });

      for (const style of item.styles) {
        for (const head of [DRAWN_HEAD_ANCHORS, COSTUME_HEAD_ANCHORS]) {
          const label = `${item.id} (${genre}, ${style}, ${head === DRAWN_HEAD_ANCHORS ? "drawn" : "costume"} head)`;
          const points = resolveSweepPoints(
            renderToStaticMarkup(
              <svg>
                <drawing.Drawing context={{ shapes, silhouette, head, style }} />
              </svg>
            )
          );

          assert.ok(points.length > 0, label);

          for (const { angle, strict } of SWEEP) {
            for (const point of points) {
              const [x, y] = turnAboutShoulder(point, angle);

              assert.ok(y <= FLOOR_Y + (strict ? 0 : SOFT_DIP), `${label} at ${angle}° dips to ${y.toFixed(1)}`);

              if (strict) {
                const inHead = x > HEAD_BOX.x0 && x < HEAD_BOX.x1 && y < HEAD_BOX.y1 && y > HEAD_BOX.y0;

                assert.ok(!inHead, `${label} at ${angle}° reaches the head at (${x.toFixed(1)}, ${y.toFixed(1)})`);
              }
            }
          }
        }
      }
    }
  }
});
