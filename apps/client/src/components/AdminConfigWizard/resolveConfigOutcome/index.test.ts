import assert from "node:assert/strict";
import test from "node:test";

import {
  CONFIG_ACTIONS,
  CONFIG_ERROR_CODES,
  type ConfigContentSnapshot
} from "@wingnight/shared";

import { resolveConfigOutcome } from "./index";

const CONTENT = {
  gameConfig: {
    name: "House Party Pack",
    rounds: [],
    minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
    }
  },
  players: [],
  teams: [],
  triviaPrompts: [],
  drawingPrompts: [],
  geoPromptCount: 0
} satisfies ConfigContentSnapshot;

test("carries the snapshot through when a read succeeds", () => {
  const outcome = resolveConfigOutcome({
    action: CONFIG_ACTIONS.READ,
    ok: true,
    content: CONTENT
  });

  assert.equal(outcome.content?.gameConfig.name, "House Party Pack");
  assert.equal(outcome.errorMessage, null);
  assert.deepEqual(outcome.issues, []);
});

// A read is not an apply, so it must not fire the applied confirmation.
test("does not report an apply when the reply is a successful read", () => {
  const outcome = resolveConfigOutcome({
    action: CONFIG_ACTIONS.READ,
    ok: true,
    content: CONTENT
  });

  assert.equal(outcome.didApply, false);
});

test("reports an apply when the reply is a successful apply", () => {
  const outcome = resolveConfigOutcome({
    action: CONFIG_ACTIONS.APPLY,
    ok: true,
    content: CONTENT
  });

  assert.equal(outcome.didApply, true);
  assert.equal(outcome.content?.gameConfig.name, "House Party Pack");
});

// Locked is not the host's mistake: the room is simply past SETUP, and the fix
// is the reset-game escape hatch rather than editing a field.
test("flags the locked state when apply is rejected past SETUP", () => {
  const outcome = resolveConfigOutcome({
    action: CONFIG_ACTIONS.APPLY,
    ok: false,
    code: CONFIG_ERROR_CODES.LOCKED,
    message: "Config can only be applied during SETUP. Reset the game first.",
    issues: []
  });

  assert.equal(outcome.isLocked, true);
  assert.equal(
    outcome.errorMessage,
    "Config can only be applied during SETUP. Reset the game first."
  );
  assert.equal(outcome.didApply, false);
});

test("does not flag the locked state when the failure is a validation rejection", () => {
  const outcome = resolveConfigOutcome({
    action: CONFIG_ACTIONS.APPLY,
    ok: false,
    code: CONFIG_ERROR_CODES.INVALID,
    message: "Content failed validation; nothing was written.",
    issues: [{ path: "gameConfig.rounds[1].sauce", message: "must be a non-empty string" }]
  });

  assert.equal(outcome.isLocked, false);
  assert.deepEqual(outcome.issues, [
    { path: "gameConfig.rounds[1].sauce", message: "must be a non-empty string" }
  ]);
});

// Nothing was written, so the previous snapshot is still the truth on disk —
// clearing it would blank the wizard on a rejected apply.
test("carries no content when the reply is a failure", () => {
  const outcome = resolveConfigOutcome({
    action: CONFIG_ACTIONS.APPLY,
    ok: false,
    code: CONFIG_ERROR_CODES.WRITE_FAILED,
    message: "EACCES",
    issues: []
  });

  assert.equal(outcome.content, null);
});
