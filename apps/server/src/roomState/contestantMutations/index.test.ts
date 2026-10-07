import assert from "node:assert/strict";
import test, { beforeEach, mock } from "node:test";

import { joustDevManifest } from "@wingnight/minigames-joust/dev";
import {
  Phase,
  PLAYER_MINIGAME_ACTION_REFUSAL_REASONS,
  type ContestantMinigameType,
  type MinigameHostView,
  type RoomState
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  applyRoomStateMutation,
  dispatchContestantMinigameAction,
  dispatchMinigameAction,
  dispatchServerMinigameAction,
  getRoomStateSnapshot,
  readContestantActionRefusal,
  readMinigameDeadline,
  redoLastScoringMutation,
  resetRoomState,
  setRoomStateMinigameContent,
  setRoundDeviceMode,
  takeBackContestantLeg
} from "../index.js";
import { createMinigameDeadlineScheduler } from "../../minigames/deadlineScheduler/index.js";
import { advanceUntil, dropPhone, seatPhone, setupArcadeNight } from "../testHarness.js";

const T0 = 1_800_000_000_000;
const ROUND_BY_GAME: Record<ContestantMinigameType, number> = {
  FAPPY: 1,
  SCHLONIC: 2,
  BRAWL: 3,
  JOUST: 4
};

const hostViewOf = <TGame extends ContestantMinigameType>(
  minigame: TGame
): Extract<MinigameHostView, { minigame: TGame }> => {
  const view = getRoomStateSnapshot().minigameHostView;

  assert.ok(view !== null && view.minigame === minigame);

  return view as Extract<MinigameHostView, { minigame: TGame }>;
};

// The game's round, to its first turn's play, in phones mode with every phone seated unless the
// test says otherwise. Rounds rotate who opens, so it says whose leg is first: round 1 (FAPPY) is
// team 1's, Player One then Player Two.
const playArcadeTurn = (
  minigame: ContestantMinigameType,
  options: { deviceMode?: "tablet" | "phones"; seat?: string[] } = {}
): string => {
  const round = ROUND_BY_GAME[minigame];

  setRoundDeviceMode(round, options.deviceMode ?? "phones");

  for (const playerId of options.seat ?? ["player-1", "player-2", "player-3", "player-4"]) {
    seatPhone(playerId);
  }

  advanceUntil(Phase.MINIGAME_PLAY, round, 256);

  const contestant = getRoomStateSnapshot().contestantTurn?.contestantPlayerId ?? null;

  assert.ok(contestant !== null);

  return contestant;
};

const phoneSends = (
  playerId: string,
  minigame: ContestantMinigameType,
  actionType: string,
  actionPayload: SerializableValue = {}
): string | null => {
  const refusal = readContestantActionRefusal(playerId, minigame, actionType);

  if (refusal === null) {
    dispatchContestantMinigameAction(playerId, minigame, actionType, actionPayload);
  }

  return refusal;
};

beforeEach(() => {
  mock.timers.reset();
  resetRoomState();
  setupArcadeNight();
  setRoomStateMinigameContent("JOUST", joustDevManifest.content ?? {});
});

test("does let the contestant's phone play its own leg and lands the input in the game", () => {
  playArcadeTurn("FAPPY");

  assert.equal(phoneSends("player-1", "FAPPY", "flap", { tick: 4 }), null);
  assert.deepEqual(hostViewOf("FAPPY").legs[0]?.flapTicks, [4]);
});

test("does refuse a phone's action for another team's player and an off-turn teammate", () => {
  playArcadeTurn("FAPPY");

  assert.equal(
    phoneSends("player-3", "FAPPY", "flap", { tick: 1 }),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_CONTESTANT
  );
  assert.equal(
    phoneSends("player-2", "FAPPY", "flap", { tick: 1 }),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.NOT_CONTESTANT
  );
  assert.deepEqual(hostViewOf("FAPPY").legs[0]?.flapTicks, []);
});

test("does refuse a host-only action from the contestant's own phone", () => {
  playArcadeTurn("FAPPY");

  for (const actionType of ["skipLeg", "resetTurn", "retakeLeg"]) {
    assert.equal(
      phoneSends("player-1", "FAPPY", actionType),
      PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION
    );
  }

  assert.equal(hostViewOf("FAPPY").legIndex, 0);
});

test("does refuse JOUST's next shot from a phone — the host paces the room", () => {
  const shooter = playArcadeTurn("JOUST");

  assert.equal(
    phoneSends(shooter, "JOUST", "nextShot"),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.HOST_ONLY_ACTION
  );
  assert.equal(phoneSends(shooter, "JOUST", "setAim", { x: -40, y: 20 }), null);
});

test("does refuse every phone action when the turn was locked to the tablet", () => {
  playArcadeTurn("FAPPY", { deviceMode: "tablet" });

  assert.equal(
    phoneSends("player-1", "FAPPY", "flap", { tick: 1 }),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_MODE
  );
});

test("does refuse a phone's action outside play and for a game not in play", () => {
  setRoundDeviceMode(1, "phones");
  seatPhone("player-1");
  advanceUntil(Phase.EATING, 1);

  assert.equal(
    phoneSends("player-1", "FAPPY", "flap", { tick: 1 }),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE
  );

  advanceUntil(Phase.MINIGAME_PLAY, 1);

  assert.equal(
    phoneSends("player-1", "SCHLONIC", "press", { tick: 1 }),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.WRONG_PHASE
  );
});

test("does refuse the tablet's input while the phone holds the leg and keep the hatches open", () => {
  playArcadeTurn("FAPPY");

  dispatchMinigameAction("FAPPY", "flap", { tick: 2 });
  assert.deepEqual(hostViewOf("FAPPY").legs[0]?.flapTicks, []);

  dispatchMinigameAction("FAPPY", "skipLeg", {});
  assert.equal(hostViewOf("FAPPY").legIndex, 1);

  dispatchMinigameAction("FAPPY", "resetTurn", {});
  assert.equal(hostViewOf("FAPPY").legIndex, 0);
});

test("does refuse the phone once the host takes the leg back, and hand it to the tablet", () => {
  playArcadeTurn("FAPPY");
  phoneSends("player-1", "FAPPY", "flap", { tick: 3 });

  const before = getRoomStateSnapshot();

  takeBackContestantLeg();

  const after = getRoomStateSnapshot();

  assert.equal(after.contestantTurn?.controller, "tablet");
  assert.deepEqual(after.contestantTurn?.tabletLegIndexes, [0]);
  assert.equal(
    phoneSends("player-1", "FAPPY", "flap", { tick: 9 }),
    PLAYER_MINIGAME_ACTION_REFUSAL_REASONS.TABLET_HOLDS_LEG
  );

  // The tablet starts the respawned attempt clean, with its own log.
  dispatchMinigameAction("FAPPY", "flap", { tick: 0 });
  assert.deepEqual(hostViewOf("FAPPY").legs[0]?.flapTicks, [0]);
  // Not an undo point: undo still means the last score.
  assert.equal(after.canRedoScoringMutation, before.canRedoScoringMutation);
});

test("does respawn a taken-back FAPPY leg as the next attempt from its checkpoint", () => {
  playArcadeTurn("FAPPY");
  phoneSends("player-1", "FAPPY", "flap", { tick: 3 });

  const leg = hostViewOf("FAPPY").legs[0];

  takeBackContestantLeg();

  const retaken = hostViewOf("FAPPY").legs[0];

  assert.equal(retaken?.status, "ready");
  assert.equal(retaken?.attempt, (leg?.attempt ?? 0) + 1);
  assert.equal(retaken?.checkpointGate, leg?.checkpointGate);
  assert.equal(retaken?.crashes, leg?.crashes);
  assert.deepEqual(retaken?.flapTicks, []);
});

test("does put a taken-back SCHLONIC run and BRAWL block back on the line", () => {
  const rider = playArcadeTurn("SCHLONIC");

  assert.equal(phoneSends(rider, "SCHLONIC", "press", { tick: 2 }), null);
  assert.equal(hostViewOf("SCHLONIC").runs[0]?.status, "running");
  takeBackContestantLeg();

  assert.equal(hostViewOf("SCHLONIC").runs[0]?.status, "ready");
  assert.deepEqual(hostViewOf("SCHLONIC").runs[0]?.inputs, []);
  assert.equal(hostViewOf("SCHLONIC").runIndex, 0);

  resetRoomState();
  setupArcadeNight();

  const brawler = playArcadeTurn("BRAWL");

  assert.equal(phoneSends(brawler, "BRAWL", "walk", { tick: 1, dir: 1 }), null);
  assert.equal(hostViewOf("BRAWL").blocks[0]?.status, "running");
  takeBackContestantLeg();

  assert.equal(hostViewOf("BRAWL").blocks[0]?.status, "ready");
  assert.deepEqual(hostViewOf("BRAWL").blocks[0]?.inputs, []);
  assert.equal(getRoomStateSnapshot().contestantTurn?.controller, "tablet");
});

test("does hand a taken-back JOUST shot to the tablet and leave the band as it was", () => {
  const shooter = playArcadeTurn("JOUST");

  assert.equal(phoneSends(shooter, "JOUST", "setAim", { x: -40, y: 20 }), null);

  const aim = hostViewOf("JOUST").aim;

  takeBackContestantLeg();

  assert.deepEqual(hostViewOf("JOUST").aim, aim);
  assert.equal(getRoomStateSnapshot().contestantTurn?.controller, "tablet");
  dispatchMinigameAction("JOUST", "setAim", { x: -60, y: 10 });
  assert.notDeepEqual(hostViewOf("JOUST").aim, aim);
});

test("does take back a dropped phone's leg and refuse a take-back with nothing to take", () => {
  playArcadeTurn("FAPPY", { seat: ["player-2"] });

  // Player One never claimed a face: that leg was never a phone's.
  takeBackContestantLeg();
  assert.deepEqual(getRoomStateSnapshot().contestantTurn?.tabletLegIndexes, []);

  dispatchMinigameAction("FAPPY", "skipLeg", {});
  dropPhone("player-2");
  assert.equal(getRoomStateSnapshot().contestantTurn?.droppedPlayerId, "player-2");

  takeBackContestantLeg();
  assert.deepEqual(getRoomStateSnapshot().contestantTurn?.tabletLegIndexes, [1]);
  assert.equal(getRoomStateSnapshot().contestantTurn?.droppedPlayerId, null);

  // A second take-back of the same leg changes nothing.
  assert.equal(applyRoomStateMutation(takeBackContestantLeg).didMutate, false);
});

test("does refuse a take-back in a turn locked to the tablet", () => {
  playArcadeTurn("FAPPY", { deviceMode: "tablet" });

  assert.equal(applyRoomStateMutation(takeBackContestantLeg).didMutate, false);
});

// Item 10: the end of a phone's run is the same undo point as the end of the tablet's.
const END_OF_RUN: Record<
  Exclude<ContestantMinigameType, "JOUST">,
  { inputs: [string, SerializableValue][]; endActionType: string }
> = {
  FAPPY: { inputs: [["flap", { tick: 0 }]], endActionType: "endLeg" },
  SCHLONIC: {
    inputs: [
      ["press", { tick: 0 }],
      ["release", { tick: 6 }]
    ],
    endActionType: "endRun"
  },
  BRAWL: {
    inputs: [
      ["walk", { tick: 0, dir: 1 }],
      ["peck", { tick: 4 }]
    ],
    endActionType: "endBlock"
  }
};

type UndoReading = Pick<
  RoomState,
  "minigameHostView" | "minigameDisplayView" | "pendingMinigamePointsByTeamId" | "canRedoScoringMutation"
>;

const readUndo = (state: RoomState): UndoReading => ({
  minigameHostView: state.minigameHostView,
  minigameDisplayView: state.minigameDisplayView,
  pendingMinigamePointsByTeamId: state.pendingMinigamePointsByTeamId,
  canRedoScoringMutation: state.canRedoScoringMutation
});

const playRunAndUndo = (
  minigame: Exclude<ContestantMinigameType, "JOUST">,
  device: "tablet" | "phone"
): { afterEnd: UndoReading; afterUndo: UndoReading } => {
  resetRoomState();
  setupArcadeNight();

  const contestant = playArcadeTurn(minigame, { deviceMode: device === "phone" ? "phones" : "tablet" });

  const send = (actionType: string, actionPayload: SerializableValue): void => {
    if (device === "phone") {
      assert.equal(phoneSends(contestant, minigame, actionType, actionPayload), null);
    } else {
      dispatchMinigameAction(minigame, actionType, actionPayload);
    }
  };

  for (const [actionType, actionPayload] of END_OF_RUN[minigame].inputs) {
    send(actionType, actionPayload);
  }

  send(END_OF_RUN[minigame].endActionType, {});

  const afterEnd = readUndo(getRoomStateSnapshot());

  redoLastScoringMutation();

  return { afterEnd, afterUndo: readUndo(getRoomStateSnapshot()) };
};

for (const minigame of ["FAPPY", "SCHLONIC", "BRAWL"] as const) {
  test(`does undo a phone's ${END_OF_RUN[minigame].endActionType} exactly as it undoes the tablet's (${minigame})`, () => {
    // One clock for both runs, so the server's stamps match to the millisecond.
    mock.timers.enable({ apis: ["Date"], now: T0 });

    const tablet = playRunAndUndo(minigame, "tablet");
    const phone = playRunAndUndo(minigame, "phone");

    assert.equal(tablet.afterEnd.canRedoScoringMutation, true);
    assert.deepEqual(phone.afterEnd, tablet.afterEnd);
    assert.deepEqual(phone.afterUndo, tablet.afterUndo);
    // The undo really went back: the run is live again with its log in hand.
    assert.notDeepEqual(phone.afterUndo.minigameHostView, phone.afterEnd.minigameHostView);
    assert.equal(phone.afterUndo.canRedoScoringMutation, false);
  });
}

test("does time a FAPPY relay out on the server's clock with the phone that flew it gone", () => {
  mock.timers.enable({ apis: ["Date"], now: T0 });
  playArcadeTurn("FAPPY");
  phoneSends("player-1", "FAPPY", "flap", { tick: 1 });
  dropPhone("player-1");

  const limitMs = hostViewOf("FAPPY").limitSeconds * 1000;

  assert.deepEqual(readMinigameDeadline(), { minigameId: "FAPPY", actionType: "timeOut", atMs: T0 + limitMs });

  // The scheduler, on a clock and a timer the test walks.
  let clock = T0;
  const timers: { callback: () => void; dueAt: number }[] = [];
  const scheduler = createMinigameDeadlineScheduler({
    readDeadline: readMinigameDeadline,
    fire: (deadline, receivedAtMs) => {
      applyRoomStateMutation(() =>
        dispatchServerMinigameAction(deadline.minigameId, deadline.actionType, receivedAtMs)
      );
    },
    now: () => clock,
    setTimer: (callback, delayMs) => {
      timers.push({ callback, dueAt: clock + delayMs });
      return setTimeout(() => {}, 0);
    },
    clearTimer: () => {}
  });

  scheduler.reconcile();
  assert.equal(timers.length, 1);
  assert.ok((timers[0]?.dueAt ?? 0) >= T0 + limitMs);

  clock = timers[0]?.dueAt ?? 0;
  timers[0]?.callback();

  const view = hostViewOf("FAPPY");

  assert.equal(view.phase, "timedOut");
  assert.equal(view.timedOutAtMs, clock);
  assert.equal(readMinigameDeadline(), null);
});

test("does drop the relay's deadline when the host resets the turn or play ends", () => {
  mock.timers.enable({ apis: ["Date"], now: T0 });
  playArcadeTurn("FAPPY");
  phoneSends("player-1", "FAPPY", "flap", { tick: 1 });
  assert.notEqual(readMinigameDeadline(), null);

  dispatchMinigameAction("FAPPY", "resetTurn", {});
  assert.equal(readMinigameDeadline(), null);

  phoneSends("player-1", "FAPPY", "flap", { tick: 1 });
  assert.notEqual(readMinigameDeadline(), null);

  advanceUntil(Phase.TURN_RESULTS, 1);
  assert.equal(readMinigameDeadline(), null);
});

test("does keep the tablet's own timeOut working in a tablet turn", () => {
  mock.timers.enable({ apis: ["Date"], now: T0 });
  playArcadeTurn("FAPPY", { deviceMode: "tablet" });
  dispatchMinigameAction("FAPPY", "flap", { tick: 1 });

  mock.timers.setTime(T0 + hostViewOf("FAPPY").limitSeconds * 1000);
  dispatchMinigameAction("FAPPY", "timeOut", {});

  assert.equal(hostViewOf("FAPPY").phase, "timedOut");
});
