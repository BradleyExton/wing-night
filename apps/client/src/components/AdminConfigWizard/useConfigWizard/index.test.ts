import assert from "node:assert/strict";
import test from "node:test";
import type { ConfigContentSnapshot } from "@wingnight/shared";

import { toConfigDraft, type ConfigDraft } from "../contentDraft/index";
import { resolveNextContentState } from "./index";

const buildSnapshot = (
  overrides: Partial<ConfigContentSnapshot> = {}
): ConfigContentSnapshot => ({
  gameConfig: {
    name: "House Party Pack",
    rounds: [
      {
        round: 1,
        label: "Warm Up",
        sauce: "Frank's",
        pointsPerPlayer: 2,
        minigame: "TRIVIA"
      }
    ],
    minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
    timers: {
      eatingSeconds: 120,
      geoSeconds: 45,
      drawingSeconds: 60,
      emojiCharadesSeconds: 90
    }
  },
  players: [{ name: "Alex" }],
  teams: [{ name: "Scorch Squad" }],
  triviaPrompts: [{ id: "spice-origin", question: "Where?", answer: "Mexico" }],
  drawingPrompts: [{ id: "pizza-slice", prompt: "Pizza slice" }],
  geoPromptCount: 12,
  ...overrides
});

const buildDraft = (
  overrides: Partial<ConfigContentSnapshot> = {}
): ConfigDraft => toConfigDraft(buildSnapshot(overrides));

const withTypedTeamName = (draft: ConfigDraft, name: string): ConfigDraft => ({
  ...draft,
  teams: { teams: [{ name }] }
});

test("does seed both halves when the first read lands on an empty wizard", () => {
  const incoming = buildDraft();

  const next = resolveNextContentState(null, incoming, false);

  assert.deepEqual(next.baseline, incoming);
  assert.deepEqual(next.draft, incoming);
});

test("does keep the host's unsaved edits when a reconnect re-reads disk", () => {
  const seeded = buildDraft();
  const edited = withTypedTeamName(seeded, "Molten Metal");
  const diskContent = buildDraft();

  const next = resolveNextContentState(
    { baseline: seeded, draft: edited },
    diskContent,
    false
  );

  assert.deepEqual(next.draft, edited);
  assert.deepEqual(next.baseline, diskContent);
});

test("does re-seed the draft when the read is the host's own apply landing", () => {
  const seeded = buildDraft();
  const edited = withTypedTeamName(seeded, "Molten Metal");
  const applied = withTypedTeamName(buildDraft(), "Molten Metal");

  const next = resolveNextContentState(
    { baseline: seeded, draft: edited },
    applied,
    true
  );

  assert.deepEqual(next.draft, applied);
  assert.deepEqual(next.baseline, applied);
});

test("does re-seed the draft when a reconnect finds nothing typed", () => {
  const seeded = buildDraft();
  const diskContent = withTypedTeamName(buildDraft(), "Edited On Disk");

  const next = resolveNextContentState(
    { baseline: seeded, draft: seeded },
    diskContent,
    false
  );

  assert.deepEqual(next.draft, diskContent);
  assert.deepEqual(next.baseline, diskContent);
});

// A draft typed back to its original value holds no work to lose, so it is
// re-seeded like an untouched one rather than pinned by a stale "was edited"
// flag.
test("does re-seed the draft when the host typed a value and typed it back", () => {
  const seeded = buildDraft();
  const retyped = withTypedTeamName(seeded, "Scorch Squad");
  const diskContent = withTypedTeamName(buildDraft(), "Edited On Disk");

  const next = resolveNextContentState(
    { baseline: seeded, draft: retyped },
    diskContent,
    false
  );

  assert.deepEqual(next.draft, diskContent);
});
