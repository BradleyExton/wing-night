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
  for (const apparel of ["collar", "medallion"] as const) {
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
    CHARACTER_DANCES.map((dance) =>
      renderToStaticMarkup(<Character appearance={{ ...drawn, dance }} pose="dance" />)
    )
  );

  assert.equal(steps.size, CHARACTER_DANCES.length);
});
