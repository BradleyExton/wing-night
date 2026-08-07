import assert from "node:assert/strict";
import test from "node:test";
import type { ConfigContentSnapshot } from "@wingnight/shared";

import {
  nextDrawingPrompt,
  nextTriviaPrompt,
  selectDraftIssues,
  selectDirtyEdits,
  setPlayerAvatarSrc,
  toConfigDraft,
  type ConfigDraft
} from "./index";

const buildSnapshot = (
  overrides: Partial<ConfigContentSnapshot> = {}
): ConfigContentSnapshot => ({
  gameConfig: {
    name: "House Party Pack",
    setupPreviewRoundSlots: 8,
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
    minigameRules: { trivia: { questionsPerTurn: 5 }, geo: { promptsPerTurn: 3 } },
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
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

test("wraps each flat snapshot array into its whole-file shape when seeding a draft", () => {
  const draft = toConfigDraft(buildSnapshot());

  assert.deepEqual(draft.players, { players: [{ name: "Alex" }] });
  assert.deepEqual(draft.teams, { teams: [{ name: "Scorch Squad" }] });
  assert.deepEqual(draft.trivia, {
    prompts: [{ id: "spice-origin", question: "Where?", answer: "Mexico" }]
  });
  assert.deepEqual(draft.drawing, {
    prompts: [{ id: "pizza-slice", prompt: "Pizza slice" }]
  });
});

test("carries the game config through unwrapped when seeding a draft", () => {
  const snapshot = buildSnapshot();

  assert.deepEqual(toConfigDraft(snapshot).gameConfig, snapshot.gameConfig);
});

test("emits no edits when the draft still matches its baseline", () => {
  const baseline = buildDraft();

  assert.deepEqual(selectDirtyEdits(buildDraft(), baseline), []);
});

test("emits only the changed file when one file was edited", () => {
  const baseline = buildDraft();
  const draft = buildDraft({ players: [{ name: "Jordan" }] });

  const edits = selectDirtyEdits(draft, baseline);

  assert.deepEqual(edits, [
    { key: "players", value: { players: [{ name: "Jordan" }] } }
  ]);
});

test("emits one edit per changed file when two files were edited", () => {
  const baseline = buildDraft();
  const draft = buildDraft({
    players: [{ name: "Jordan" }],
    drawingPrompts: [{ id: "pizza-slice", prompt: "Hot wing" }]
  });

  assert.deepEqual(
    selectDirtyEdits(draft, baseline).map((edit) => edit.key),
    ["players", "drawing"]
  );
});

test("sends the whole file rather than a delta when a single entry changed", () => {
  const baseline = buildDraft({
    teams: [{ name: "Scorch Squad" }, { name: "Blaze Brigade" }]
  });
  const draft = buildDraft({
    teams: [{ name: "Scorch Squad" }, { name: "Pepper Riot" }]
  });

  assert.deepEqual(selectDirtyEdits(draft, baseline)[0]?.value, {
    teams: [{ name: "Scorch Squad" }, { name: "Pepper Riot" }]
  });
});

test("reports no issues when every file in the draft is valid", () => {
  assert.deepEqual(selectDraftIssues(buildDraft()), []);
});

test("prefixes an issue with its file key so it matches the server's coordinates", () => {
  const draft = buildDraft({ players: [{ name: "  " }] });

  assert.deepEqual(selectDraftIssues(draft), [
    { path: "players.players[0].name", message: "must be a non-empty string" }
  ]);
});

test("keeps issues from different files apart when two files are invalid", () => {
  const draft = buildDraft({
    teams: [{ name: "" }],
    triviaPrompts: [{ id: "a", question: "", answer: "Mexico" }]
  });

  assert.deepEqual(
    selectDraftIssues(draft).map((issue) => issue.path),
    ["teams.teams[0].name", "trivia.prompts[0].question"]
  );
});

test("mints the next free suffix when a trivia prompt is added", () => {
  const prompt = nextTriviaPrompt([
    { id: "trivia-1", question: "q", answer: "a" }
  ]);

  assert.equal(prompt.id, "trivia-2");
});

test("skips a suffix already in use when minting a prompt id", () => {
  const prompt = nextDrawingPrompt([
    { id: "drawing-2", prompt: "a" },
    { id: "drawing-3", prompt: "b" }
  ]);

  assert.equal(prompt.id, "drawing-4");
});

test("mints a unique id when every candidate suffix is taken by an unrelated id", () => {
  const prompt = nextDrawingPrompt([
    { id: "drawing-1", prompt: "a" },
    { id: "drawing-2", prompt: "b" },
    { id: "drawing-3", prompt: "c" }
  ]);

  assert.equal(prompt.id, "drawing-4");
});

test("seeds a blank body so the new prompt shows as invalid until it is typed", () => {
  assert.deepEqual(nextTriviaPrompt([]), {
    id: "trivia-1",
    question: "",
    answer: ""
  });
});

test("removes the key rather than writing an empty string when an avatar is cleared", () => {
  const player = setPlayerAvatarSrc({ name: "Alex", avatarSrc: "/alex.png" }, "   ");

  assert.equal("avatarSrc" in player, false);
  assert.deepEqual(player, { name: "Alex" });
});

test("keeps a cleared avatar valid where an empty string would not be", () => {
  const draft = buildDraft({
    players: [setPlayerAvatarSrc({ name: "Alex", avatarSrc: "/alex.png" }, "")]
  });

  assert.deepEqual(selectDraftIssues(draft), []);
});

test("writes the key when an avatar is set to a non-empty value", () => {
  assert.deepEqual(setPlayerAvatarSrc({ name: "Alex" }, "/alex.png"), {
    name: "Alex",
    avatarSrc: "/alex.png"
  });
});
