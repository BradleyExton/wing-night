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

const selectDeck = (
  state: EmojiCharadesRuntimeState,
  deckId = "movies"
): EmojiCharadesRuntimeState => {
  return reduce(state, "selectDeck", { deckId }).state;
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

test("starts in deck_selection when initialized", () => {
  const state = initialize();

  assert.equal(state.status, "deck_selection");
  assert.equal(state.selectedDeckId, null);
  assert.deepEqual(state.shuffledSubjectIds, []);
  assert.equal(state.activeTurnTeamId, "team-a");
});

test("enters playing with a shuffled deck when a deck is selected", () => {
  const state = selectDeck(initialize());

  assert.equal(state.status, "playing");
  assert.equal(state.selectedDeckId, "movies");
  assert.equal(state.subjectCursor, 0);
  assert.deepEqual(
    [...state.shuffledSubjectIds].sort(),
    ["jaws", "rocky", "titanic"]
  );
});

test("ignores selectDeck when the deck has fewer subjects than pointsMax", () => {
  const { state, didMutate } = reduce(initialize(), "selectDeck", {
    deckId: "tiny"
  });

  assert.equal(didMutate, false);
  assert.equal(state.status, "deck_selection");
});

test("ignores selectDeck when the deck id is unknown", () => {
  const { didMutate } = reduce(initialize(), "selectDeck", {
    deckId: "nope"
  });

  assert.equal(didMutate, false);
});

test("ignores selectDeck when already playing", () => {
  const playing = selectDeck(initialize());
  const { didMutate } = reduce(playing, "selectDeck", { deckId: "movies" });

  assert.equal(didMutate, false);
});

test("marks decks unselectable when they are smaller than pointsMax", () => {
  const view = hostView(initialize());

  assert.equal(view.status, "deck_selection");

  if (view.status !== "deck_selection") {
    return;
  }

  assert.deepEqual(
    view.availableDecks.map((deck) => [deck.id, deck.isSelectable]),
    [
      ["movies", true],
      ["tiny", false]
    ]
  );
});

test("appends emoji to the sequence when playing", () => {
  let state = selectDeck(initialize());
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;
  state = reduce(state, "appendEmoji", { emoji: "🌴" }).state;

  assert.deepEqual(state.emojiSequence, ["🦖", "🌴"]);
});

test("ignores appendEmoji when still in deck_selection", () => {
  const { didMutate } = reduce(initialize(), "appendEmoji", { emoji: "🦖" });

  assert.equal(didMutate, false);
});

test("rejects regional indicator letters when banLetterEmojis is on", () => {
  const playing = selectDeck(initialize());
  const { state, didMutate } = reduce(playing, "appendEmoji", { emoji: "🇦" });

  assert.equal(didMutate, false);
  assert.deepEqual(state.emojiSequence, []);
});

test("rejects keycap digits when banLetterEmojis is on", () => {
  const playing = selectDeck(initialize());
  const { didMutate } = reduce(playing, "appendEmoji", { emoji: "1️⃣" });

  assert.equal(didMutate, false);
});

test("accepts letter emoji when banLetterEmojis is turned off", () => {
  const playing = selectDeck(initialize());
  const { state, didMutate } = reduce(
    playing,
    "appendEmoji",
    { emoji: "🇦" },
    { banLetterEmojis: false }
  );

  assert.equal(didMutate, true);
  assert.deepEqual(state.emojiSequence, ["🇦"]);
});

test("stops appending at the per-subject emoji cap", () => {
  let state = selectDeck(initialize());

  for (let index = 0; index < MAX_EMOJIS_PER_SUBJECT; index += 1) {
    state = reduce(state, "appendEmoji", { emoji: "🔥" }).state;
  }

  assert.equal(state.emojiSequence.length, MAX_EMOJIS_PER_SUBJECT);

  const { didMutate } = reduce(state, "appendEmoji", { emoji: "🔥" });

  assert.equal(didMutate, false);
});

test("removes the last emoji when removeEmoji is dispatched", () => {
  let state = selectDeck(initialize());
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;
  state = reduce(state, "appendEmoji", { emoji: "🌴" }).state;
  state = reduce(state, "removeEmoji").state;

  assert.deepEqual(state.emojiSequence, ["🦖"]);
});

test("ignores removeEmoji when the sequence is empty", () => {
  const { didMutate } = reduce(selectDeck(initialize()), "removeEmoji");

  assert.equal(didMutate, false);
});

test("empties the sequence when clearEmojis is dispatched", () => {
  let state = selectDeck(initialize());
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;
  state = reduce(state, "clearEmojis").state;

  assert.deepEqual(state.emojiSequence, []);
});

test("awards a point and reveals the subject when marked correct", () => {
  let state = selectDeck(initialize());
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
  let state = selectDeck(initialize());
  state = reduce(state, "skipSubject").state;

  assert.equal(state.pendingPointsByTeamId["team-a"], 0);
  assert.equal(state.subjectCursor, 1);
  assert.equal(state.reveal?.outcome, "SKIPPED");
});

test("honours pointsPerCorrect from rules", () => {
  let state = selectDeck(initialize());
  state = reduce(state, "markCorrect", {}, { pointsPerCorrect: 2 }).state;

  assert.equal(state.pendingPointsByTeamId["team-a"], 2);
});

test("clamps pending points at pointsMax", () => {
  let state = selectDeck(initialize());

  for (let index = 0; index < 3; index += 1) {
    state = reduce(state, "markCorrect", {}, { pointsPerCorrect: 5 }).state;
  }

  assert.equal(state.pendingPointsByTeamId["team-a"], POINTS_MAX);
});

test("serves every subject once without repeating within a turn", () => {
  let state = selectDeck(initialize());
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
  let state = selectDeck(initialize());

  for (let index = 0; index < 3; index += 1) {
    state = reduce(state, "skipSubject").state;
  }

  assert.equal(state.status, "turn_complete");
});

test("ignores further actions once the turn is complete", () => {
  let state = selectDeck(initialize());

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
  const { didMutate } = reduce(selectDeck(initialize()), "somethingElse");

  assert.equal(didMutate, false);
});

test("keeps the subject text off the display view while playing", () => {
  let state = selectDeck(initialize());
  state = reduce(state, "appendEmoji", { emoji: "🦖" }).state;

  const view = displayView(state);

  assert.equal(view.status, "playing");
  assert.equal(JSON.stringify(view).includes("Jaws"), false);
  assert.equal(JSON.stringify(view).includes("Rocky"), false);
  assert.equal(JSON.stringify(view).includes("Titanic"), false);
  assert.equal("currentSubject" in view, false);
});

test("sends the subject text to the display only inside the reveal", () => {
  let state = selectDeck(initialize());
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
  let state = selectDeck(initialize());

  const before = hostView(state);
  assert.equal(before.status === "playing" ? before.subjectsRemaining : -1, 3);

  state = reduce(state, "skipSubject").state;

  const after = hostView(state);
  assert.equal(after.status === "playing" ? after.subjectsRemaining : -1, 2);
});

test("replaces pending points when the room syncs them", () => {
  const state = selectDeck(initialize());
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
  const state = emojiCharadesRuntimePlugin.initialize({
    teamIds: ["team-a"],
    activeRoundTeamId: "team-a",
    pointsMax: 1,
    pendingPointsByTeamId: { "team-a": 0 },
    rules: null,
    content: asSerializable({ decks: [{ id: "broken" }] })
  }) as EmojiCharadesRuntimeState;

  const view = emojiCharadesRuntimePlugin.selectHostView({
    state: asSerializable(state),
    rules: null,
    content: asSerializable({ decks: [{ id: "broken" }] })
  }) as EmojiCharadesMinigameHostView;

  assert.equal(view.status, "deck_selection");

  if (view.status !== "deck_selection") {
    return;
  }

  assert.deepEqual(view.availableDecks, []);
});
