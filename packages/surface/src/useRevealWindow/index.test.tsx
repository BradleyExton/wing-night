import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { useRevealWindow } from "./index.js";

const Probe = ({
  revealKey,
  durationMs
}: {
  revealKey: string | null;
  durationMs: number;
}): JSX.Element => {
  return <output>{useRevealWindow(revealKey, durationMs) ? "open" : "shut"}</output>;
};

test("does open the window on the very render the reveal arrives in", () => {
  // A static render runs no effects, so this is the first render exactly: a
  // window that only opened from an effect would read "shut" here.
  assert.match(renderToStaticMarkup(<Probe revealKey="p1:100" durationMs={2000} />), /open/);
});

test("does keep the window shut when there is no reveal", () => {
  assert.match(renderToStaticMarkup(<Probe revealKey={null} durationMs={2000} />), /shut/);
});

test("does keep the window shut when the reveal has no duration", () => {
  assert.match(renderToStaticMarkup(<Probe revealKey="p1:100" durationMs={0} />), /shut/);
});
