import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type RecreateMinigameHostView, type RoomState } from "@wingnight/shared";

import {
  createRecreateGenerationRunner,
  GENERATOR_UNAVAILABLE_REASON,
  type RecreateGenerationResult
} from "./index.js";

const createHostView = (
  overrides: Partial<RecreateMinigameHostView> = {}
): RecreateMinigameHostView => {
  return {
    minigame: "RECREATE",
    activeTurnTeamId: "team-1",
    pendingPointsByTeamId: {},
    subState: "judging",
    targetsPerTurn: 1,
    targetsCompletedThisTurn: 0,
    pointsPerIngredient: 1,
    liveGeneration: true,
    currentTarget: {
      id: "cottage",
      title: "Cottage",
      targetImageSrc: "recreate/targets/cottage.png",
      sourceImageSrc: "geo/cottage.jpg"
    },
    attempt: {
      attemptId: "cottage:team-1:1",
      prompt: "underwater",
      status: "generating",
      imageSrc: null,
      failureReason: null
    },
    checklist: null,
    lastPointsAwarded: null,
    ...overrides
  };
};

const createRoomState = (
  minigameHostView: RoomState["minigameHostView"],
  phase: Phase = Phase.MINIGAME_PLAY
): RoomState => {
  return { phase, minigameHostView } as RoomState;
};

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

test("starts one generation per attempt and applies the image when it lands", async () => {
  const calls: string[] = [];
  const results: RecreateGenerationResult[] = [];
  let resolveGeneration: (imageSrc: string) => void = () => {};
  const runner = createRecreateGenerationRunner({
    generateAttempt: (input) => {
      calls.push(`${input.attemptId}|${input.prompt}|${input.sourceImageSrc}`);
      return new Promise((resolve) => {
        resolveGeneration = resolve;
      });
    },
    applyResult: (result) => {
      results.push(result);
    }
  });
  const roomState = createRoomState(createHostView());

  runner.reconcile(roomState);
  runner.reconcile(roomState);

  assert.deepEqual(calls, ["cottage:team-1:1|underwater|geo/cottage.jpg"]);
  assert.deepEqual(results, []);

  resolveGeneration("recreate/attempts/cottage-team-1-1.png");
  await flush();

  assert.deepEqual(results, [
    {
      attemptId: "cottage:team-1:1",
      imageSrc: "recreate/attempts/cottage-team-1-1.png",
      failureReason: null
    }
  ]);
});

test("reports a failed generation with the error's message", async () => {
  const results: RecreateGenerationResult[] = [];
  const errors: string[] = [];
  const runner = createRecreateGenerationRunner({
    generateAttempt: () => Promise.reject(new Error("Gemini 429: quota")),
    applyResult: (result) => {
      results.push(result);
    },
    onError: (attemptId, error) => {
      errors.push(`${attemptId}:${error instanceof Error ? error.message : "?"}`);
    }
  });

  runner.reconcile(createRoomState(createHostView()));
  await flush();

  assert.deepEqual(results, [
    { attemptId: "cottage:team-1:1", imageSrc: null, failureReason: "Gemini 429: quota" }
  ]);
  assert.deepEqual(errors, ["cottage:team-1:1:Gemini 429: quota"]);
});

test("fails an attempt immediately when no generator is configured", () => {
  const results: RecreateGenerationResult[] = [];
  const runner = createRecreateGenerationRunner({
    generateAttempt: null,
    applyResult: (result) => {
      results.push(result);
    }
  });

  runner.reconcile(createRoomState(createHostView()));

  assert.deepEqual(results, [
    { attemptId: "cottage:team-1:1", imageSrc: null, failureReason: GENERATOR_UNAVAILABLE_REASON }
  ]);
});

test("replays a settled result when an undo restores the generating attempt", async () => {
  let generationCount = 0;
  const results: RecreateGenerationResult[] = [];
  const runner = createRecreateGenerationRunner({
    generateAttempt: () => {
      generationCount += 1;
      return Promise.resolve("recreate/attempts/a.png");
    },
    applyResult: (result) => {
      results.push(result);
    }
  });
  const roomState = createRoomState(createHostView());

  runner.reconcile(roomState);
  await flush();
  runner.reconcile(roomState);

  assert.equal(generationCount, 1);
  assert.equal(results.length, 2);
  assert.equal(results[1]?.imageSrc, "recreate/attempts/a.png");
});

test("does nothing outside RECREATE play with a generating attempt", () => {
  let generationCount = 0;
  const runner = createRecreateGenerationRunner({
    generateAttempt: () => {
      generationCount += 1;
      return Promise.resolve("x.png");
    },
    applyResult: () => {}
  });

  runner.reconcile(createRoomState(null));
  runner.reconcile(createRoomState(createHostView(), Phase.TURN_RESULTS));
  runner.reconcile(
    createRoomState(
      createHostView({
        attempt: {
          attemptId: "cottage:team-1:1",
          prompt: "underwater",
          status: "ready",
          imageSrc: "done.png",
          failureReason: null
        }
      })
    )
  );
  runner.reconcile(
    createRoomState({
      minigame: "TRIVIA",
      activeTurnTeamId: null,
      attemptsRemaining: 1,
      promptCursor: 0,
      pendingPointsByTeamId: {},
      currentPrompt: null
    })
  );

  assert.equal(generationCount, 0);
});
