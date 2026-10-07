import assert from "node:assert/strict";
import test from "node:test";

import { type GeoContentFile } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { geoMinigameId, geoRuntimePlugin } from "./index.js";
import { parseGeoContentFile } from "./content/index.js";
import { isGeoRules, resolveGeoRules } from "./rules/index.js";
import { haversineDistanceKm, resolvePointsForDistance } from "./scoring/index.js";
import { DEFAULT_GEO_SCORE_BANDS_KM, type GeoRuntimeState } from "./types/index.js";

const geoContentFixture: GeoContentFile = {
  prompts: [
    {
      id: "geo-1",
      title: "Eiffel Tower",
      imageSrc: "/sample-assets/geo/eiffel-tower.svg",
      hint: "City of Light",
      answer: { lat: 48.85837, lng: 2.294481 }
    },
    {
      id: "geo-2",
      title: "Colosseum",
      imageSrc: "/sample-assets/geo/colosseum.svg",
      answer: { lat: 41.890251, lng: 12.492373 }
    },
    {
      id: "geo-3",
      title: "Machu Picchu",
      imageSrc: "/sample-assets/geo/machu-picchu.svg",
      answer: { lat: -13.163141, lng: -72.544963 }
    }
  ]
};

const initializeState = (
  overrides: Partial<{
    teamIds: string[];
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
    activeRoundTeamId: string | null;
    pointsMax: number;
    pendingPointsByTeamId: Record<string, number>;
    rules: SerializableValue | null;
    content: SerializableValue | null;
  }> = {}
): GeoRuntimeState => {
  const state = geoRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined
        ? "team-1"
        : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules: overrides.rules ?? null,
    content: overrides.content === undefined ? geoContentFixture : overrides.content
  });

  assert.notEqual(state, null);
  return state as GeoRuntimeState;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue,
  options: Partial<{
    pointsMax: number;
    rules: SerializableValue | null;
    content: SerializableValue | null;
  }> = {}
): { state: SerializableValue; didMutate: boolean } => {
  return geoRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: options.pointsMax ?? 15,
    rules: options.rules ?? null,
    content: options.content === undefined ? geoContentFixture : options.content
  });
};

test("geo runtime plugin declares its id, content file, and rules guard", () => {
  assert.equal(geoMinigameId, "GEO");
  assert.equal(geoRuntimePlugin.id, "GEO");
  assert.equal(geoRuntimePlugin.content?.fileName, "minigames/geo.json");
  assert.equal(isGeoRules({ promptsPerTurn: 3 }), true);
  assert.equal(isGeoRules({}), true);
  assert.equal(isGeoRules({ promptsPerTurn: 0 }), false);
  assert.equal(isGeoRules({ scoreBandsKm: [] }), false);
  assert.equal(isGeoRules({ scoreBandsKm: [{ maxKm: 1, points: 2 }] }), true);
  assert.equal(isGeoRules({ scoreBandsKm: [{ maxKm: -1, points: 2 }] }), false);
});

test("initialize seeds a single-team turn in guessing sub-state", () => {
  const state = initializeState({ pendingPointsByTeamId: { "team-2": 3 } });

  assert.deepEqual(state.turnOrderTeamIds, ["team-1"]);
  assert.equal(state.activeTurnIndex, 0);
  assert.equal(state.promptCursor, 0);
  assert.equal(state.promptsPerTurn, 3);
  assert.equal(state.promptsCompletedThisTurn, 0);
  assert.equal(state.currentGuess, null);
  assert.equal(state.currentSubState, "guessing");
  assert.equal(state.lastResult, null);
  assert.deepEqual(state.pendingPointsByTeamId, { "team-2": 3 });
});

test("initialize seeds the prompt cursor by team index so teams see fresh prompts", () => {
  const teamOneState = initializeState({ activeRoundTeamId: "team-1" });
  const teamTwoState = initializeState({ activeRoundTeamId: "team-2" });

  assert.equal(teamOneState.promptCursor, 0);
  // Team 2 starts at (1 * 3 promptsPerTurn) % 3 prompts = 0 with this small
  // fixture; with a larger bank it lands promptsPerTurn ahead.
  assert.equal(teamTwoState.promptCursor, 0);

  const fivePromptContent: GeoContentFile = {
    prompts: [
      ...geoContentFixture.prompts,
      {
        id: "geo-4",
        title: "Golden Gate Bridge",
        imageSrc: "/sample-assets/geo/golden-gate-bridge.svg",
        answer: { lat: 37.819929, lng: -122.478255 }
      },
      {
        id: "geo-5",
        title: "Great Pyramid",
        imageSrc: "/sample-assets/geo/great-pyramid.svg",
        answer: { lat: 29.979235, lng: 31.134202 }
      }
    ]
  };

  const seededState = initializeState({
    activeRoundTeamId: "team-2",
    content: fivePromptContent
  });

  assert.equal(seededState.promptCursor, 3);
});

test("initialize honors promptsPerTurn rule overrides and rejects malformed rules", () => {
  const ruledState = initializeState({ rules: { promptsPerTurn: 5 } });
  const malformedState = initializeState({ rules: { promptsPerTurn: -2 } });

  assert.equal(ruledState.promptsPerTurn, 5);
  assert.equal(malformedState.promptsPerTurn, 3);
});

test("haversine distance matches a known city pair", () => {
  const parisToLondonKm = haversineDistanceKm(
    { lat: 48.8566, lng: 2.3522 },
    { lat: 51.5074, lng: -0.1278 }
  );

  assert.ok(Math.abs(parisToLondonKm - 343) < 5);
});

test("score bands award points at inclusive boundaries", () => {
  const bands = DEFAULT_GEO_SCORE_BANDS_KM;

  assert.equal(resolvePointsForDistance(0, bands), 5);
  assert.equal(resolvePointsForDistance(0.1, bands), 5);
  assert.equal(resolvePointsForDistance(0.10001, bands), 4);
  assert.equal(resolvePointsForDistance(0.5, bands), 4);
  assert.equal(resolvePointsForDistance(2, bands), 3);
  assert.equal(resolvePointsForDistance(10, bands), 2);
  assert.equal(resolvePointsForDistance(50, bands), 1);
  assert.equal(resolvePointsForDistance(50.0001, bands), 0);
});

test("custom score bands are normalized into ascending order", () => {
  const rules = resolveGeoRules({
    scoreBandsKm: [
      { maxKm: 100, points: 1 },
      { maxKm: 1, points: 3 }
    ]
  });

  assert.deepEqual(rules.scoreBandsKm, [
    { maxKm: 1, points: 3 },
    { maxKm: 100, points: 1 }
  ]);
  assert.equal(resolvePointsForDistance(0.5, rules.scoreBandsKm), 3);
});

test("malformed score bands fall back to defaults", () => {
  const rules = resolveGeoRules({ scoreBandsKm: [{ maxKm: -1, points: 2 }] });

  assert.deepEqual(rules.scoreBandsKm, DEFAULT_GEO_SCORE_BANDS_KM);
});

test("setGuess places and overwrites the marker while guessing", () => {
  const state = initializeState();

  const placed = reduce(state, "setGuess", { lat: 10, lng: 20 });

  assert.equal(placed.didMutate, true);
  assert.deepEqual((placed.state as GeoRuntimeState).currentGuess, {
    lat: 10,
    lng: 20
  });

  const overwritten = reduce(placed.state, "setGuess", { lat: -5, lng: 30 });

  assert.equal(overwritten.didMutate, true);
  assert.deepEqual((overwritten.state as GeoRuntimeState).currentGuess, {
    lat: -5,
    lng: 30
  });
});

test("submitGuess scores the active team from the matching band and caps at pointsMax", () => {
  const state = initializeState({ pendingPointsByTeamId: { "team-1": 14 } });

  const placed = reduce(state, "setGuess", { lat: 48.85837, lng: 2.294481 });
  const submitted = reduce(placed.state, "submitGuess", {});
  const submittedState = submitted.state as GeoRuntimeState;

  assert.equal(submitted.didMutate, true);
  assert.equal(submittedState.currentSubState, "submitted");
  assert.equal(submittedState.promptsCompletedThisTurn, 1);
  assert.equal(submittedState.lastResult?.pointsAwarded, 5);
  assert.equal(submittedState.lastResult?.promptId, "geo-1");
  // 14 pending + 5 awarded capped at pointsMax 15.
  assert.equal(submittedState.pendingPointsByTeamId["team-1"], 15);
});

test("a full three-prompt turn accumulates points for the active team only", () => {
  let state: SerializableValue = initializeState();

  for (const promptId of ["geo-1", "geo-2", "geo-3"]) {
    const current = state as GeoRuntimeState;
    const prompt = geoContentFixture.prompts.find((entry) => entry.id === promptId);

    assert.notEqual(prompt, undefined);
    assert.equal(current.currentSubState, "guessing");

    state = reduce(state, "setGuess", {
      lat: prompt?.answer.lat ?? 0,
      lng: prompt?.answer.lng ?? 0
    }).state;
    state = reduce(state, "submitGuess", {}).state;

    if (promptId !== "geo-3") {
      state = reduce(state, "nextPrompt", {}).state;
    }
  }

  const finalState = state as GeoRuntimeState;

  assert.equal(finalState.promptsCompletedThisTurn, 3);
  assert.equal(finalState.pendingPointsByTeamId["team-1"], 15);
  assert.equal(finalState.pendingPointsByTeamId["team-2"], undefined);

  const blockedNext = reduce(state, "nextPrompt", {});

  assert.equal(blockedNext.didMutate, false);
});

// The cursor may only move on `nextPrompt`, and `nextPrompt` is dead once the
// turn's budget is spent. Advancing it on the guess that ends the turn would
// put the NEXT team's photo on the TV — and its answer on the host tablet —
// between the final stamp and END TEAM TURN, and burn that exhibit.
test("holds the prompt cursor on the exhibit that ends the turn", () => {
  const rules = { promptsPerTurn: 2 };
  let state: SerializableValue = initializeState({
    activeRoundTeamId: "team-1",
    rules
  });

  // Team 2 opens at (1 * 2 promptsPerTurn) % 3 prompts = 2, so a cursor that
  // ran on after the last stamp would land exactly on its first exhibit.
  assert.equal(
    initializeState({ activeRoundTeamId: "team-2", rules }).promptCursor,
    2
  );

  for (let promptIndex = 0; promptIndex < 2; promptIndex += 1) {
    state = reduce(state, "setGuess", { lat: 0, lng: 0 }, { rules }).state;
    state = reduce(state, "submitGuess", {}, { rules }).state;

    if (promptIndex === 0) {
      state = reduce(state, "nextPrompt", {}, { rules }).state;
    }
  }

  assert.equal((state as GeoRuntimeState).promptCursor, 1);
  assert.equal(reduce(state, "nextPrompt", {}, { rules }).didMutate, false);

  const displayView = geoRuntimePlugin.selectDisplayView({
    state,
    rules,
    content: geoContentFixture
  });

  assert.equal(
    displayView?.minigame === "GEO" ? displayView.currentPrompt?.id : null,
    "geo-2"
  );
});

test("actions outside their sub-state are silently dropped", () => {
  const guessingState = initializeState();

  assert.equal(reduce(guessingState, "submitGuess", {}).didMutate, false);
  assert.equal(reduce(guessingState, "nextPrompt", {}).didMutate, false);

  const placed = reduce(guessingState, "setGuess", { lat: 1, lng: 1 });
  const submitted = reduce(placed.state, "submitGuess", {});

  assert.equal(reduce(submitted.state, "setGuess", { lat: 2, lng: 2 }).didMutate, false);
  assert.equal(reduce(submitted.state, "submitGuess", {}).didMutate, false);
});

test("invalid payloads and unknown actions never mutate state", () => {
  const state = initializeState();

  assert.equal(reduce(state, "setGuess", { lat: 91, lng: 0 }).didMutate, false);
  assert.equal(reduce(state, "setGuess", { lat: 0, lng: 181 }).didMutate, false);
  assert.equal(reduce(state, "setGuess", { lat: "x", lng: 0 }).didMutate, false);
  assert.equal(reduce(state, "setGuess", { lat: 0 }).didMutate, false);
  assert.equal(reduce(state, "setGuess", null).didMutate, false);
  assert.equal(reduce(state, "unknownAction", {}).didMutate, false);
  assert.equal(reduce("not-a-geo-state", "setGuess", { lat: 0, lng: 0 }).didMutate, false);
});

test("actions are dropped when no content is available", () => {
  const state = initializeState({ content: null });

  assert.equal(reduce(state, "setGuess", { lat: 0, lng: 0 }, { content: null }).didMutate, false);

  const hostView = geoRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: null
  });

  assert.equal(hostView?.minigame, "GEO");
  assert.equal(
    hostView?.minigame === "GEO" ? hostView.currentPrompt : undefined,
    null
  );
});

test("display view never exposes answer coordinates while guessing", () => {
  const state = initializeState();
  const placed = reduce(state, "setGuess", { lat: 10, lng: 20 });

  for (const candidate of [state, placed.state]) {
    const displayView = geoRuntimePlugin.selectDisplayView({
      state: candidate,
      rules: null,
      content: geoContentFixture
    });

    assert.equal(displayView?.minigame, "GEO");

    const serializedView = JSON.stringify(displayView);

    assert.equal(serializedView.includes("answerLat"), false);
    assert.equal(serializedView.includes("answerLng"), false);
    assert.equal(serializedView.includes("48.85837"), false);
    assert.equal(serializedView.includes("2.294481"), false);
  }

  const hostView = geoRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: geoContentFixture
  });

  assert.equal(
    hostView?.minigame === "GEO" ? hostView.currentPrompt?.answerLat : null,
    48.85837
  );
});

// Map Theatre (DESIGN.md §2.4) puts the chart on the TV for the whole turn, so
// the room watches the pin land. The pin is the team's own input and carries no
// disclosure; the answer beside it would.
test("display view carries the team's in-progress pin but not the answer", () => {
  const state = initializeState();
  const placed = reduce(state, "setGuess", { lat: 10, lng: 20 });

  const openView = geoRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: geoContentFixture
  });

  assert.equal(
    openView?.minigame === "GEO" ? openView.currentGuess : undefined,
    null
  );

  const pinnedView = geoRuntimePlugin.selectDisplayView({
    state: placed.state,
    rules: null,
    content: geoContentFixture
  });

  assert.deepEqual(
    pinnedView?.minigame === "GEO" ? pinnedView.currentGuess : undefined,
    { lat: 10, lng: 20 }
  );
  assert.equal(
    pinnedView?.minigame === "GEO" ? pinnedView.status : undefined,
    "guessing"
  );
});

test("display view reveals the result only for the submitted prompt", () => {
  const state = initializeState();
  const placed = reduce(state, "setGuess", { lat: 48.8, lng: 2.3 });
  const submitted = reduce(placed.state, "submitGuess", {});

  const submittedView = geoRuntimePlugin.selectDisplayView({
    state: submitted.state,
    rules: null,
    content: geoContentFixture
  });

  assert.equal(submittedView?.minigame, "GEO");

  if (submittedView?.minigame === "GEO") {
    assert.equal(submittedView.status, "submitted");

    if (submittedView.status === "submitted") {
      assert.equal(submittedView.result.answerLat, 48.85837);
      assert.equal(submittedView.result.guessLat, 48.8);
    }
  }

  // After advancing, the next prompt's answer must not carry over.
  const advanced = reduce(submitted.state, "nextPrompt", {});
  const advancedView = geoRuntimePlugin.selectDisplayView({
    state: advanced.state,
    rules: null,
    content: geoContentFixture
  });

  assert.equal(
    advancedView?.minigame === "GEO" ? advancedView.status : null,
    "guessing"
  );
  assert.equal(JSON.stringify(advancedView).includes("answerLat"), false);
});

test("syncContent clamps the prompt cursor when the content shrinks", () => {
  const state = initializeState();
  let advanced: SerializableValue = reduce(state, "setGuess", { lat: 0, lng: 0 }).state;
  advanced = reduce(advanced, "submitGuess", {}).state;
  advanced = reduce(advanced, "nextPrompt", {}).state;

  assert.equal((advanced as GeoRuntimeState).promptCursor, 1);

  const shrunkenContent = { prompts: [geoContentFixture.prompts[0]] };
  const synced = geoRuntimePlugin.syncContent?.({
    state: advanced,
    rules: null,
    content: shrunkenContent
  });

  assert.equal((synced as GeoRuntimeState).promptCursor, 0);
});

test("syncPendingPoints replaces the pending points map", () => {
  const state = initializeState();
  const synced = geoRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-1": 7 }
  });

  assert.deepEqual((synced as GeoRuntimeState).pendingPointsByTeamId, {
    "team-1": 7
  });
});

test("selectors return null for foreign state shapes", () => {
  assert.equal(
    geoRuntimePlugin.selectHostView({ state: "junk", rules: null, content: null }),
    null
  );
  assert.equal(
    geoRuntimePlugin.selectDisplayView({ state: 42, rules: null, content: null }),
    null
  );
});

test("parseGeoContentFile rejects malformed content files", () => {
  assert.throws(() => parseGeoContentFile("not json", "geo.json"), /Failed to parse/);
  assert.throws(() => parseGeoContentFile("{}", "geo.json"), /Invalid geo content/);
  assert.throws(
    () => parseGeoContentFile(JSON.stringify({ prompts: [] }), "geo.json"),
    /Invalid geo content/
  );
  assert.throws(
    () =>
      parseGeoContentFile(
        JSON.stringify({
          prompts: [
            geoContentFixture.prompts[0],
            { ...geoContentFixture.prompts[1], id: "geo-1" }
          ]
        }),
        "geo.json"
      ),
    /Invalid geo content/
  );
  assert.throws(
    () =>
      parseGeoContentFile(
        JSON.stringify({
          prompts: [
            {
              ...geoContentFixture.prompts[0],
              answer: { lat: 91, lng: 0 }
            }
          ]
        }),
        "geo.json"
      ),
    /Invalid geo content/
  );

  const parsed = parseGeoContentFile(JSON.stringify(geoContentFixture), "geo.json");

  assert.equal(parsed.prompts.length, 3);
  assert.equal(parsed.prompts[0].id, "geo-1");
});

// --- Answers on the phones: every seated phone on the playing team drops its own pin. ---

const seated = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Caitlin" },
  { id: "player-3", name: "Dan" }
] as const;

const placePin = (
  state: SerializableValue,
  playerId: string,
  actionPayload: SerializableValue,
  answeringPlayers: readonly { id: string; name: string }[] = seated
): { state: SerializableValue; didMutate: boolean } => {
  const reducePlayerAction = geoRuntimePlugin.reducePlayerAction;

  assert.ok(reducePlayerAction !== undefined);

  return reducePlayerAction({
    state,
    envelope: { actionType: "placePin", actionPayload },
    pointsMax: 15,
    rules: null,
    content: geoContentFixture,
    playerId,
    answeringPlayers
  });
};

const lockIn = (state: SerializableValue): { state: SerializableValue; didMutate: boolean } => {
  return geoRuntimePlugin.reduceAction({
    state,
    envelope: { actionType: "submitGuess", actionPayload: {} },
    pointsMax: 15,
    rules: null,
    content: geoContentFixture,
    answeringPlayers: seated
  });
};

const playerViewOf = (state: SerializableValue, playerId: string, showOwnAnswer = true) => {
  return geoRuntimePlugin.selectPlayerView?.({
    state,
    rules: null,
    content: geoContentFixture,
    answeringPlayers: seated,
    playerId,
    showOwnAnswer
  });
};

test("does take only placePin from a phone when the plugin lists its player actions", () => {
  assert.deepEqual(geoRuntimePlugin.playerActionTypes, ["placePin"]);
  assert.equal(geoRuntimePlugin.transientActionTypes?.includes("placePin"), false);
});

test("does accept a pin when it comes from a seated phone on the playing team", () => {
  const placed = placePin(initializeState(), "player-2", { lat: 10, lng: 20 });

  assert.equal(placed.didMutate, true);
  assert.deepEqual((placed.state as GeoRuntimeState).phonePinsByPlayerId, { "player-2": { lat: 10, lng: 20 } });
  // The tablet's pin is a different pin: a phone never moves it.
  assert.equal((placed.state as GeoRuntimeState).currentGuess, null);
});

test("does refuse a pin when the sender is not among the seated phones", () => {
  const refused = placePin(initializeState(), "player-9", { lat: 10, lng: 20 });

  assert.equal(refused.didMutate, false);
});

test("does refuse a pin when it is malformed, off the map or not a pin", () => {
  const state = initializeState();

  assert.equal(placePin(state, "player-1", { lat: 91, lng: 0 }).didMutate, false);
  assert.equal(placePin(state, "player-1", { lat: "10", lng: 0 }).didMutate, false);
  assert.equal(placePin(state, "player-1", null).didMutate, false);

  const reducePlayerAction = geoRuntimePlugin.reducePlayerAction;

  assert.ok(reducePlayerAction !== undefined);
  assert.equal(
    reducePlayerAction({
      state,
      envelope: { actionType: "submitGuess", actionPayload: {} },
      pointsMax: 15,
      rules: null,
      content: geoContentFixture,
      playerId: "player-1",
      answeringPlayers: seated
    }).didMutate,
    false
  );
});

test("does let a phone move its pin when the photo is still open", () => {
  const first = placePin(initializeState(), "player-1", { lat: 10, lng: 20 });
  const moved = placePin(first.state, "player-1", { lat: 11, lng: 21 });
  const same = placePin(moved.state, "player-1", { lat: 11, lng: 21 });

  assert.equal(moved.didMutate, true);
  assert.deepEqual((moved.state as GeoRuntimeState).phonePinsByPlayerId["player-1"], { lat: 11, lng: 21 });
  assert.equal(same.didMutate, false);
});

test("does refuse a pin when the host has already locked the photo", () => {
  const pinned = placePin(initializeState(), "player-1", { lat: 48.8, lng: 2.3 });
  const locked = lockIn(pinned.state);

  assert.equal(locked.didMutate, true);
  assert.equal(placePin(locked.state, "player-2", { lat: 48.85, lng: 2.29 }).didMutate, false);
  assert.equal(placePin(locked.state, "player-1", { lat: 48.85, lng: 2.29 }).didMutate, false);
});

test("does score the team's best pin when the tablet and the phones are all in", () => {
  let state: SerializableValue = initializeState();

  // The tablet: ~1.5 km off (3 points). Alex: Paris centre, ~4 km (2 points). Caitlin: on it (5).
  state = reduce(state, "setGuess", { lat: 48.8584, lng: 2.3150 }).state;
  state = placePin(state, "player-1", { lat: 48.8566, lng: 2.3522 }).state;
  state = placePin(state, "player-2", { lat: 48.8584, lng: 2.2945 }).state;

  const locked = lockIn(state).state as GeoRuntimeState;
  const result = locked.lastResult;

  assert.ok(result !== null);
  assert.equal(result.pointsAwarded, 5);
  assert.equal(locked.pendingPointsByTeamId["team-1"], 5);
  assert.deepEqual(
    result.pins.map((pin) => [pin.playerId, pin.name, pin.pointsAwarded, pin.isBest]),
    [
      [null, null, 3, false],
      ["player-1", "Alex", 2, false],
      ["player-2", "Caitlin", 5, true]
    ]
  );
  // The headline guess is the best pin's.
  assert.equal(result.guessLat, 48.8584);
  assert.equal(result.guessLng, 2.2945);
});

test("does score the tablet's pin as one pin when it is the best one", () => {
  let state: SerializableValue = initializeState();

  state = reduce(state, "setGuess", { lat: 48.8584, lng: 2.2945 }).state;
  state = placePin(state, "player-3", { lat: 41.9, lng: 12.5 }).state;

  const result = (lockIn(state).state as GeoRuntimeState).lastResult;

  assert.ok(result !== null);
  assert.equal(result.pointsAwarded, 5);
  assert.deepEqual(
    result.pins.filter((pin) => pin.isBest).map((pin) => pin.playerId),
    [null]
  );
});

test("does lock in on the phones' pins alone when the tablet never pinned", () => {
  const pinned = placePin(initializeState(), "player-3", { lat: 48.8584, lng: 2.2945 });
  const locked = lockIn(pinned.state);

  assert.equal(locked.didMutate, true);
  assert.equal((locked.state as GeoRuntimeState).lastResult?.pointsAwarded, 5);
  // And with no pin anywhere there is nothing to lock.
  assert.equal(lockIn(initializeState()).didMutate, false);
});

test("does leave out a pin when its phone is no longer seated at the lock", () => {
  let state: SerializableValue = initializeState();

  state = placePin(state, "player-1", { lat: 48.8584, lng: 2.2945 }).state;
  state = placePin(state, "player-2", { lat: 41.9, lng: 12.5 }).state;

  const locked = geoRuntimePlugin.reduceAction({
    state,
    envelope: { actionType: "submitGuess", actionPayload: {} },
    pointsMax: 15,
    rules: null,
    content: geoContentFixture,
    // Alex let their face go before the host locked the photo.
    answeringPlayers: [seated[1], seated[2]]
  }).state as GeoRuntimeState;

  assert.deepEqual(locked.lastResult?.pins.map((pin) => pin.playerId), ["player-2"]);
  assert.equal(locked.lastResult?.pointsAwarded, 0);
});

test("does break a points tie on distance when two pins land in one band", () => {
  let state: SerializableValue = initializeState();

  // Both inside 10 km (2 points); Caitlin's is the closer.
  state = placePin(state, "player-1", { lat: 48.9, lng: 2.3 }).state;
  state = placePin(state, "player-2", { lat: 48.88, lng: 2.3 }).state;

  const pins = (lockIn(state).state as GeoRuntimeState).lastResult?.pins ?? [];

  assert.deepEqual(
    pins.map((pin) => [pin.playerId, pin.pointsAwarded, pin.isBest]),
    [
      ["player-1", 2, false],
      ["player-2", 2, true]
    ]
  );
});

test("does clear every phone's pin when the host moves to the next photo", () => {
  let state: SerializableValue = initializeState();

  state = placePin(state, "player-1", { lat: 48.8584, lng: 2.2945 }).state;
  state = lockIn(state).state;
  state = reduce(state, "nextPrompt", {}).state;

  assert.deepEqual((state as GeoRuntimeState).phonePinsByPlayerId, {});
  assert.equal(placePin(state, "player-1", { lat: 41.9, lng: 12.5 }).didMutate, true);
});

test("does keep the display view to a count when phones have pinned an open photo", () => {
  let state: SerializableValue = initializeState();

  state = placePin(state, "player-1", { lat: 12.3456, lng: 65.4321 }).state;
  state = placePin(state, "player-3", { lat: -33.33, lng: 151.15 }).state;

  const displayView = geoRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: geoContentFixture,
    answeringPlayers: seated
  });
  const serialized = JSON.stringify(displayView);

  assert.deepEqual(displayView?.minigame === "GEO" ? displayView.phoneAnswers : undefined, {
    answeredCount: 2,
    seatedCount: 3
  });
  // No coordinate, no player id, no name: only how many are in.
  assert.equal(serialized.includes("12.3456"), false);
  assert.equal(serialized.includes("65.4321"), false);
  assert.equal(serialized.includes("151.15"), false);
  assert.equal(serialized.includes("player-"), false);
  assert.equal(serialized.includes("Alex"), false);
});

test("does show the host how many have pinned but never where or who when the photo is open", () => {
  let state: SerializableValue = initializeState();

  state = placePin(state, "player-2", { lat: 12.3456, lng: 65.4321 }).state;

  const hostView = geoRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: geoContentFixture,
    answeringPlayers: seated
  });

  assert.deepEqual(hostView?.minigame === "GEO" ? hostView.phoneAnswers : undefined, {
    answeredCount: 1,
    seatedCount: 3
  });
  // A count on the tablet too: never where, and never who.
  assert.equal(JSON.stringify(hostView).includes("12.3456"), false);
  assert.equal(JSON.stringify(hostView?.minigame === "GEO" ? hostView.phoneAnswers : null).includes("player-"), false);
});

test("does leave the tally off the views when the playing team has no phones", () => {
  const displayView = geoRuntimePlugin.selectDisplayView({
    state: initializeState(),
    rules: null,
    content: geoContentFixture
  });

  assert.equal(displayView?.minigame === "GEO" ? displayView.phoneAnswers : undefined, null);
});

test("does plot every pin by name on the display view when the host reveals the photo", () => {
  let state: SerializableValue = initializeState();

  state = reduce(state, "setGuess", { lat: 48.8584, lng: 2.3150 }).state;
  state = placePin(state, "player-1", { lat: 48.8584, lng: 2.2945 }).state;
  state = lockIn(state).state;

  const displayView = geoRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: geoContentFixture,
    answeringPlayers: seated
  });

  assert.ok(displayView?.minigame === "GEO" && displayView.status === "submitted");
  assert.deepEqual(
    displayView.result.pins.map((pin) => [pin.name, pin.isBest]),
    [
      [null, false],
      ["Alex", true]
    ]
  );
  assert.equal(displayView.phoneAnswers, null);
  // The TV plots pins by name: ids stay off it.
  assert.equal(JSON.stringify(displayView).includes("player-1"), false);
});

test("does show each phone only its own pin when two phones have pinned", () => {
  let state: SerializableValue = initializeState();

  state = placePin(state, "player-1", { lat: 12.3456, lng: 65.4321 }).state;
  state = placePin(state, "player-2", { lat: -33.33, lng: 151.15 }).state;

  const alexView = playerViewOf(state, "player-1");
  const danView = playerViewOf(state, "player-3");

  assert.deepEqual(alexView?.minigame === "GEO" ? alexView.pin : undefined, { lat: 12.3456, lng: 65.4321 });
  assert.equal(JSON.stringify(alexView).includes("151.15"), false);
  assert.equal(danView?.minigame === "GEO" ? danView.pin : undefined, null);
  assert.equal(JSON.stringify(danView).includes("12.3456"), false);
  assert.equal(JSON.stringify(danView).includes("151.15"), false);
  // Never the answer.
  assert.equal(JSON.stringify(alexView).includes("48.85837"), false);
  assert.equal(alexView?.status, "open");
});

test("does hide a phone's pin from its card when the face has a new holder", () => {
  const state = placePin(initializeState(), "player-1", { lat: 12.3456, lng: 65.4321 }).state;
  const view = playerViewOf(state, "player-1", false);

  assert.equal(view?.minigame === "GEO" ? view.pin : undefined, null);
});

test("does tell a phone how its own pin measured when the photo is locked", () => {
  let state: SerializableValue = initializeState();

  state = placePin(state, "player-1", { lat: 48.8584, lng: 2.2945 }).state;
  state = lockIn(state).state;

  const view = playerViewOf(state, "player-1");

  assert.ok(view?.minigame === "GEO");
  assert.equal(view.status, "locked");
  assert.equal(view.result?.pointsAwarded, 5);
  assert.equal(view.result?.isBest, true);
});

test("does drop a phone's open pin when its claim ends and keep a locked one", () => {
  const releasePlayerAnswer = geoRuntimePlugin.releasePlayerAnswer;

  assert.ok(releasePlayerAnswer !== undefined);

  const pinned = placePin(initializeState(), "player-1", { lat: 48.8584, lng: 2.2945 }).state;
  const released = releasePlayerAnswer({ state: pinned, playerId: "player-1" });

  assert.equal(released.didMutate, true);
  assert.deepEqual((released.state as GeoRuntimeState).phonePinsByPlayerId, {});
  assert.equal(releasePlayerAnswer({ state: released.state, playerId: "player-1" }).didMutate, false);

  const locked = lockIn(pinned).state;

  assert.equal(releasePlayerAnswer({ state: locked, playerId: "player-1" }).didMutate, false);
});

test("does leave the state untouched when a phone pins", () => {
  const state = initializeState();
  const before = structuredClone(state);

  placePin(state, "player-1", { lat: 10, lng: 20 });

  assert.deepEqual(state, before);
});

test("does count only awake or pinned phones in the tally when a phone is asleep", () => {
  const state = placePin(initializeState(), "player-1", { lat: 10, lng: 20 }).state;
  const displayView = geoRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: geoContentFixture,
    answeringPlayers: [seated[0], { ...seated[1], isConnected: false }, seated[2]]
  });

  assert.deepEqual(displayView?.minigame === "GEO" ? displayView.phoneAnswers : undefined, {
    answeredCount: 1,
    seatedCount: 2
  });
});
