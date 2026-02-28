import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_TO_SERVER_EVENTS } from "@wingnight/shared";

import { createHostControlPanelHandlers } from "./index";

type Dependencies = NonNullable<
  Parameters<typeof createHostControlPanelHandlers>[1]
>;

class MockSocket {
  public claimControlEvents: string[] = [];

  public emit(event: typeof CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL): void {
    if (event === CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL) {
      this.claimControlEvents.push(event);
    }
  }
}

test("wires every host action and emits claim-control via missing-secret callback", () => {
  const socket = new MockSocket();
  const callLog: string[] = [];

  const dependencies: Dependencies = {
    requestNextPhase: (_socket, onMissingHostSecret) => {
      callLog.push("next");
      onMissingHostSecret?.();
      return false;
    },
    requestPreviousPhase: (_socket, onMissingHostSecret) => {
      callLog.push("previous");
      onMissingHostSecret?.();
      return false;
    },
    requestCreateTeam: (_socket, name, onMissingHostSecret) => {
      callLog.push(`create:${name}`);
      onMissingHostSecret?.();
      return false;
    },
    requestAssignPlayer: (_socket, playerId, teamId, onMissingHostSecret) => {
      callLog.push(`assign:${playerId}:${teamId}`);
      onMissingHostSecret?.();
      return false;
    },
    requestSetWingParticipation: (_socket, playerId, didEat, onMissingHostSecret) => {
      callLog.push(`wing:${playerId}:${didEat}`);
      onMissingHostSecret?.();
      return false;
    },
    requestMinigameAction: (
      _socket,
      minigameId,
      actionType,
      actionPayload,
      onMissingHostSecret
    ) => {
      callLog.push(
        `minigame:${minigameId}:${actionType}:${JSON.stringify(actionPayload)}`
      );
      onMissingHostSecret?.();
      return false;
    },
    requestPauseTimer: (_socket, onMissingHostSecret) => {
      callLog.push("pause");
      onMissingHostSecret?.();
      return false;
    },
    requestResumeTimer: (_socket, onMissingHostSecret) => {
      callLog.push("resume");
      onMissingHostSecret?.();
      return false;
    },
    requestExtendTimer: (_socket, additionalSeconds, onMissingHostSecret) => {
      callLog.push(`extend:${additionalSeconds}`);
      onMissingHostSecret?.();
      return false;
    },
    requestReorderTurnOrder: (_socket, teamIds, onMissingHostSecret) => {
      callLog.push(`reorder:${teamIds.join(",")}`);
      onMissingHostSecret?.();
      return false;
    },
    requestSkipTurnBoundary: (_socket, onMissingHostSecret) => {
      callLog.push("skip");
      onMissingHostSecret?.();
      return false;
    },
    requestAdjustTeamScore: (_socket, teamId, delta, onMissingHostSecret) => {
      callLog.push(`adjust:${teamId}:${delta}`);
      onMissingHostSecret?.();
      return false;
    },
    requestResetGame: (_socket, onMissingHostSecret) => {
      callLog.push("reset");
      onMissingHostSecret?.();
      return false;
    },
    requestRedoLastMutation: (_socket, onMissingHostSecret) => {
      callLog.push("redo");
      onMissingHostSecret?.();
      return false;
    }
  };

  const handlers = createHostControlPanelHandlers(
    socket as unknown as Parameters<typeof createHostControlPanelHandlers>[0],
    dependencies
  );

  handlers.onNextPhase();
  handlers.onPreviousPhase();
  handlers.onCreateTeam("Team Ghost Pepper");
  handlers.onAssignPlayer("player-1", "team-alpha");
  handlers.onSetWingParticipation("player-1", true);
  handlers.onDispatchMinigameAction("TRIVIA", "recordAttempt", {
    isCorrect: false
  });
  handlers.onPauseTimer();
  handlers.onResumeTimer();
  handlers.onExtendTimer(30);
  handlers.onReorderTurnOrder(["team-beta", "team-alpha"]);
  handlers.onSkipTurnBoundary();
  handlers.onAdjustTeamScore("team-beta", 5);
  handlers.onResetGame();
  handlers.onRedoLastMutation();

  assert.deepEqual(callLog, [
    "next",
    "previous",
    "create:Team Ghost Pepper",
    "assign:player-1:team-alpha",
    "wing:player-1:true",
    "minigame:TRIVIA:recordAttempt:{\"isCorrect\":false}",
    "pause",
    "resume",
    "extend:30",
    "reorder:team-beta,team-alpha",
    "skip",
    "adjust:team-beta:5",
    "reset",
    "redo"
  ]);

  assert.equal(socket.claimControlEvents.length, 14);
  assert.ok(
    socket.claimControlEvents.every((event) => event === CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL)
  );
});
