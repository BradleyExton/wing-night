import assert from "node:assert/strict";
import test from "node:test";

import type {
  EmojiCharadesContentFile,
  EmojiCharadesMinigameDisplayView,
  EmojiCharadesMinigameHostView
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { emojiCharadesMinigameId, emojiCharadesRuntimePlugin } from "./index.js";
import { parseEmojiCharadesContentFile } from "./content/index.js";
import {
  MAX_EMOJIS_PER_SUBJECT,
  SUBJECT_REVEAL_MS,
  type EmojiCharadesRuntimeState
} from "./types/index.js";

const POINTS_MAX = 3;

const contentFixture: EmojiCharadesContentFile = {
  decks: [
    {
      id: "movies",
      label: "Movies",
      subjects: [
        { id: "jaws", text: "Jaws" },
        { id: "rocky", text: "Rocky" },
        { id: "titanic", text: "Titanic" }
      ]
    },
    {
      id: "tiny",
      label: "Too Small",
      subjects: [{ id: "sunrise", text: "Sunrise" }]
    }
  ]
};

const asSerializable = (value: unknown): SerializableValue => {
  return value as SerializableValue;
};

const initialize = (): EmojiCharadesRuntimeState => {
  const state = emojiCharadesRuntimePlugin.initialize({
    teamIds: ["team-a", "team-b"],
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
    activeRoundTeamId: "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: { "team-a": 0, "team-b": 0 },
    rules: null,
    content: asSerializable(contentFixture)
  });

  return state as EmojiCharadesRuntimeState;
};

const reduce = (
  state: EmojiCharadesRuntimeState,
  actionType: string,
  actionPayload: SerializableValue = {},
  rules: SerializableValue | null = null
): { state: EmojiCharadesRuntimeState; didMutate: boolean } => {
  const result = emojiCharadesRuntimePlugin.reduceAction({
    state: asSerializable(state),
    envelope: { actionType, actionPayload },
    pointsMax: POINTS_MAX,
    rules,
    content: asSerializable(contentFixture)
  });

  return {
    state: result.state as EmojiCharadesRuntimeState,
    didMutate: result.didMutate
  };
};

const hostView = (
  state: EmojiCharadesRuntimeState
): EmojiCharadesMinigameHostView => {
  return emojiCharadesRuntimePlugin.selectHostView({
    state: asSerializable(state),
    rules: null,
    content: asSerializable(contentFixture)
  }) as EmojiCharadesMinigameHostView;
};

const displayView = (
  state: EmojiCharadesRuntimeState
): EmojiCharadesMinigameDisplayView => {
  return emojiCharadesRuntimePlugin.selectDisplayView({
    state: asSerializable(state),
    rules: null,
    content: asSerializable(contentFixture)
  }) as EmojiCharadesMinigameDisplayView;
};

test("registers under the EMOJI_CHARADES minigame id", () => {
  assert.equal(emojiCharadesMinigameId, "EMOJI_CHARADES");
  assert.equal(emojiCharadesRuntimePlugin.id, "EMOJI_CHARADES");
});

test("opens on a shuffled deck, dealt rather than picked", () => {
  const state = initialize();

  assert.equal(state.status, "playing");
  assert.equal(state.selectedDeckId, "movies");
  assert.equal(state.subjectCursor, 0);
  assert.equal(state.activeTurnTeamId, "team-a");
  assert.deepEqual(
    [...state.shuffledSubjectIds].sort(),
    ["jaws", "rocky", "titanic"]
  );
});

test("skips past a leading deck too short to carry the turn", () => {
  const state = emojiCharadesRuntimePlugin.initialize({
    teamIds: ["team-a"],
    players: [],
    teams: [],
    activeRoundTeamId: "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: { "team-a": 0 },
    rules: null,
    content: asSerializable({
      decks: [contentFixture.decks[1], contentFixture.decks[0]]
    })
  }) as EmojiCharadesRuntimeState;

  assert.equal(state.selectedDeckId, "movies");
});

test("deals the longest deck when no deck can carry a whole turn", () => {
  const state = emojiCharadesRuntimePlugin.initialize({
    teamIds: ["team-a"],
    players: [],
    teams: [],
    activeRoundTeamId: "team-a",
    // Nothing in the fixture reaches this, so the fallback is the only path.
    pointsMax: 99,
    pendingPointsByTeamId: { "team-a": 0 },
    rules: null,
    content: asSerializable(contentFixture)
  }) as EmojiCharadesRuntimeState;

  assert.equal(state.selectedDeckId, "movies");
  assert.equal(state.shuffledSubjectIds.length, 3);
});

test("deals no deck at all when the content carries none", () => {
  const state = emojiCharadesRuntimePlugin.initialize({
    teamIds: ["team-a"],
    players: [],
    teams: [],
    activeRoundTeamId: "team-a",
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: { "team-a": 0 },
    rules: null,
    content: asSerializable({ decks: [] })
  }) as EmojiCharadesRuntimeState;

  assert.equal(state.selectedDeckId, null);
  assert.deepEqual(state.shuffledSubjectIds, []);
});

test("appends emoji to the sequence when playing", () => {
  let state = initialize();
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;
  state = reduce(state, "appendEmoji", { emoji: "🌴" }).state;

  assert.deepEqual(state.emojiSequence, ["🦖", "🌴"]);
});

test("rejects regional indicator letters when banLetterEmojis is on", () => {
  const playing = initialize();
  const { state, didMutate } = reduce(playing, "appendEmoji", { emoji: "🇦" });

  assert.equal(didMutate, false);
  assert.deepEqual(state.emojiSequence, []);
});

test("rejects keycap digits when banLetterEmojis is on", () => {
  const playing = initialize();
  const { didMutate } = reduce(playing, "appendEmoji", { emoji: "1️⃣" });

  assert.equal(didMutate, false);
});

test("accepts letter emoji when banLetterEmojis is turned off", () => {
  const playing = initialize();
  const { state, didMutate } = reduce(
    playing,
    "appendEmoji",
    { emoji: "🇦" },
    { banLetterEmojis: false }
  );

  assert.equal(didMutate, true);
  assert.deepEqual(state.emojiSequence, ["🇦"]);
});

test("keeps multi-codepoint emoji whole when they are appended", () => {
  let state = initialize();

  // A ZWJ sequence, a skin-tone modifier and a tag-sequence flag: the clue is
  // an array of whole emoji, never a string anything may index into.
  for (const emoji of ["👨‍👩‍👧‍👦", "👋🏽", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"]) {
    state = reduce(state, "appendEmoji", { emoji }).state;
  }

  assert.deepEqual(state.emojiSequence, ["👨‍👩‍👧‍👦", "👋🏽", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"]);

  state = reduce(state, "removeEmoji").state;

  assert.deepEqual(state.emojiSequence, ["👨‍👩‍👧‍👦", "👋🏽"]);
});

test("ignores appendEmoji when the payload is not a single emoji", () => {
  const playing = initialize();
  const rejected = [
    "Jaws",
    "the answer is Jaws",
    "<img src=x onerror=alert(1)>",
    "🔥 🔥",
    "🔥x",
    "   ",
    "🔥".repeat(20)
  ];

  for (const emoji of rejected) {
    const { state, didMutate } = reduce(playing, "appendEmoji", { emoji });

    assert.equal(didMutate, false, emoji);
    assert.deepEqual(state.emojiSequence, []);
  }
});

test("stops appending at the per-subject emoji cap", () => {
  let state = initialize();

  for (let index = 0; index < MAX_EMOJIS_PER_SUBJECT; index += 1) {
    state = reduce(state, "appendEmoji", { emoji: "🔥" }).state;
  }

  assert.equal(state.emojiSequence.length, MAX_EMOJIS_PER_SUBJECT);

  const { didMutate } = reduce(state, "appendEmoji", { emoji: "🔥" });

  assert.equal(didMutate, false);
});

test("removes the last emoji when removeEmoji is dispatched", () => {
  let state = initialize();
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;
  state = reduce(state, "appendEmoji", { emoji: "🌴" }).state;
  state = reduce(state, "removeEmoji").state;

  assert.deepEqual(state.emojiSequence, ["🦖"]);
});

test("ignores removeEmoji when the sequence is empty", () => {
  const { didMutate } = reduce(initialize(), "removeEmoji");

  assert.equal(didMutate, false);
});

test("empties the sequence when clearEmojis is dispatched", () => {
  let state = initialize();
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;
  state = reduce(state, "clearEmojis").state;

  assert.deepEqual(state.emojiSequence, []);
});

test("awards a point and reveals the subject when marked correct", () => {
  let state = initialize();
  const subjectId = state.shuffledSubjectIds[0] as string;
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;

  const before = Date.now();
  state = reduce(state, "markCorrect").state;

  assert.equal(state.pendingPointsByTeamId["team-a"], 1);
  assert.equal(state.subjectCursor, 1);
  assert.deepEqual(state.emojiSequence, []);
  assert.equal(state.reveal?.subjectId, subjectId);
  assert.equal(state.reveal?.outcome, "CORRECT");
  assert.ok((state.reveal?.expiresAtMs ?? 0) >= before + SUBJECT_REVEAL_MS);
});

test("awards no points but still reveals the subject when skipped", () => {
  let state = initialize();
  state = reduce(state, "skipSubject").state;

  assert.equal(state.pendingPointsByTeamId["team-a"], 0);
  assert.equal(state.subjectCursor, 1);
  assert.equal(state.reveal?.outcome, "SKIPPED");
});

test("honours pointsPerCorrect from rules", () => {
  let state = initialize();
  state = reduce(state, "markCorrect", {}, { pointsPerCorrect: 2 }).state;

  assert.equal(state.pendingPointsByTeamId["team-a"], 2);
});

test("clamps pending points at pointsMax", () => {
  let state = initialize();

  for (let index = 0; index < 3; index += 1) {
    state = reduce(state, "markCorrect", {}, { pointsPerCorrect: 5 }).state;
  }

  assert.equal(state.pendingPointsByTeamId["team-a"], POINTS_MAX);
});

test("serves every subject once without repeating within a turn", () => {
  let state = initialize();
  const served: string[] = [];

  for (let index = 0; index < 3; index += 1) {
    const view = hostView(state);

    if (view.status === "playing" && view.currentSubject !== null) {
      served.push(view.currentSubject.id);
    }

    state = reduce(state, "skipSubject").state;
  }

  assert.equal(new Set(served).size, 3);
});

test("enters turn_complete when the deck is exhausted", () => {
  let state = initialize();

  for (let index = 0; index < 3; index += 1) {
    state = reduce(state, "skipSubject").state;
  }

  assert.equal(state.status, "turn_complete");
});

test("carries the last subject's reveal into turn_complete so the room still learns the answer", () => {
  let state = initialize();

  // Burn every subject but the last, then score the one that ends the turn.
  for (let index = 0; index < 2; index += 1) {
    state = reduce(state, "skipSubject").state;
  }

  const lastSubjectText = (() => {
    const view = hostView(state);

    return view.status === "playing" && view.currentSubject !== null
      ? view.currentSubject.text
      : null;
  })();

  state = reduce(state, "markCorrect").state;

  assert.equal(state.status, "turn_complete");

  const display = displayView(state);
  const host = hostView(state);

  assert.equal(display.status, "turn_complete");
  assert.equal(host.status, "turn_complete");
  assert.equal(
    display.status === "turn_complete" ? (display.reveal?.subjectText ?? null) : null,
    lastSubjectText
  );
  assert.equal(
    host.status === "turn_complete" ? (host.reveal?.subjectText ?? null) : null,
    lastSubjectText
  );
});

test("ignores further actions once the turn is complete", () => {
  let state = initialize();

  for (let index = 0; index < 3; index += 1) {
    state = reduce(state, "skipSubject").state;
  }

  assert.equal(reduce(state, "markCorrect").didMutate, false);
  assert.equal(reduce(state, "appendEmoji", { emoji: "🦖" }).didMutate, false);
});

test("ignores actions when the runtime state is malformed", () => {
  const result = emojiCharadesRuntimePlugin.reduceAction({
    state: asSerializable({ nonsense: true }),
    envelope: { actionType: "appendEmoji", actionPayload: { emoji: "🦖" } },
    pointsMax: POINTS_MAX,
    rules: null,
    content: asSerializable(contentFixture)
  });

  assert.equal(result.didMutate, false);
});

test("ignores an unknown action type", () => {
  const { didMutate } = reduce(initialize(), "somethingElse");

  assert.equal(didMutate, false);
});

test("keeps the subject text off the display view while playing", () => {
  let state = initialize();
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;

  const view = displayView(state);

  assert.equal(view.status, "playing");
  assert.equal(JSON.stringify(view).includes("Jaws"), false);
  assert.equal(JSON.stringify(view).includes("Rocky"), false);
  assert.equal(JSON.stringify(view).includes("Titanic"), false);
  assert.equal("currentSubject" in view, false);
});

test("sends the subject text to the display only inside the reveal", () => {
  let state = initialize();
  const expectedText =
    contentFixture.decks[0]?.subjects.find(
      (subject) => subject.id === state.shuffledSubjectIds[0]
    )?.text ?? "";

  state = reduce(state, "markCorrect").state;

  const view = displayView(state);

  assert.equal(view.status, "playing");

  if (view.status !== "playing") {
    return;
  }

  assert.equal(view.reveal?.subjectText, expectedText);
});

test("reports subjects remaining on the host view", () => {
  let state = initialize();

  const before = hostView(state);
  assert.equal(before.status === "playing" ? before.subjectsRemaining : -1, 3);

  state = reduce(state, "skipSubject").state;

  const after = hostView(state);
  assert.equal(after.status === "playing" ? after.subjectsRemaining : -1, 2);
});

// A subject whose clue is a running joke: the tablet offers Rob's twelve and
// nothing else, and the reducer holds the same line the picker draws.
const LOCKED_EMOJIS = ["✡️", "🕎", "🕍"];

const lockedContentFixture: EmojiCharadesContentFile = {
  decks: [
    {
      id: "the-room",
      label: "People in This Room",
      subjects: [
        { id: "rob-barnes", text: "Rob Barnes", lockedEmojis: LOCKED_EMOJIS }
      ]
    }
  ]
};

const initializeLocked = (): EmojiCharadesRuntimeState => {
  return emojiCharadesRuntimePlugin.initialize({
    teamIds: ["team-a"],
    players: [],
    teams: [],
    activeRoundTeamId: "team-a",
    pointsMax: 1,
    pendingPointsByTeamId: { "team-a": 0 },
    rules: null,
    content: asSerializable(lockedContentFixture)
  }) as EmojiCharadesRuntimeState;
};

const reduceLocked = (
  state: EmojiCharadesRuntimeState,
  emoji: string
): { state: EmojiCharadesRuntimeState; didMutate: boolean } => {
  const result = emojiCharadesRuntimePlugin.reduceAction({
    state: asSerializable(state),
    envelope: { actionType: "appendEmoji", actionPayload: { emoji } },
    pointsMax: 1,
    rules: null,
    content: asSerializable(lockedContentFixture)
  });

  return {
    state: result.state as EmojiCharadesRuntimeState,
    didMutate: result.didMutate
  };
};

test("accepts an emoji from a locked subject's own list", () => {
  const { state, didMutate } = reduceLocked(initializeLocked(), "🕎");

  assert.equal(didMutate, true);
  assert.deepEqual(state.emojiSequence, ["🕎"]);
});

test("refuses an emoji a locked subject was never offered", () => {
  const { state, didMutate } = reduceLocked(initializeLocked(), "🦖");

  assert.equal(didMutate, false);
  assert.deepEqual(state.emojiSequence, []);
});

test("hands the locked list to the tablet and to nobody else", () => {
  const state = initializeLocked();

  const host = emojiCharadesRuntimePlugin.selectHostView({
    state: asSerializable(state),
    rules: null,
    content: asSerializable(lockedContentFixture)
  }) as EmojiCharadesMinigameHostView;

  assert.equal(host.status, "playing");

  if (host.status !== "playing") {
    return;
  }

  assert.deepEqual(host.currentSubject?.lockedEmojis, LOCKED_EMOJIS);

  const display = emojiCharadesRuntimePlugin.selectDisplayView({
    state: asSerializable(state),
    rules: null,
    content: asSerializable(lockedContentFixture)
  }) as EmojiCharadesMinigameDisplayView;

  assert.equal(JSON.stringify(display).includes("lockedEmojis"), false);
});

test("leaves an ordinary subject's locked list null", () => {
  const host = hostView(initialize());

  assert.equal(host.status, "playing");

  if (host.status !== "playing") {
    return;
  }

  assert.equal(host.currentSubject?.lockedEmojis, null);
});

test("replaces pending points when the room syncs them", () => {
  const state = initialize();
  const synced = emojiCharadesRuntimePlugin.syncPendingPoints?.({
    state: asSerializable(state),
    pendingPointsByTeamId: { "team-a": 7, "team-b": 2 }
  }) as EmojiCharadesRuntimeState;

  assert.deepEqual(synced.pendingPointsByTeamId, { "team-a": 7, "team-b": 2 });
});

test("parses a well-formed content file", () => {
  const parsed = parseEmojiCharadesContentFile(
    JSON.stringify(contentFixture),
    "minigames/emoji-charades.json"
  );

  assert.equal(parsed.decks.length, 2);
  assert.equal(parsed.decks[0]?.subjects.length, 3);
});

test("throws naming the file when the content is not valid JSON", () => {
  assert.throws(
    () => parseEmojiCharadesContentFile("{", "minigames/emoji-charades.json"),
    /minigames\/emoji-charades\.json/
  );
});

test("throws when a deck has duplicate subject ids", () => {
  const duplicated = {
    decks: [
      {
        id: "movies",
        label: "Movies",
        subjects: [
          { id: "jaws", text: "Jaws" },
          { id: "jaws", text: "Jaws II" }
        ]
      }
    ]
  };

  assert.throws(
    () =>
      parseEmojiCharadesContentFile(
        JSON.stringify(duplicated),
        "minigames/emoji-charades.json"
      ),
    /Invalid emoji charades content/
  );
});

test("drops malformed decks when resolving content leniently", () => {
  const brokenContent = asSerializable({ decks: [{ id: "broken" }] });
  const state = emojiCharadesRuntimePlugin.initialize({
    teamIds: ["team-a"],
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
    activeRoundTeamId: "team-a",
    pointsMax: 1,
    pendingPointsByTeamId: { "team-a": 0 },
    rules: null,
    content: brokenContent
  }) as EmojiCharadesRuntimeState;

  assert.equal(state.selectedDeckId, null);

  const view = emojiCharadesRuntimePlugin.selectHostView({
    state: asSerializable(state),
    rules: null,
    content: brokenContent
  }) as EmojiCharadesMinigameHostView;

  assert.equal(view.status, "playing");

  if (view.status !== "playing") {
    return;
  }

  assert.equal(view.currentSubject, null);
});

test("tells the display what a solved subject is worth", () => {
  const view = emojiCharadesRuntimePlugin.selectDisplayView({
    state: asSerializable(initialize()),
    rules: asSerializable({ pointsPerCorrect: 2 }),
    content: asSerializable(contentFixture)
  }) as EmojiCharadesMinigameDisplayView;

  assert.equal(view.pointsPerCorrect, 2);
});
