import assert from "node:assert/strict";
import test from "node:test";

import type {
  RecreateContentFile,
  RecreateMinigameDisplayView,
  RecreateMinigameHostView
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  recreateMinigameId,
  recreateRuntimePlugin,
  resolveRecreateAttemptId,
  type RecreateRuntimeState
} from "./index.js";
import { parseRecreateContentFile } from "./content/index.js";
import { isRecreateRules, resolveRecreateRules } from "./rules/index.js";

const contentFixture: RecreateContentFile = {
  prompts: [
    {
      id: "target-1",
      title: "Cottage",
      targetImageSrc: "recreate/targets/target-1.png",
      sourceImageSrc: "geo/cottage.jpg",
      prompt: "Everyone underwater with a neon sign",
      ingredients: ["Underwater", "Neon sign", "Scuba gear"]
    },
    {
      id: "target-2",
      title: "Diner",
      targetImageSrc: "/sample-assets/recreate/diner-noir.svg",
      prompt: "Film noir diner in the rain",
      ingredients: ["Black and white", "Rain"]
    }
  ]
};

type InitializeOverrides = Partial<{
  teamIds: string[];
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
}>;

const initializeState = (overrides: InitializeOverrides = {}): RecreateRuntimeState => {
  const state = recreateRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    // This game never looks at the roster; JOUST is the one that does.
    players: [],
    teams: [],
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined ? "team-1" : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules:
      overrides.rules === undefined
        ? { targetsPerTurn: 2, pointsPerIngredient: 1, liveGeneration: true }
        : overrides.rules,
    content: overrides.content === undefined ? contentFixture : overrides.content
  });

  assert.notEqual(state, null);
  return state as RecreateRuntimeState;
};

const dispatch = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {},
  pointsMax = 15
): { state: RecreateRuntimeState; didMutate: boolean } => {
  const result = recreateRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload, receivedAtMs: 1_700_000_000_000 },
    pointsMax,
    rules: null,
    content: contentFixture
  });

  return { state: result.state as RecreateRuntimeState, didMutate: result.didMutate };
};

const hostView = (state: SerializableValue): RecreateMinigameHostView => {
  const view = recreateRuntimePlugin.selectHostView({
    state,
    rules: null,
    content: contentFixture
  });
  assert.equal(view?.minigame, "RECREATE");
  return view as RecreateMinigameHostView;
};

const displayView = (state: SerializableValue): RecreateMinigameDisplayView => {
  const view = recreateRuntimePlugin.selectDisplayView({
    state,
    rules: null,
    content: contentFixture
  });
  assert.equal(view?.minigame, "RECREATE");
  return view as RecreateMinigameDisplayView;
};

const submittedState = (overrides: InitializeOverrides = {}): RecreateRuntimeState => {
  return dispatch(initializeState(overrides), "submitPrompt", {
    prompt: "  Put them underwater next to a neon sign  "
  }).state;
};

test("initializes the active team in writing with its cursor seeded by turn order", () => {
  assert.equal(recreateMinigameId, "RECREATE");

  const state = initializeState({ activeRoundTeamId: "team-2" });

  assert.deepEqual(state.turnOrderTeamIds, ["team-2"]);
  assert.equal(state.subState, "writing");
  assert.equal(state.attempt, null);
  // Second team, two targets a turn, two prompts: (1 * 2) % 2.
  assert.equal(state.promptCursor, 0);
  assert.equal(state.targetsPerTurn, 2);
  assert.equal(state.liveGeneration, true);
});

test("hides the checklist from both views while the team is writing", () => {
  const state = initializeState();
  const host = hostView(state);
  const display = displayView(state);

  assert.equal(host.checklist, null);
  assert.equal(host.currentTarget?.title, "Cottage");
  assert.equal(display.ingredients, null);
  assert.equal(display.authoredPrompt, null);

  const serializedDisplay = JSON.stringify(display);
  assert.equal(serializedDisplay.includes("Neon sign"), false);
  assert.equal(serializedDisplay.includes("Everyone underwater"), false);
});

test("submitting a prompt opens judging with a generating attempt when live generation is on", () => {
  const state = submittedState();

  assert.equal(state.subState, "judging");
  assert.equal(state.attempt?.status, "generating");
  assert.equal(state.attempt?.prompt, "Put them underwater next to a neon sign");
  assert.equal(state.attempt?.attemptId, resolveRecreateAttemptId("target-1", "team-1", 1));

  const display = displayView(state);
  assert.deepEqual(display.ingredients, ["Underwater", "Neon sign", "Scuba gear"]);
  assert.equal(display.attempt?.prompt, "Put them underwater next to a neon sign");
  // The authored prompt stays sealed until the score is locked.
  assert.equal(display.authoredPrompt, null);
  assert.equal(hostView(state).checklist?.authoredPrompt, "Everyone underwater with a neon sign");
});

test("submitting a prompt skips generation when the rules turn it off", () => {
  const state = submittedState({
    rules: { targetsPerTurn: 1, liveGeneration: false }
  });

  assert.equal(state.subState, "judging");
  assert.equal(state.attempt?.status, "skipped");
});

test("rejects a blank, oversized or out-of-turn prompt", () => {
  const writing = initializeState();

  assert.equal(dispatch(writing, "submitPrompt", { prompt: "   " }).didMutate, false);
  assert.equal(
    dispatch(writing, "submitPrompt", { prompt: "x".repeat(401) }).didMutate,
    false
  );
  assert.equal(dispatch(writing, "submitPrompt", { prompt: 42 }).didMutate, false);

  const judging = submittedState();
  assert.equal(dispatch(judging, "submitPrompt", { prompt: "again" }).didMutate, false);
});

test("resolves the generating attempt to ready with its image or to failed with a reason", () => {
  const judging = submittedState();
  const attemptId = judging.attempt?.attemptId ?? "";

  const ready = dispatch(judging, "resolveGeneration", {
    attemptId,
    imageSrc: "recreate/attempts/a.png",
    failureReason: null
  }).state;
  assert.equal(ready.attempt?.status, "ready");
  assert.equal(ready.attempt?.imageSrc, "recreate/attempts/a.png");

  const failed = dispatch(judging, "resolveGeneration", {
    attemptId,
    imageSrc: null,
    failureReason: "Gemini 429"
  }).state;
  assert.equal(failed.attempt?.status, "failed");
  assert.equal(failed.attempt?.failureReason, "Gemini 429");
});

test("ignores a generation result for a stale or already settled attempt", () => {
  const judging = submittedState();
  const attemptId = judging.attempt?.attemptId ?? "";

  assert.equal(
    dispatch(judging, "resolveGeneration", {
      attemptId: "target-1:team-1:99",
      imageSrc: "x.png",
      failureReason: null
    }).didMutate,
    false
  );

  const ready = dispatch(judging, "resolveGeneration", {
    attemptId,
    imageSrc: "x.png",
    failureReason: null
  }).state;
  assert.equal(
    dispatch(ready, "resolveGeneration", { attemptId, imageSrc: null, failureReason: "late" })
      .didMutate,
    false
  );
});

test("toggles ingredients only while judging and only within the rubric", () => {
  const judging = submittedState();

  const one = dispatch(judging, "toggleIngredient", { ingredientIndex: 2 }).state;
  const two = dispatch(one, "toggleIngredient", { ingredientIndex: 0 }).state;
  assert.deepEqual(two.checkedIngredientIndexes, [0, 2]);
  assert.deepEqual(displayView(two).checkedIngredientIndexes, [0, 2]);

  const untoggled = dispatch(two, "toggleIngredient", { ingredientIndex: 2 }).state;
  assert.deepEqual(untoggled.checkedIngredientIndexes, [0]);

  assert.equal(dispatch(two, "toggleIngredient", { ingredientIndex: 3 }).didMutate, false);
  assert.equal(
    dispatch(initializeState(), "toggleIngredient", { ingredientIndex: 0 }).didMutate,
    false
  );
});

test("locking the score awards a point per ticked ingredient, capped at pointsMax", () => {
  const judging = submittedState({ pendingPointsByTeamId: { "team-1": 13 } });
  const ticked = dispatch(
    dispatch(judging, "toggleIngredient", { ingredientIndex: 0 }).state,
    "toggleIngredient",
    { ingredientIndex: 1 }
  ).state;

  const scored = dispatch(ticked, "lockScore", {}, 14).state;

  assert.equal(scored.subState, "scored");
  assert.equal(scored.pendingPointsByTeamId["team-1"], 14);
  assert.equal(scored.lastPointsAwarded, 1);
  assert.equal(scored.targetsCompletedThisTurn, 1);
  assert.equal(displayView(scored).authoredPrompt, "Everyone underwater with a neon sign");
  assert.equal(hostView(scored).pendingPointsByTeamId["team-1"], 14);
});

test("locking the score multiplies by pointsPerIngredient", () => {
  const judging = submittedState({
    rules: { targetsPerTurn: 1, pointsPerIngredient: 3, liveGeneration: false }
  });
  const ticked = dispatch(judging, "toggleIngredient", { ingredientIndex: 1 }).state;
  const scored = dispatch(ticked, "lockScore").state;

  assert.equal(scored.pendingPointsByTeamId["team-1"], 3);
  assert.equal(scored.lastPointsAwarded, 3);
});

test("retrying a prompt returns to writing with the attempt and ticks discarded", () => {
  const judging = submittedState();
  const ticked = dispatch(judging, "toggleIngredient", { ingredientIndex: 0 }).state;

  const writing = dispatch(ticked, "retryPrompt").state;

  assert.equal(writing.subState, "writing");
  assert.equal(writing.attempt, null);
  assert.deepEqual(writing.checkedIngredientIndexes, []);
  assert.equal(hostView(writing).checklist, null);

  // The second submission gets a fresh id, so the abandoned result is stale.
  const resubmitted = dispatch(writing, "submitPrompt", { prompt: "take two" }).state;
  assert.equal(resubmitted.attempt?.attemptId, resolveRecreateAttemptId("target-1", "team-1", 2));
});

test("advances to the next target until the turn's targets are spent", () => {
  const scored = dispatch(submittedState(), "lockScore").state;

  const second = dispatch(scored, "nextTarget").state;
  assert.equal(second.subState, "writing");
  assert.equal(second.promptCursor, 1);
  assert.equal(hostView(second).currentTarget?.title, "Diner");

  const secondScored = dispatch(
    dispatch(second, "submitPrompt", { prompt: "noir" }).state,
    "lockScore"
  ).state;
  assert.equal(secondScored.targetsCompletedThisTurn, 2);
  assert.equal(dispatch(secondScored, "nextTarget").didMutate, false);
  assert.equal(dispatch(submittedState(), "nextTarget").didMutate, false);
});

test("rejects unknown actions and malformed state without mutating", () => {
  const state = initializeState();

  assert.equal(dispatch(state, "somethingElse").didMutate, false);
  assert.equal(dispatch({ nope: true }, "lockScore").didMutate, false);
  assert.equal(
    recreateRuntimePlugin.selectHostView({ state: null, rules: null, content: contentFixture }),
    null
  );
});

test("syncs pending points and wraps the cursor when content shrinks", () => {
  const state = dispatch(initializeState(), "nextTarget").state;
  const synced = recreateRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-1": 4 }
  }) as RecreateRuntimeState;
  assert.equal(synced.pendingPointsByTeamId["team-1"], 4);

  const wrapped = recreateRuntimePlugin.syncContent?.({
    state: { ...state, promptCursor: 5 },
    rules: null,
    content: contentFixture
  }) as RecreateRuntimeState;
  assert.equal(wrapped.promptCursor, 1);
});

test("parses a content file strictly and resolves rules with defaults", () => {
  const parsed = parseRecreateContentFile(JSON.stringify(contentFixture), "recreate.json");
  assert.equal(parsed.prompts.length, 2);
  assert.equal(parsed.prompts[1]?.sourceImageSrc, undefined);

  assert.throws(
    () => parseRecreateContentFile(JSON.stringify({ prompts: [{ id: "x" }] }), "recreate.json"),
    /Invalid recreate content/
  );

  assert.deepEqual(resolveRecreateRules(null), {
    targetsPerTurn: 1,
    pointsPerIngredient: 1,
    liveGeneration: true
  });
  assert.deepEqual(resolveRecreateRules({ liveGeneration: false }), {
    targetsPerTurn: 1,
    pointsPerIngredient: 1,
    liveGeneration: false
  });

  assert.equal(isRecreateRules({}), true);
  assert.equal(isRecreateRules({ targetsPerTurn: 2, liveGeneration: false }), true);
  assert.equal(isRecreateRules({ targetsPerTurn: 0 }), false);
  assert.equal(isRecreateRules({ liveGeneration: "yes" }), false);
  assert.equal(isRecreateRules(null), false);
});
