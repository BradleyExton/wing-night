import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { MinigameDevSandbox } from "./index";

// The shell is what the route renders synchronously. The stage — and with it
// the dev registry's runtime plugins — arrives on a lazy chunk, so a static
// render stops at the Suspense fallback. That is the proof the split holds:
// nothing under the fallback is in the party bundle.
test("renders the sandbox chrome while the stage chunk is still loading", () => {
  const html = renderToStaticMarkup(<MinigameDevSandbox minigameType="TRIVIA" />);

  assert.match(html, /Minigame Dev Sandbox/);
  assert.match(html, /href="\/dev"/);
  assert.match(html, /Loading the runtime/);
  assert.doesNotMatch(html, /Host Preview/);
});
