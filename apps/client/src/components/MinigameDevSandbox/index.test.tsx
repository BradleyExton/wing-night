import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

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
