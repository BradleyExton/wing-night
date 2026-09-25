import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MINIGAME_TYPES, resolveMinigameDefinition } from "@wingnight/shared";

import { resolveClientRoute, resolveDevLabName } from "../../utils/resolveClientRoute";
import { devRouteIndexCopy } from "./copy";
import { DevRouteIndex } from "./index";

// "Who's That Song" reaches the markup as Who&#x27;s That Song.
const escapeApostrophes = (text: string): string => {
  return text.replaceAll("'", "&#x27;");
};

// The list is derived from MINIGAME_TYPES, so this asserts against that list
// rather than a hardcoded six — a seventh minigame must appear without an edit
// to the component, and this test proves it does.
test("links every registered minigame sandbox", () => {
  const html = renderToStaticMarkup(<DevRouteIndex />);

  for (const minigameType of MINIGAME_TYPES) {
    const { slug, displayName } = resolveMinigameDefinition(minigameType);

    assert.ok(
      html.includes(`href="/dev/minigame/${slug}"`),
      `missing sandbox link for ${minigameType}`
    );
    assert.ok(
      html.includes(escapeApostrophes(displayName)),
      `missing display name for ${minigameType}`
    );
  }
});

test("renders the hyphenated slugs the URL actually needs", () => {
  const html = renderToStaticMarkup(<DevRouteIndex />);

  assert.match(html, /href="\/dev\/minigame\/song-guess"/);
  assert.match(html, /href="\/dev\/minigame\/emoji-charades"/);
  // JOUST is the type; Slingshlong is the name on the box. Both need to be on
  // the card or the launcher does not save anyone the lookup.
  assert.match(html, /href="\/dev\/minigame\/joust"/);
  assert.match(html, /Slingshlong/);
});

// The lab names are hand-listed in copy.ts because there is no registry to
// derive them from. This pins them to the route resolver so a renamed or
// deleted lab fails here instead of 404ing at the click.
test("links dev labs at names the lab route still resolves", () => {
  const html = renderToStaticMarkup(<DevRouteIndex />);

  for (const lab of devRouteIndexCopy.labs) {
    assert.equal(resolveClientRoute(lab.href), "DEV_LAB");
    assert.ok(resolveDevLabName(lab.href) !== null, `unresolvable lab href ${lab.href}`);
    assert.ok(html.includes(`href="${lab.href}"`), `missing lab link ${lab.href}`);
  }
});

test("renders page chrome and the way back to the screen picker", () => {
  const html = renderToStaticMarkup(<DevRouteIndex />);

  assert.match(html, /Minigame Testing/);
  assert.match(html, /Minigame sandboxes:/);
  assert.match(html, /Feel labs:/);
  assert.match(html, /href="\/"/);
  assert.match(html, /src="\/favicon\.svg"/);
});
