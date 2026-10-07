import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Character } from "../index.js";

// The still hen, exactly as it was drawn before the ragdoll figure came to
// share its head (`CharacterHead`). The ragdoll's rest is pinned to this
// drawing, so a change here is a change to both birds: when the hen is redrawn
// on purpose, re-snapshot these, and the ragdoll tests say whether the two
// still agree. The halo id is React's and not the drawing's, so it is
// normalised out.
const STILL_DRAWN_HEAD_WITH_COMB_AND_HAT = [
  `<svg class="block h-full w-auto overflow-visible text-teamA" viewBox="0 0 80 72">`,
  `<g data-character-body="round" data-character-comb="crest" data-character-tail="fan" data-character-pose="still">`,
  `<g transform="translate(20 42)">`,
  `<g data-character-part="tail">`,
  `<g transform="translate(-20 -42)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:round]" d="M 22 46 C 10 47 2 41 0 30 C 6 39 14 42 26 41 Z M 22 41 C 11 40 3 33 2 20 C 9 31 15 36 25 36 Z M 24 36 C 14 32 8 24 11 10 C 14 25 19 30 28 31 Z">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(44 57)">`,
  `<g data-character-part="legFar">`,
  `<g transform="translate(-44 -57)">`,
  `<g class="opacity-70">`,
  `<path class="fill-none stroke-primary [stroke-width:3.5] [stroke-linecap:round] [stroke-linejoin:round]" d="M 44 57 L 43 68 M 43 68 L 37 70.5 M 43 68 L 44 71 M 43 68 L 50 70.5">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(40 45)">`,
  `<g data-character-part="body">`,
  `<g transform="translate(-40 -45)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:round]" d="M 16 42 C 16 28 32 22 50 27 C 64 31 67 44 61 55 C 53 65 30 66 21 58 C 16 54 16 48 16 42 Z">`,
  `</path>`,
  `<path class="fill-bg/20" d="M 22 56 C 30 64 52 64 60 54 C 56 66 30 68 22 56 Z">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(32 57)">`,
  `<g data-character-part="legNear">`,
  `<g transform="translate(-32 -57)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:round]" d="M 27 53 C 26 60 31 63 35 59 C 36 55 32 51 27 53 Z">`,
  `</path>`,
  `<path class="fill-none stroke-primary [stroke-width:3.5] [stroke-linecap:round] [stroke-linejoin:round]" d="M 32 57 L 31 68 M 31 68 L 25 70.5 M 31 68 L 32 71 M 31 68 L 38 70.5">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(47 35)">`,
  `<g data-character-part="wing">`,
  `<g transform="translate(-47 -35)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:round]" d="M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51 C 49 46 51 40 47 35 Z" data-character-wing="true">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(52 36)">`,
  `<g data-character-part="head">`,
  `<g transform="translate(-52 -36)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:round]" d="M 45 33 C 47 24 52 17 60 15 L 68 25 C 63 28 60 34 60 40 Z">`,
  `</path>`,
  `<g data-character-head="true">`,
  `<g>`,
  `<circle class="fill-current stroke-bg stroke-2 [stroke-linejoin:round]" cx="58" cy="20" r="12">`,
  `</circle>`,
  `<g>`,
  `<path class="fill-primary stroke-bg stroke-2 [stroke-linejoin:round]" d="M 69 16 L 81 20 L 69 21 Z">`,
  `</path>`,
  `<path class="fill-primary stroke-bg stroke-2 [stroke-linejoin:round]" d="M 69 21 L 79 21 L 69 25 Z">`,
  `</path>`,
  `<path class="fill-primary stroke-bg stroke-2 [stroke-linejoin:round]" d="M 66 25 C 71 25 71 33 66 32 Z">`,
  `</path>`,
  `</g>`,
  `<circle class="fill-text" cx="54" cy="18" r="3">`,
  `</circle>`,
  `<circle class="fill-text" cx="62" cy="18" r="3">`,
  `</circle>`,
  `<circle class="fill-bg" cx="55" cy="18" r="1.4">`,
  `</circle>`,
  `<circle class="fill-bg" cx="63" cy="18" r="1.4">`,
  `</circle>`,
  `</g>`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:round]" transform="translate(2 -1)" d="M 47 13 C 46 5 52 3 54 9 C 55 2 61 2 62 8 C 63 4 68 5 66 13 Z">`,
  `</path>`,
  `<g data-character-apparel="hat">`,
  `<path class="fill-text stroke-bg stroke-2 [stroke-linejoin:round]" transform="translate(2 -1)" d="M 38 12 Q 56 18 74 12 Q 70 9 66 9 L 64 1 Q 56 -2 48 1 L 46 9 Q 42 9 38 12 Z">`,
  `</path>`,
  `<rect class="fill-current" x="49" y="6" width="18" height="3">`,
  `</rect>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</svg>`
].join("");

const STILL_SPIKY_COSTUME_WITH_MEDALLION = [
  `<svg class="block h-full w-auto overflow-visible text-teamA" viewBox="0 0 80 72">`,
  `<g data-character-body="round" data-character-comb="crest" data-character-tail="fan" data-character-pose="still" data-character-silhouette="spiky">`,
  `<g transform="translate(20 42)">`,
  `<g data-character-part="tail">`,
  `<g transform="translate(-20 -42)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:miter]" d="M 30 48 L 2 46 L 28 40 Z M 28 42 L 0 26 L 29 33 Z M 29 34 L 7 9 L 31 27 Z">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(44 57)">`,
  `<g data-character-part="legFar">`,
  `<g transform="translate(-44 -57)">`,
  `<g class="opacity-70">`,
  `<path class="fill-none stroke-primary [stroke-width:3.5] [stroke-linecap:round] [stroke-linejoin:round]" d="M 44 57 L 43 68 M 43 68 L 37 70.5 M 43 68 L 44 71 M 43 68 L 50 70.5">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(40 45)">`,
  `<g data-character-part="body">`,
  `<g transform="translate(-40 -45)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:miter]" d="M 18 47 C 17 37 23 31 29 29 L 32 17 L 36 28 L 40 18 L 44 29 C 57 31 66 40 62 51 C 55 61 32 62 25 57 C 20 54 18 51 18 47 Z">`,
  `</path>`,
  `<path class="fill-bg/20" d="M 28 54 C 36 60 51 59 58 51 C 53 60 31 61 28 54 Z">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(32 57)">`,
  `<g data-character-part="legNear">`,
  `<g transform="translate(-32 -57)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:miter]" d="M 27 53 C 26 60 31 63 35 59 C 36 55 32 51 27 53 Z">`,
  `</path>`,
  `<path class="fill-none stroke-primary [stroke-width:3.5] [stroke-linecap:round] [stroke-linejoin:round]" d="M 32 57 L 31 68 M 31 68 L 25 70.5 M 31 68 L 32 71 M 31 68 L 38 70.5">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(47 35)">`,
  `<g data-character-part="wing">`,
  `<g transform="translate(-47 -35)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:miter]" d="M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 L 27 52 L 31 55 L 34 52 L 38 54 L 41 51 L 45 51 C 49 46 51 40 47 35 Z" data-character-wing="true">`,
  `</path>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `<g transform="translate(52 36)">`,
  `<g data-character-part="head">`,
  `<g transform="translate(-52 -36)">`,
  `<path class="fill-current stroke-bg stroke-2 [stroke-linejoin:miter]" d="M 45 33 C 47 24 52 17 60 15 L 68 25 C 63 28 60 34 60 40 Z">`,
  `</path>`,
  `<g data-character-head="true">`,
  `<g>`,
  `<filter id=":R0:" x="-30%" y="-30%" width="160%" height="160%" primitiveUnits="userSpaceOnUse">`,
  `<feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="halo">`,
  `</feMorphology>`,
  `<feFlood class="[flood-color:theme(colors.bg)]" result="ink">`,
  `</feFlood>`,
  `<feComposite in="ink" in2="halo" operator="in" result="outline">`,
  `</feComposite>`,
  `<feMerge>`,
  `<feMergeNode in="outline">`,
  `</feMergeNode>`,
  `<feMergeNode in="SourceGraphic">`,
  `</feMergeNode>`,
  `</feMerge>`,
  `</filter>`,
  `<image href="/a.png" x="36" y="-12" width="44" height="44" preserveAspectRatio="xMidYMax meet" filter="url(#:R0:)">`,
  `</image>`,
  `</g>`,
  `<g data-character-apparel="medallion">`,
  `<path class="fill-none stroke-text [stroke-width:2] [stroke-linecap:round]" d="M 49 36 Q 58 49 67 36">`,
  `</path>`,
  `<circle class="fill-text stroke-bg stroke-2 [stroke-linejoin:round]" cx="58" cy="46" r="4.6">`,
  `</circle>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</g>`,
  `</svg>`
].join("");

const withoutHaloIds = (html: string): string => {
  const ids = [...html.matchAll(/<filter id="([^"]+)"/g)].map((match) => match[1]);

  return ids.reduce((normalised, id, index) => normalised.split(id).join(`halo-${index}`), html);
};

const drawnAppearance = { body: "round", comb: "crest", tail: "fan", dance: "bounce" } as const;

test("does draw the still hen byte for byte as it always has when the head has no costume", () => {
  const html = renderToStaticMarkup(
    <Character appearance={drawnAppearance} apparel="hat" fillClassName="text-teamA" />
  );

  assert.equal(withoutHaloIds(html), withoutHaloIds(STILL_DRAWN_HEAD_WITH_COMB_AND_HAT));
});

test("does draw the still hen byte for byte as it always has when it wears a costume head and a genre", () => {
  const html = renderToStaticMarkup(
    <Character
      appearance={{ ...drawnAppearance, avatarSrc: "/a.png" }}
      apparel="medallion"
      silhouette="spiky"
      fillClassName="text-teamA"
    />
  );

  assert.equal(withoutHaloIds(html), withoutHaloIds(STILL_SPIKY_COSTUME_WITH_MEDALLION));
});
