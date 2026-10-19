import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { useIsRevealVisible } from "./index.js";

type ProbeReveal = { promptId: string; revealedAtMs: number; expiresAtMs: number };

const resolveRevealKey = (reveal: ProbeReveal | null): string | null => {
  return reveal === null ? null : `${reveal.promptId}:${reveal.revealedAtMs}`;
};

const Probe = ({ reveal }: { reveal: ProbeReveal | null }): JSX.Element => {
  return <output>{useIsRevealVisible(reveal, resolveRevealKey) ? "open" : "shut"}</output>;
};

test("does show a reveal on the render it arrives in, whatever clock its stamps are on", () => {
  // Stamps from a server clock hours away from this one: only their difference counts.
  const reveal = { promptId: "p1", revealedAtMs: 9_000_000_000, expiresAtMs: 9_000_002_000 };

  assert.match(renderToStaticMarkup(<Probe reveal={reveal} />), /open/);
});

test("does keep the reveal shut when there is none", () => {
  assert.match(renderToStaticMarkup(<Probe reveal={null} />), /shut/);
});

test("does keep the reveal shut when its window has no length", () => {
  const reveal = { promptId: "p1", revealedAtMs: 500, expiresAtMs: 500 };

  assert.match(renderToStaticMarkup(<Probe reveal={reveal} />), /shut/);
});
