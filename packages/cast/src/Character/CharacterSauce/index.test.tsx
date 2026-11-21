import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Character } from "../index.js";
import { CHARACTER_HEAD_TURNS, CHARACTER_POSES, CHARACTER_STANCE_TURNS, DRAWN_BEAK_TIP } from "../geometry/index.js";
import { resolveCharacterSauceOrigin } from "./index.js";
import * as styles from "./styles.js";

const drawn = { body: "round", comb: "none", tail: "fan", dance: "bounce" } as const;
const costume = { ...drawn, avatarSrc: "http://127.0.0.1:3000/content-assets/avatars/brad.png" } as const;

// The eight ways the stick aims, as the figure takes them: degrees clockwise from straight ahead.
const AIMS = [0, -45, -90, -135, 180, 135, 90, 45] as const;

const sauceOf = (html: string): { x: number; y: number; turn: number; tone: string } | null => {
  const match = html.match(/<g data-character-sauce="(\w+)" class="[^"]*" transform="translate\(([-\d.e]+) ([-\d.e]+)\) rotate\(([-\d.e]+)\)">/);

  return match === null
    ? null
    : { tone: match[1] ?? "", x: Number(match[2]), y: Number(match[3]), turn: Number(match[4]) };
};

test("does draw no sauce unless the bird is spraying", () => {
  assert.doesNotMatch(renderToStaticMarkup(<Character appearance={drawn} pose="walk" />), /data-character-sauce/);
});

test("does point the stream where it is aimed, whatever turn the pose has put on the head", () => {
  for (const pose of CHARACTER_POSES) {
    for (const angle of AIMS) {
      const sauce = sauceOf(renderToStaticMarkup(<Character appearance={drawn} pose={pose} spray={{ angle }} />));
      const turned = (sauce?.turn ?? NaN) + (CHARACTER_HEAD_TURNS[pose] ?? 0) + (CHARACTER_STANCE_TURNS[pose] ?? 0);

      assert.equal(turned, angle, `${pose}, aimed ${angle}`);
    }
  }
});

test("does start a drawn bird's stream at the tip of its beak", () => {
  const sauce = sauceOf(renderToStaticMarkup(<Character appearance={drawn} pose="still" spray={{ angle: -45 }} />));

  assert.deepEqual({ x: sauce?.x, y: sauce?.y }, DRAWN_BEAK_TIP);
});

test("does start a costumed bird's stream on the rim of its head on the side it is aimed, never across the face", () => {
  const centre = resolveCharacterSauceOrigin(true, 0);
  const opposite = resolveCharacterSauceOrigin(true, 180);
  const middle = { x: (centre.x + opposite.x) / 2, y: (centre.y + opposite.y) / 2 };

  for (const angle of AIMS) {
    const sauce = sauceOf(renderToStaticMarkup(<Character appearance={costume} pose="still" spray={{ angle }} />));
    const radians = (angle * Math.PI) / 180;
    const along = ((sauce?.x ?? 0) - middle.x) * Math.cos(radians) + ((sauce?.y ?? 0) - middle.y) * Math.sin(radians);

    assert.ok(along > 15, `aimed ${angle}, it starts out at the rim (${along.toFixed(1)} from the middle)`);
  }
});

test("does draw the stream under the head, so the beak or the face covers where it starts", () => {
  for (const appearance of [drawn, costume]) {
    const html = renderToStaticMarkup(<Character appearance={appearance} pose="still" spray={{ angle: 0 }} />);
    const head = html.slice(html.indexOf('data-character-part="head"'));
    const face = appearance === costume ? head.indexOf("<image") : head.indexOf("<circle");

    assert.ok(head.indexOf("data-character-sauce") > 0, "the stream rides the head");
    assert.ok(head.indexOf("data-character-sauce") < face, "and is drawn before it");
  }
});

test("does colour a hot bottle's stream hotter than mild", () => {
  const mild = renderToStaticMarkup(<Character appearance={drawn} spray={{ angle: 0 }} />);
  const hot = renderToStaticMarkup(<Character appearance={drawn} spray={{ angle: 0, tone: "hot" }} />);

  assert.equal(sauceOf(mild)?.tone, "mild");
  assert.ok(mild.includes(`class="${styles.mild}"`));
  assert.equal(sauceOf(hot)?.tone, "hot");
  assert.ok(hot.includes(`class="${styles.hot}"`));
});
