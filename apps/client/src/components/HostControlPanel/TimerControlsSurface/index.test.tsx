import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase } from "@wingnight/shared";

import { TimerControlsSurface } from "./index";

test("renders paused timer controls", () => {
  const html = renderToStaticMarkup(
    <TimerControlsSurface
      timer={{
        phase: Phase.EATING,
        startedAt: 0,
        endsAt: 180_000,
        durationMs: 180_000,
        isPaused: true,
        remainingMs: 90_000
      }}
      onPauseTimer={(): void => {
        return;
      }}
      onResumeTimer={(): void => {
        return;
      }}
      onExtendTimer={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Timer Controls/);
  assert.match(html, /Paused/);
  assert.match(html, /01:30/);
  assert.match(html, /Pause Timer/);
  assert.match(html, /Resume Timer/);
  assert.match(html, /\+15s/);
  assert.match(html, /\+30s/);
});

test("renders nothing for non-eating timers", () => {
  const html = renderToStaticMarkup(
    <TimerControlsSurface
      timer={{
        phase: Phase.MINIGAME_PLAY,
        startedAt: 0,
        endsAt: 180_000,
        durationMs: 180_000,
        isPaused: false,
        remainingMs: 90_000
      }}
      onPauseTimer={(): void => {
        return;
      }}
      onResumeTimer={(): void => {
        return;
      }}
      onExtendTimer={(): void => {
        return;
      }}
    />
  );

  assert.equal(html, "");
});
