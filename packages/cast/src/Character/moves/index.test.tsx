import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OUTFIT_ITEMS } from "@wingnight/shared";

import { Character } from "../index.js";
import { CHARACTER_PARTS } from "../geometry/index.js";
import {
  CHARACTER_MOVES,
  resolveCharacterMoveClassName,
  resolveCharacterMovePartTransform,
  resolveCharacterMovePropTransform,
  resolveCharacterMovesCss
} from "./index.js";

const drawn = { body: "round", comb: "none", tail: "fan", dance: "bounce" } as const;

test("does hold in moves.css exactly what the generator writes", () => {
  const onDisk = readFileSync(new URL("../../moves.css", import.meta.url), "utf8");

  assert.equal(
    onDisk,
    resolveCharacterMovesCss(),
    "moves.css is stale: from packages/cast run\n" +
      `npx tsx -e 'import { resolveCharacterMovesCss } from "./src/Character/moves/index.ts"; import { writeFileSync } from "node:fs"; writeFileSync("src/moves.css", resolveCharacterMovesCss());'`
  );
});

test("does play every Move the catalogue sells, and no other", () => {
  const sold = OUTFIT_ITEMS.filter((item) => item.slot === "move").map((item) => item.id);

  assert.deepEqual([...CHARACTER_MOVES].sort(), [...sold].sort());
});

test("does name every part's keyframes from each Move's class, none for a part that holds still", () => {
  const css = resolveCharacterMovesCss();

  for (const move of [...CHARACTER_MOVES, "the-bump-answer"] as const) {
    const rule = css.match(new RegExp(`\\.${resolveCharacterMoveClassName(move)} \\{([^}]*)\\}`))?.[1] ?? "";

    for (const part of [...CHARACTER_PARTS, "prop"]) {
      const named = rule.match(new RegExp(`--cast-move-${part}: ([\\w-]+);`))?.[1];

      assert.ok(named !== undefined, `${move} names ${part}`);
      assert.ok(named === "none" || css.includes(`@keyframes ${named} {`), `${move} ${part} has its keyframes`);
    }
  }
});

test("does start and end every Move at rest so a bird hands back to its pose", () => {
  for (const block of resolveCharacterMovesCss().split("@keyframes ").slice(1)) {
    const frames = [...block.matchAll(/transform: ([^;]+);/g)].map((match) => match[1]);

    assert.equal(frames[0], "translate(0px, 0px) rotate(0deg)", block.slice(0, 40));
    assert.equal(frames.at(-1), "translate(0px, 0px) rotate(0deg)", block.slice(0, 40));
  }
});

test("does mirror only the wing about its shoulder when a key pose flips it", () => {
  const pose = { wing: -26, wingFlip: true, wingX: 11, wingY: 6 };

  assert.equal(resolveCharacterMovePartTransform(pose, "wing"), "translate(11px, 6px) rotate(-26deg) scale(-1, 1)");
  assert.equal(resolveCharacterMovePartTransform(pose, "head"), "translate(0px, 0px) rotate(0deg)");
  assert.match(resolveCharacterMovesCss(), /@keyframes cast-move-heart-point-wing \{[^@]*scale\(-1, 1\)/);
  assert.match(resolveCharacterMovesCss(), /@keyframes cast-move-chicken-dance-wing \{[^@]*scale\(-1, 1\)/);
});

test("does set the Prop down on the body while the wing is flipped and hand it back after", () => {
  const clap = { wing: 60, wingFlip: true, wingX: 2, wingY: 2, y: -2, lean: -3, head: -8 };

  // Carried by the lean and the hop, never by the wing's own turn, nudge or mirror.
  assert.equal(resolveCharacterMovePropTransform(clap), resolveCharacterMovePartTransform({ y: -2, lean: -3 }, "wing"));
  assert.equal(resolveCharacterMovePropTransform({ wing: -30 }), resolveCharacterMovePartTransform({ wing: -30 }, "wing"));

  const css = resolveCharacterMovesCss();
  const propFrames = css.match(/@keyframes cast-move-chicken-dance-prop \{[^@]*/)?.[0] ?? "";

  assert.ok(propFrames.length > 0);
  assert.doesNotMatch(propFrames, /scale/);
  assert.match(css, /\.cast-move-chicken-dance \{[^}]*--cast-move-prop: cast-move-chicken-dance-prop;/);
  // A Move that never flips the wing hands the Prop the wing's own keyframes.
  assert.match(css, /\.cast-move-horns-pump \{[^}]*--cast-move-prop: cast-move-horns-pump-wing;/);
});

test("does play the Prop's own keyframes on its layer while a Move plays", () => {
  const html = renderToStaticMarkup(
    <Character appearance={{ ...drawn, outfit: { prop: { item: "flying-v-a" } } }} showpieces move="chicken-dance" />
  );
  const prop = html.indexOf('data-outfit-slot="prop"');
  const layer = html.lastIndexOf('<g data-character-part="wing"', prop);

  assert.match(html.slice(layer, prop), /var\(--cast-move-prop,none\)/);
  assert.match(html.slice(0, layer), /data-character-part="wing" class="[^"]*var\(--cast-move-wing,none\)/);
});

test("does turn a leaning part about the hips rather than its own pivot", () => {
  // The body's pivot (40,45) swung 10° about the hips (38,60) moves right and down.
  assert.equal(resolveCharacterMovePartTransform({ lean: 10 }, "body"), "translate(2.574px, 0.575px) rotate(10deg)");
  assert.equal(resolveCharacterMovePartTransform({ lean: 10 }, "legNear"), "translate(0px, 0px) rotate(0deg)");
});

test("does hand every part to the Move and drop the pose's stance while it plays", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} pose="peck" move="chicken-dance" />);

  assert.match(html, /data-character-move="chicken-dance" class="cast-move-chicken-dance"/);
  assert.doesNotMatch(html, /data-character-stance|data-character-jig/);

  for (const part of CHARACTER_PARTS) {
    assert.match(html, new RegExp(`data-character-part="${part}" class="[^"]*var\\(--cast-move-${part},none\\)`));
  }
});

test("does draw a bird with no Move exactly as its pose does", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} pose="dance" />);

  assert.doesNotMatch(html, /cast-move|data-character-move/);
});
