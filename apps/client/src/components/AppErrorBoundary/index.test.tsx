import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AppErrorBoundary } from "./index";
import { appErrorBoundaryCopy } from "./copy";

// React 18 does not run error boundaries during server rendering — a throw in
// renderToStaticMarkup propagates out instead of being caught — so the
// browser's catch is proved end to end in tests/e2e/chunk-failure.spec.ts,
// where a real route chunk is made to 404. What is checked here is the
// machinery that decides what the room sees once the catch has happened.

test("does pass the route through untouched when nothing has thrown", () => {
  const html = renderToStaticMarkup(
    <AppErrorBoundary surface="DISPLAY">
      <p>{appErrorBoundaryCopy.DISPLAY.title}</p>
    </AppErrorBoundary>
  );

  // No sheet, no notice — the boundary is invisible until it is needed.
  assert.equal(html, `<p>${appErrorBoundaryCopy.DISPLAY.title}</p>`);
});

test("does switch to the caught state when a child throws", () => {
  // The static method React calls on the render that threw. Without it the
  // boundary never leaves its pass-through branch and the root unmounts.
  const derivedState = AppErrorBoundary.getDerivedStateFromError();

  assert.deepEqual(derivedState, { hasCaughtError: true });
});
