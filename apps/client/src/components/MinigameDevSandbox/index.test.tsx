import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MINIGAME_TYPES, resolveMinigameDefinition } from "@wingnight/shared";

import { MinigameDevSandbox } from "./index";

test("renders the trivia sandbox from the live runtime plugin", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="TRIVIA" />);

  assert.match(html, /Minigame Dev Sandbox/);
  assert.match(html, /Host Preview/);
  assert.match(html, /Display Preview/);
  assert.match(html, /Reset/);
  // The first sample prompt comes from the runtime plugin, not static views.
  assert.match(
    html,
    /What country is widely credited as the origin of hot sauce\?/
  );
  assert.match(html, /Correct/);
});

test("renders the geo sandbox without leaking answer coordinates", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="GEO" />);

  assert.match(html, /Eiffel Tower/);
  assert.match(html, /Stamp the Guess/);
  assert.doesNotMatch(html, /48\.85837/);
  assert.doesNotMatch(html, /answerLat/);
});

test("renders the drawing sandbox without leaking the prompt to the display", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="DRAWING" />);

  assert.match(html, /Minigame Dev Sandbox/);
  assert.match(html, /Sketch Booth/);
  assert.match(html, /Tonight&#x27;s Prompt/);
  assert.match(html, /Live Sketch/);
  assert.match(html, /Correct/);

  // The shuffled current prompt renders exactly once — in the host banner.
  // A second occurrence would mean the display surface is echoing it.
  const drawingDevPromptTexts = [
    "Pizza slice",
    "Campfire",
    "Skateboard",
    "Octopus",
    "Rocket ship",
    "Walking the dog"
  ];
  const promptOccurrences = drawingDevPromptTexts.reduce(
    (total, promptText) => total + html.split(promptText).length - 1,
    0
  );
  assert.equal(promptOccurrences, 1);
});

// The minigame used to be a disabled input you changed by editing the URL. The
// switcher is only useful if it offers every sandbox and marks the live one.
test("offers every registered minigame in the switcher", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="JOUST" />);

  for (const minigameType of MINIGAME_TYPES) {
    const { slug } = resolveMinigameDefinition(minigameType);

    assert.ok(
      html.includes(`value="${slug}"`),
      `missing switcher option for ${minigameType}`
    );
  }

  assert.match(html, /<option value="joust" selected="">Slingshlong<\/option>/);
  assert.match(html, /href="\/dev"/);
});

// The host preview stands in for the tablet, so it carries the shell's host
// controls for the phase and says which screen it is sized as; a bare surface
// with no shell around it is how the previews drifted to a different size per
// game. Play opens on the collapsed corner dock, not the full-bleed CTA bar —
// that is the canvas a minigame actually gets while the tablet is passed round.
test("frames the host preview as the tablet shell with the phase's host controls", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="TRIVIA" />);

  assert.match(html, /Tablet · 1024 × 768 landscape/);
  assert.match(html, /TV · 1920 × 1080/);
  assert.match(html, /aria-label="Open host controls"/);
  assert.doesNotMatch(html, /End Team Turn/);
});
