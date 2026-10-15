import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveGameStartCountdownSeconds } from "../resolveGameStartCountdownSeconds";
import { resolveCountdownReadingNow, useGameStartCountdownSeconds } from "./index";

const Probe = ({ endsAt }: { endsAt: number | null }): JSX.Element => {
  return <span data-seconds={String(useGameStartCountdownSeconds(endsAt))} />;
};

test("does read the live clock when the stored reading predates the countdown", () => {
  const mountedAtMs = 1_000;
  const tappedAtMs = mountedAtMs + 2_400;
  const endsAt = tappedAtMs + 3_000;
  const mountReading = { endsAt: null, nowTimestampMs: mountedAtMs };

  const nowTimestampMs = resolveCountdownReadingNow(mountReading, endsAt, tappedAtMs);

  assert.equal(resolveGameStartCountdownSeconds(endsAt, nowTimestampMs), 3);
});

test("does keep the polled reading when it was taken for the same countdown", () => {
  const endsAt = 10_000;
  const reading = { endsAt, nowTimestampMs: 7_500 };

  assert.equal(resolveCountdownReadingNow(reading, endsAt, 9_000), 7_500);
});

test("does read a fresh count-in as its full length on the first render", () => {
  assert.match(renderToStaticMarkup(<Probe endsAt={Date.now() + 3_000} />), /data-seconds="3"/);
  assert.match(renderToStaticMarkup(<Probe endsAt={null} />), /data-seconds="null"/);
});
