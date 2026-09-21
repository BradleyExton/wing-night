import assert from "node:assert/strict";
import test from "node:test";

import { resolveRevealDurationMs } from "./index.js";

// The point of the helper: a duration survives the trip between two clocks,
// which is what a surface needs, and the absolute stamps do not.
test("does read the window as the span between the server's own two stamps", () => {
  assert.equal(
    resolveRevealDurationMs({ revealedAtMs: 1_700_000_000_000, expiresAtMs: 1_700_000_002_000 }),
    2000
  );
});

test("does read the same window from stamps taken on a wildly offset clock", () => {
  const skewMs = 9_000_000;

  assert.equal(
    resolveRevealDurationMs({
      revealedAtMs: 1_700_000_000_000 + skewMs,
      expiresAtMs: 1_700_000_002_000 + skewMs
    }),
    2000
  );
});

// Defensive: content or a fixture could hand back an expiry at or before the
// reveal, and a negative window would read as "already closed forever".
test("does floor an inverted window at zero", () => {
  assert.equal(
    resolveRevealDurationMs({ revealedAtMs: 1_700_000_002_000, expiresAtMs: 1_700_000_000_000 }),
    0
  );
});
