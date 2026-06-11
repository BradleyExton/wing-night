import assert from "node:assert/strict";
import test from "node:test";

import { MINIGAME_API_VERSION, type GeoContentFile } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { geoMinigameId, geoMinigameMetadata, geoRuntimePlugin } from "./index.js";
import { parseGeoContentFile } from "./content/index.js";
import { resolveGeoRules } from "./rules/index.js";
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
    activeRoundTeamId: string | null;
    pointsMax: number;
    pendingPointsByTeamId: Record<string, number>;
    rules: SerializableValue | null;
    content: SerializableValue | null;
  }> = {}
): GeoRuntimeState => {
  const state = geoRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
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

test("geo runtime metadata advertises expected API version", () => {
  assert.equal(geoMinigameId, "GEO");
  assert.equal(geoMinigameMetadata.minigameApiVersion, MINIGAME_API_VERSION);
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
