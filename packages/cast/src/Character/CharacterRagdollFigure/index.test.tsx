import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Character } from "../index.js";
import { CHARACTER_RAGDOLL_PARTS, CHARACTER_RAGDOLL_SEGMENTS, resolveCharacterRagdollRest } from "../ragdoll/index.js";
import { CHARACTER_SILHOUETTES } from "../../resolveTeamSilhouette/index.js";
import { CharacterRagdollFigure } from "./index.js";

const drawn = { body: "round", comb: "crest", tail: "fan", dance: "bounce" } as const;
const costume = { ...drawn, avatarSrc: "/a.png" } as const;

const ragdoll = (props: Partial<Parameters<typeof CharacterRagdollFigure>[0]> = {}): string =>
  renderToStaticMarkup(
    <svg>
      <CharacterRagdollFigure appearance={drawn} transforms={resolveCharacterRagdollRest()} {...props} />
    </svg>
  );

type Placement = { joint: string; rotation: number; netX: number; netY: number };

const NUMBER = "(-?[\\d.]+)";

// Where a ragdoll layer puts its drawing: its joint, its turn, and where the
// drawing's own origin lands once both translates are applied.
const ragdollPlacement = (html: string, layer: string): Placement => {
  const match = html.match(
    new RegExp(
      `data-character-ragdoll-part="${layer}" transform="translate\\(${NUMBER} ${NUMBER}\\) rotate\\(${NUMBER}\\)"><g transform="translate\\(${NUMBER} ${NUMBER}\\)">`
    )
  );
  assert.ok(match !== null, `no ${layer} layer drawn`);
  const [, x, y, rotation, innerX, innerY] = match.map(Number);

  return { joint: `${x} ${y}`, rotation, netX: x + innerX, netY: y + innerY };
};

// The same for a part of the posed hen.
const stillPlacement = (html: string, part: string): Placement => {
  const match = html.match(
    new RegExp(
      `<g transform="translate\\(${NUMBER} ${NUMBER}\\)"><g data-character-part="${part}"[^>]*><g transform="translate\\(${NUMBER} ${NUMBER}\\)">`
    )
  );
  assert.ok(match !== null, `no ${part} part drawn`);
  const [, x, y, innerX, innerY] = match.map(Number);

  return { joint: `${x} ${y}`, rotation: 0, netX: x + innerX, netY: y + innerY };
};

// Every shape the bird is painted with, in document order, halo ids normalised.
const shapesOf = (html: string): string[] =>
  (html.match(/<(path|circle|image|rect)[^>]*>/g) ?? []).map((tag) => tag.replace(/url\(#[^)]+\)/, "url(#halo)"));

const RAGDOLL_LAYER_TO_RIG_PART = {
  tail: "tail",
  legFar: "legFar",
  body: "body",
  legNear: "legNear",
  wingNear: "wing",
  head: "head"
} as const;

test("does place every part where still places it when given the rest transforms", () => {
  for (const appearance of [drawn, costume]) {
    for (const silhouette of [undefined, ...CHARACTER_SILHOUETTES]) {
      const still = renderToStaticMarkup(<Character appearance={appearance} silhouette={silhouette} apparel="medallion" />);
      const rest = ragdoll({ appearance, silhouette, apparel: "medallion" });

      for (const [layer, part] of Object.entries(RAGDOLL_LAYER_TO_RIG_PART)) {
        const posed = stillPlacement(still, part);
        const placed = ragdollPlacement(rest, layer);

        assert.equal(placed.rotation, 0, `${layer} is unturned`);
        assert.equal(placed.netX, posed.netX, `${layer} lands where still draws it`);
        assert.equal(placed.netY, posed.netY, `${layer} lands where still draws it`);

        if (layer !== "tail") {
          assert.equal(placed.joint, posed.joint, `${layer} turns about the rig's own pivot`);
        }
      }

      // The far wing aside, it is the same drawing in the same order.
      const ragdollShapes = shapesOf(rest).filter((tag) => !tag.includes('data-character-wing="far"'));
      assert.deepEqual(ragdollShapes, shapesOf(still).filter((tag) => !tag.startsWith("<svg")));
    }
  }
});

test("does hang the far wing on its own shoulder, drawn with the near wing's own path, when at rest", () => {
  const html = ragdoll();
  const { joint } = CHARACTER_RAGDOLL_SEGMENTS.wingFar;
  const far = ragdollPlacement(html, "wingFar");
  const nearWing = html.match(/<path [^>]*d="([^"]+)"[^>]*data-character-wing="true"/)?.[1];
  const farWing = html.match(/<path [^>]*d="([^"]+)"[^>]*data-character-wing="far"/)?.[1];

  assert.equal(far.joint, `${joint.x} ${joint.y}`);
  assert.ok(nearWing !== undefined && nearWing === farWing, "both wings are the one wing");
});

test("does draw the far wing behind the body and everything else in document order", () => {
  const html = ragdoll();
  const layers = [...html.matchAll(/data-character-ragdoll-part="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(layers, ["wingFar", "tail", "legFar", "body", "legNear", "wingNear", "head"]);
  assert.ok(html.indexOf('data-character-wing="far"') < html.indexOf('data-character-ragdoll-part="body"'));
});

test("does draw every ragdoll part exactly once when given transforms", () => {
  const html = ragdoll();

  for (const part of CHARACTER_RAGDOLL_PARTS) {
    const count = (html.match(new RegExp(`data-character-ragdoll-part="${part}"`, "g")) ?? []).length;
    assert.equal(count, 1, part);
  }
});

test("does turn and move each part about its joint by the sim's transform", () => {
  const transforms = resolveCharacterRagdollRest();
  transforms.head = { x: 10.5, y: -3, rotation: 42.25 };
  transforms.legNear = { x: 30, y: 60, rotation: -90 };
  const html = ragdoll({ transforms });

  assert.deepEqual(ragdollPlacement(html, "head"), { joint: "10.5 -3", rotation: 42.25, netX: 10.5 - 52, netY: -3 - 36 });
  assert.equal(ragdollPlacement(html, "legNear").rotation, -90);
  assert.equal(ragdollPlacement(html, "tail").joint, ragdollPlacement(html, "body").joint, "the tail rides on the body");
});

test("does put the beak's grab point on the point of the drawn beak", () => {
  const { tip } = CHARACTER_RAGDOLL_SEGMENTS.head;

  assert.match(ragdoll(), new RegExp(`class="fill-primary[^"]*" d="M [\\d.]+ [\\d.]+ L ${tip.x} ${tip.y} L`));
});

test("does wear the costume head, the halo and the apparel the posed hen wears", () => {
  const html = ragdoll({ appearance: costume, apparel: "medallion" });

  assert.match(html, /<image href="\/a\.png"[^>]*filter="url\(#[^"]+\)"/);
  assert.match(html, /data-character-apparel="medallion"/);
  assert.equal((html.match(/<circle/g) ?? []).length, 1, "the medallion alone: no drawn head behind the face");
});

test("does paint the bird in the given fill and otherwise inherit the surface's", () => {
  assert.match(ragdoll({ fillClassName: "text-teamB" }), /<g class="text-teamB" data-character-ragdoll="true"/);
  assert.match(ragdoll(), /<g data-character-ragdoll="true"/);
});

test("does loop nothing and pose nothing, so every frame is the sim's", () => {
  const html = ragdoll();

  assert.doesNotMatch(html, /animation:|transition:|data-character-pose|data-character-jig|data-character-stance/);
});
