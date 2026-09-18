import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Character } from "./index";

const drawn = { body: "round", comb: "none", tail: "fan" } as const;
const costume = { ...drawn, avatarSrc: "/local-assets/avatars/brad.png" } as const;

test("does draw the two-eye face on a circle head when the appearance has no avatar", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} />);

  assert.match(html, /data-character-body="round"/);
  assert.match(html, /data-character-comb="none"/);
  assert.match(html, /data-character-tail="fan"/);
  assert.equal((html.match(/<circle/g) ?? []).length, 5);
  assert.doesNotMatch(html, /<image/);
  assert.doesNotMatch(html, /<filter/);
});

test("does draw the beak, wattle and legs in primary whatever the fill", () => {
  const html = renderToStaticMarkup(<Character appearance={drawn} fillClassName="text-teamA" />);

  assert.equal((html.match(/fill-primary|stroke-primary/g) ?? []).length, 3);
});

test("does wear the avatar as its own silhouette in place of the drawn head when the appearance has one", () => {
  const html = renderToStaticMarkup(<Character appearance={costume} />);

  assert.match(html, /<image href="\/local-assets\/avatars\/brad\.png"[^>]*filter="url\(#[^"]+\)"/);
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

  assert.match(drawnHtml, /d="M 69 15 L 80 20 L 69 25 Z"/);
  assert.match(costumeHtml, /d="M 74 9 L 85 14 L 74 19 Z"/);
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
    <Character appearance={{ body: "wide", comb: "mohawk", tail: "plume" }} fillClassName="text-teamB" />
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
