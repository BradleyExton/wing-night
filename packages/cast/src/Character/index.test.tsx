import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Character, CharacterWing } from "./index.js";
import { CHARACTER_PARTS, CHARACTER_PIVOTS, CHARACTER_POSES } from "./geometry/index.js";
import { CHARACTER_DANCES } from "../resolvePlayerAppearance/index.js";
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

test("does perch the comb on the hair when the head is a costume", () => {
  const drawnHtml = renderToStaticMarkup(<Character appearance={{ ...drawn, comb: "crest" }} />);
  const costumeHtml = renderToStaticMarkup(<Character appearance={{ ...costume, comb: "crest" }} />);

  assert.match(drawnHtml, /transform="translate\(2 -1\)"/);
  assert.match(costumeHtml, /transform="translate\(2 -21\)"/);
});

test("does poke the beak out at mouth height when the head is a costume", () => {
  const drawnHtml = renderToStaticMarkup(<Character appearance={drawn} />);
  const costumeHtml = renderToStaticMarkup(<Character appearance={costume} />);

  assert.match(drawnHtml, /d="M 69 16 L 81 20 L 69 21 Z"/);
  assert.match(costumeHtml, /d="M 74 10 L 86 14 L 74 15 Z"/);
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

test("does lift the apparel onto the costume head when the bird has an avatar", () => {
  const onDrawn = renderToStaticMarkup(<Character appearance={drawn} apparel="hat" />);
  const onCostume = renderToStaticMarkup(<Character appearance={costume} apparel="hat" />);

  assert.match(onDrawn, /data-character-apparel="hat"[^]*?transform="translate\(2 -1\)"/);
  assert.match(onCostume, /data-character-apparel="hat"[^]*?transform="translate\(2 -21\)"/);
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

  assert.match(html, /data-character-part="legNear" class="[^"]*cast-step_0\.5s_ease-in-out_infinite/);
  assert.match(html, /data-character-part="legFar" class="[^"]*cast-step_0\.5s_ease-in-out_-0\.25s_infinite/);
});

test("does shade the belly in the outline ink at a fifth and nothing else", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} />);

  assert.equal((html.match(/fill-bg\/20/g) ?? []).length, 1);
});

test("does dance the player's own move, answering the beat on a group ancestor, when asked to dance", () => {
  for (const dance of CHARACTER_DANCES) {
    const html = renderToStaticMarkup(<Character appearance={{ ...drawn, dance }} pose="dance" />);

    assert.match(html, /data-character-pose="dance"/);
    assert.doesNotMatch(html, /animation:/, `${dance} is on the beat, not a clock`);

    for (const part of CHARACTER_PARTS) {
      const className = figureStyles.dances[dance][part];
      const partTag = html.match(new RegExp(`<g data-character-part="${part}"[^>]*>`))?.[0] ?? "";

      if (className === undefined) {
        assert.doesNotMatch(partTag, /class=/, `${dance}: ${part} holds still`);
      } else {
        assert.ok(partTag.includes(className), `${dance}: ${part} carries ${className}`);
        assert.match(className, /transition-transform/);
        assert.match(className, /group-data-\[beat=1\]\/beat:/);
      }
    }
  }
});

test("does step differently from bird to bird so a dancing team is not one bird four times", () => {
  const steps = new Set(
    CHARACTER_DANCES.map((dance) =>
      renderToStaticMarkup(<Character appearance={{ ...drawn, dance }} pose="dance" />)
    )
  );

  assert.equal(steps.size, CHARACTER_DANCES.length);
});
