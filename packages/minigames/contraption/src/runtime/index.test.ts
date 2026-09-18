import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type {
  ContraptionContentFile,
  ContraptionLevel,
  ContraptionMinigameDisplayView,
  ContraptionMinigameHostView
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import { CONTRAPTION_DEV_CONTENT } from "../dev/index.js";
import { contraptionMinigameId, contraptionRuntimePlugin } from "./index.js";
import { parseContraptionContentFile } from "./content/index.js";
import { toPieceSegment } from "./geometry/index.js";
import { gradeAttempt, simulateLevel } from "./grading/index.js";
import { isContraptionRules, resolveContraptionRules } from "./rules/index.js";
import {
  DEFAULT_CONTRAPTION_ATTEMPTS_PER_TURN,
  WING_RADIUS,
  type ContraptionRuntimeState
} from "./types/index.js";

const SOLVED_LEVEL: ContraptionLevel = {
  id: "over-the-shoulder",
  title: "Over the Shoulder",
  wing: { x: 8, y: 14, velocity: { x: 34, y: -26 } },
  bucket: { x: 68, width: 16, height: 14 },
  pickups: [
    { id: "mid-air", x: 50, y: 65, points: 2 },
    { id: "high-and-wide", x: 40, y: 30, points: 3 }
  ],
  pieceBudget: 2,
  pointsLanded: 5,
  solution: [
    { kind: "slope-right", column: 3, row: 6 },
    { kind: "slope-right", column: 5, row: 7 }
  ]
};

const SECOND_LEVEL: ContraptionLevel = {
  ...SOLVED_LEVEL,
  id: "second",
  title: "Second",
  pointsLanded: 4
};

const contentFixture: ContraptionContentFile = {
  prompts: [SOLVED_LEVEL, SECOND_LEVEL]
};

type InitializeOverrides = Partial<{
  teamIds: string[];
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
}>;

const initialize = (overrides: InitializeOverrides = {}): SerializableValue | null => {
  return contraptionRuntimePlugin.initialize({
    teamIds: overrides.teamIds ?? ["team-1", "team-2"],
    activeRoundTeamId:
      overrides.activeRoundTeamId === undefined ? "team-1" : overrides.activeRoundTeamId,
    pointsMax: overrides.pointsMax ?? 15,
    pendingPointsByTeamId: overrides.pendingPointsByTeamId ?? {},
    rules: overrides.rules === undefined ? { attemptsPerTurn: 2 } : overrides.rules,
    content: overrides.content === undefined ? contentFixture : overrides.content
  });
};

const initializeState = (overrides: InitializeOverrides = {}): ContraptionRuntimeState => {
  const state = initialize(overrides);

  assert.notEqual(state, null);
  return state as ContraptionRuntimeState;
};

const reduce = (
  state: SerializableValue,
  actionType: string,
  actionPayload: SerializableValue = {},
  options: Partial<{ pointsMax: number; content: SerializableValue | null }> = {}
): { state: SerializableValue; didMutate: boolean } => {
  return contraptionRuntimePlugin.reduceAction({
    state,
    envelope: { actionType, actionPayload },
    pointsMax: options.pointsMax ?? 15,
    rules: { attemptsPerTurn: 2 },
    content: options.content === undefined ? contentFixture : options.content
  });
};

const placeSolution = (state: SerializableValue): SerializableValue => {
  return SOLVED_LEVEL.solution.reduce<SerializableValue>((current, piece) => {
    return reduce(current, "placePiece", piece).state;
  }, state);
};

const hostViewOf = (state: SerializableValue): ContraptionMinigameHostView => {
  const view = contraptionRuntimePlugin.selectHostView({
    state,
    rules: { attemptsPerTurn: 2 },
    content: contentFixture
  });

  assert.notEqual(view, null);
  assert.equal(view?.minigame, "CONTRAPTION");
  return view as ContraptionMinigameHostView;
};

const displayViewOf = (state: SerializableValue): ContraptionMinigameDisplayView => {
  const view = contraptionRuntimePlugin.selectDisplayView({
    state,
    rules: { attemptsPerTurn: 2 },
    content: contentFixture
  });

  assert.notEqual(view, null);
  assert.equal(view?.minigame, "CONTRAPTION");
  return view as ContraptionMinigameDisplayView;
};

test("registers under the CONTRAPTION minigame id", () => {
  assert.equal(contraptionMinigameId, "CONTRAPTION");
  assert.equal(contraptionRuntimePlugin.id, "CONTRAPTION");
});

test("starts every team on the first level with an empty field and no attempts spent", () => {
  const state = initializeState();

  assert.equal(state.levelId, "over-the-shoulder");
  assert.equal(state.phase, "building");
  assert.deepEqual(state.pieces, []);
  assert.equal(state.attemptsUsed, 0);
  assert.equal(state.attemptsPerTurn, 2);
  assert.equal(initializeState({ activeRoundTeamId: "team-2" }).levelId, "over-the-shoulder");
});

test("plays the pinned level when the rules name one the pack has", () => {
  assert.equal(
    initializeState({ rules: { attemptsPerTurn: 2, levelId: "second" } }).levelId,
    "second"
  );
  assert.equal(
    initializeState({ rules: { attemptsPerTurn: 2, levelId: "nope" } }).levelId,
    "over-the-shoulder"
  );
});

test("returns null when the pack has no levels", () => {
  assert.equal(initialize({ content: { prompts: [] } }), null);
  assert.equal(initialize({ content: null }), null);
});

test("falls back to the default attempt count when rules are absent or malformed", () => {
  assert.equal(initializeState({ rules: null }).attemptsPerTurn, DEFAULT_CONTRAPTION_ATTEMPTS_PER_TURN);
  assert.equal(
    initializeState({ rules: { attemptsPerTurn: "three" } }).attemptsPerTurn,
    DEFAULT_CONTRAPTION_ATTEMPTS_PER_TURN
  );
});

test("validates the rules block at config-load time", () => {
  assert.equal(isContraptionRules({}), true);
  assert.equal(isContraptionRules({ attemptsPerTurn: 3, levelId: "boomerang" }), true);
  assert.equal(isContraptionRules({ attemptsPerTurn: 0 }), false);
  assert.equal(isContraptionRules({ levelId: "" }), false);
  assert.equal(isContraptionRules([]), false);
  assert.deepEqual(resolveContraptionRules({ attemptsPerTurn: 3 }), {
    attemptsPerTurn: 3,
    levelId: null
  });
});

test("places pieces on free cells until the level's budget is spent", () => {
  const state = initializeState();
  const one = reduce(state, "placePiece", { kind: "shelf", column: 1, row: 1 });
  const two = reduce(one.state, "placePiece", { kind: "shelf", column: 2, row: 1 });
  const three = reduce(two.state, "placePiece", { kind: "shelf", column: 3, row: 1 });

  assert.equal(one.didMutate, true);
  assert.equal(two.didMutate, true);
  assert.equal(three.didMutate, false);
  assert.equal((two.state as ContraptionRuntimeState).pieces.length, 2);
});

test("swaps the piece kind when a taken cell is tapped with a different kind", () => {
  const state = initializeState();
  const placed = reduce(state, "placePiece", { kind: "shelf", column: 1, row: 1 }).state;
  const swapped = reduce(placed, "placePiece", { kind: "steep-left", column: 1, row: 1 });
  const same = reduce(swapped.state, "placePiece", { kind: "steep-left", column: 1, row: 1 });

  assert.equal(swapped.didMutate, true);
  assert.deepEqual((swapped.state as ContraptionRuntimeState).pieces, [
    { kind: "steep-left", column: 1, row: 1 }
  ]);
  assert.equal(same.didMutate, false);
});

test("removes and clears pieces while building and ignores an empty cell", () => {
  const state = initializeState();
  const placed = reduce(state, "placePiece", { kind: "shelf", column: 1, row: 1 }).state;
  const missed = reduce(placed, "removePiece", { column: 5, row: 5 });
  const removed = reduce(placed, "removePiece", { column: 1, row: 1 });
  const cleared = reduce(placed, "clearPieces");

  assert.equal(missed.didMutate, false);
  assert.deepEqual((removed.state as ContraptionRuntimeState).pieces, []);
  assert.deepEqual((cleared.state as ContraptionRuntimeState).pieces, []);
  assert.equal(reduce(state, "clearPieces").didMutate, false);
});

test("ignores malformed or off-grid piece payloads", () => {
  const state = initializeState();

  assert.equal(reduce(state, "placePiece", { kind: "trampoline", column: 1, row: 1 }).didMutate, false);
  assert.equal(reduce(state, "placePiece", { kind: "shelf", column: 10, row: 1 }).didMutate, false);
  assert.equal(reduce(state, "placePiece", { kind: "shelf", column: 1.5, row: 1 }).didMutate, false);
  assert.equal(reduce(state, "placePiece", null).didMutate, false);
  assert.equal(reduce(state, "removePiece", { column: -1, row: 0 }).didMutate, false);
});

test("simulates on GO and banks the landing plus the pickup it passed through", () => {
  const built = placeSolution(initializeState());
  const ran = reduce(built, "runContraption");
  const state = ran.state as ContraptionRuntimeState;

  assert.equal(ran.didMutate, true);
  assert.equal(state.phase, "ran");
  assert.equal(state.attemptsUsed, 1);
  assert.equal(state.run?.attemptNumber, 1);
  assert.equal(state.run?.outcome, "landed");
  assert.deepEqual(state.run?.collectedPickupIds, ["mid-air"]);
  assert.equal(state.run?.points, 7);
  assert.equal(state.bestPoints, 7);
  assert.equal(state.pendingPointsByTeamId["team-1"], 7);
});

test("keeps the best attempt rather than summing attempts", () => {
  const first = reduce(placeSolution(initializeState()), "runContraption").state;
  const rebuilding = reduce(first, "nextAttempt").state;
  const emptied = reduce(rebuilding, "clearPieces").state;
  const second = reduce(emptied, "runContraption").state as ContraptionRuntimeState;

  assert.equal(second.run?.outcome, "short");
  assert.equal(second.run?.points, 0);
  assert.equal(second.bestPoints, 7);
  assert.equal(second.pendingPointsByTeamId["team-1"], 7);
});

test("adds the best run on top of the points the team already had, capped at pointsMax", () => {
  const state = initializeState({ pendingPointsByTeamId: { "team-1": 10, "team-2": 4 } });
  const ran = reduce(placeSolution(state), "runContraption", {}, { pointsMax: 15 })
    .state as ContraptionRuntimeState;

  assert.equal(ran.pendingPointsByTeamId["team-1"], 15);
  assert.equal(ran.pendingPointsByTeamId["team-2"], 4);
});

test("refuses to build or run outside the building phase", () => {
  const ran = reduce(placeSolution(initializeState()), "runContraption").state;

  assert.equal(reduce(ran, "placePiece", { kind: "shelf", column: 9, row: 0 }).didMutate, false);
  assert.equal(reduce(ran, "removePiece", { column: 3, row: 6 }).didMutate, false);
  assert.equal(reduce(ran, "clearPieces").didMutate, false);
  assert.equal(reduce(ran, "runContraption").didMutate, false);
});

test("returns to building with the pieces intact while attempts remain, then finishes", () => {
  const first = reduce(placeSolution(initializeState()), "runContraption").state;
  const rebuilding = reduce(first, "nextAttempt").state as ContraptionRuntimeState;

  assert.equal(rebuilding.phase, "building");
  assert.equal(rebuilding.run, null);
  assert.deepEqual(rebuilding.pieces, SOLVED_LEVEL.solution);

  const second = reduce(rebuilding, "runContraption").state;
  const done = reduce(second, "nextAttempt").state as ContraptionRuntimeState;

  assert.equal(done.phase, "done");
  assert.notEqual(done.run, null);
  assert.equal(reduce(done, "runContraption").didMutate, false);
  assert.equal(reduce(done, "nextAttempt").didMutate, false);
});

test("ignores nextAttempt before anything has run", () => {
  assert.equal(reduce(initializeState(), "nextAttempt").didMutate, false);
});

test("replays the last run for the room by bumping the token, including after the turn is done", () => {
  const fresh = initializeState();
  const ran = reduce(placeSolution(fresh), "runContraption").state;
  const replayed = reduce(ran, "replayRun");
  const done = reduce(reduce(reduce(replayed.state, "nextAttempt").state, "runContraption").state, "nextAttempt").state;
  const replayedAgain = reduce(done, "replayRun").state as ContraptionRuntimeState;

  assert.equal(reduce(fresh, "replayRun").didMutate, false);
  assert.equal((replayed.state as ContraptionRuntimeState).run?.replayToken, 1);
  assert.equal(replayedAgain.run?.replayToken, 1);
});

test("rejects unknown actions and foreign state shapes", () => {
  const state = initializeState();

  assert.equal(reduce(state, "explode").didMutate, false);
  assert.equal(reduce({ minigame: "TRIVIA" }, "runContraption").didMutate, false);
  assert.equal(
    contraptionRuntimePlugin.selectDisplayView({ state: { nope: true }, rules: null, content: null }),
    null
  );
});

test("projects the level and plan to both surfaces without the solution", () => {
  const built = placeSolution(initializeState());
  const host = hostViewOf(built);
  const display = displayViewOf(built);

  for (const view of [host, display]) {
    assert.equal(view.level?.id, "over-the-shoulder");
    assert.equal(view.level?.wing.radius, WING_RADIUS);
    assert.equal(view.level?.pickups.length, 2);
    assert.deepEqual(view.pieces, SOLVED_LEVEL.solution);
    assert.equal(view.activeTurnTeamId, "team-1");
    assert.equal("solution" in (view.level ?? {}), false);
  }

  assert.equal(JSON.stringify(host).includes("solution"), false);
  assert.equal(JSON.stringify(display).includes("solution"), false);
});

test("projects the run track to the display so it can replay without predicting", () => {
  const ran = reduce(placeSolution(initializeState()), "runContraption").state;
  const display = displayViewOf(ran);

  assert.equal(display.phase, "ran");
  assert.equal(display.run?.track.keyframeHz, 30);
  assert.ok((display.run?.track.positions.length ?? 0) > 2);
  assert.equal(display.attemptsUsed, 1);
  assert.equal(display.attemptsPerTurn, 2);
});

test("keeps pending points in sync when the shell re-syncs them", () => {
  const state = initializeState();
  const synced = contraptionRuntimePlugin.syncPendingPoints?.({
    state,
    pendingPointsByTeamId: { "team-1": 9 }
  }) as ContraptionRuntimeState;

  assert.equal(synced.pendingPointsByTeamId["team-1"], 9);
});

// ── Sample content pins ───────────────────────────────────────────────────────
// An unsolvable level is a genuinely bad party moment, so every shipped level
// carries a known-good build and this suite runs each one through the real
// integrator. Read from disk on purpose: the pack the server loads is what has
// to be solvable, not a copy of it.
const SAMPLE_CONTENT_URL = new URL(
  "../../../../../content/sample/minigames/contraption.json",
  import.meta.url
);

const sampleContent = parseContraptionContentFile(
  readFileSync(SAMPLE_CONTENT_URL, "utf8"),
  SAMPLE_CONTENT_URL.pathname
);

const WATCHABLE_TARGET_SECONDS = 4;

// A slide is a stretch of consecutive integration steps in contact with a
// placed piece — a body travelling ALONG a ramp rather than glancing off it.
const longestSlideSteps = (level: ContraptionLevel): number => {
  const { stepRun } = simulateLevel(level, level.solution, 1);
  const segments = level.solution.map(toPieceSegment);
  let longest = 0;
  let current = 0;

  for (const keyframe of stepRun.keyframes) {
    const wing = keyframe[0] as { x: number; y: number };
    const touching = segments.some((segment) => {
      const alongX = segment.to.x - segment.from.x;
      const alongY = segment.to.y - segment.from.y;
      const lengthSquared = alongX * alongX + alongY * alongY;
      const travel = Math.max(
        0,
        Math.min(
          1,
          ((wing.x - segment.from.x) * alongX + (wing.y - segment.from.y) * alongY) / lengthSquared
        )
      );
      const gapX = wing.x - (segment.from.x + alongX * travel);
      const gapY = wing.y - (segment.from.y + alongY * travel);

      return Math.sqrt(gapX * gapX + gapY * gapY) <= WING_RADIUS + 0.05;
    });

    current = touching ? current + 1 : 0;
    longest = Math.max(longest, current);
  }

  return longest;
};

for (const level of sampleContent.prompts) {
  test(`lands the sample level "${level.id}" with its shipped solution, touching every piece`, () => {
    const graded = gradeAttempt(level, level.solution, 1);

    assert.equal(graded.outcome, "landed", `${level.id} settled ${graded.outcome}`);
    assert.equal(
      graded.contactedPieceIds.length,
      level.solution.length,
      `${level.id}: a solution piece is scenery the wing never touches`
    );
    assert.ok(
      graded.settleSeconds !== null && graded.settleSeconds <= WATCHABLE_TARGET_SECONDS,
      `${level.id} settles at ${String(graded.settleSeconds)}s, past the watchable target`
    );
  });

  test(`does not land the sample level "${level.id}" with an empty field`, () => {
    assert.notEqual(gradeAttempt(level, [], 1).outcome, "landed");
  });
}

test("ships at least one sample level whose solution rides a ramp rather than bouncing off it", () => {
  // Half a second of continuous contact at 240Hz. Without this, nothing in the
  // shipped content demonstrates that the friction fix changed anything a
  // player would notice.
  const slides = sampleContent.prompts.map((level) => longestSlideSteps(level));

  assert.ok(
    slides.some((steps) => steps >= 100),
    `longest slides per level: ${slides.join(", ")}`
  );
});

test("keeps the dev manifest a faithful mirror of the sample pack", () => {
  assert.deepEqual(CONTRAPTION_DEV_CONTENT, JSON.parse(readFileSync(SAMPLE_CONTENT_URL, "utf8")));
});
