import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Character } from "./index";

test("does draw the two-eye face when the appearance has no avatar", () => {
  const html = renderToStaticMarkup(
    <Character appearance={{ body: "round", comb: "none", tail: "fan" }} />
  );

  assert.match(html, /data-character-body="round"/);
  assert.match(html, /data-character-comb="none"/);
  assert.match(html, /data-character-tail="fan"/);
  assert.equal((html.match(/<circle/g) ?? []).length, 5);
  assert.doesNotMatch(html, /<image/);
});

test("does draw the beak and legs in primary whatever the fill", () => {
  const html = renderToStaticMarkup(
    <Character appearance={{ body: "round", comb: "none", tail: "fan" }} fillClassName="text-teamA" />
  );

  assert.equal((html.match(/fill-primary|stroke-primary/g) ?? []).length, 2);
});

test("does clip the avatar into the head when the appearance has one", () => {
  const html = renderToStaticMarkup(
    <Character
      appearance={{
        body: "tall",
        comb: "crest",
        tail: "plume",
        avatarSrc: "/local-assets/avatars/brad.jpg"
      }}
    />
  );

  assert.match(html, /<clipPath id="[^"]+"/);
  assert.match(html, /<image href="\/local-assets\/avatars\/brad\.jpg"/);
  assert.match(html, /clip-path="url\(#[^"]+\)"/);
});

test("does enlarge the head when the appearance carries an avatar", () => {
  const drawn = renderToStaticMarkup(<Character appearance={{ body: "round", comb: "none", tail: "fan" }} />);
  const bobble = renderToStaticMarkup(
    <Character appearance={{ body: "round", comb: "none", tail: "fan", avatarSrc: "/a.jpg" }} />
  );

  assert.match(drawn, /<circle class="[^"]*" cx="56" cy="22" r="13">/);
  assert.match(bobble, /<circle class="[^"]*" cx="54" cy="24" r="19">/);
});

test("does give each character its own clip id when several render together", () => {
  const html = renderToStaticMarkup(
    <div>
      <Character appearance={{ body: "round", comb: "none", tail: "fan", avatarSrc: "/a.jpg" }} />
      <Character appearance={{ body: "round", comb: "none", tail: "fan", avatarSrc: "/b.jpg" }} />
    </div>
  );
  const clipIds = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((match) => match[1]);

  assert.equal(clipIds.length, 2);
  assert.notEqual(clipIds[0], clipIds[1]);
});

test("does use the given fill class instead of the muted default when one is passed", () => {
  const html = renderToStaticMarkup(
    <Character appearance={{ body: "wide", comb: "mohawk", tail: "plume" }} fillClassName="text-teamB" />
  );

  assert.match(html, /text-teamB/);
  assert.doesNotMatch(html, /text-mutedWarm/);
});
