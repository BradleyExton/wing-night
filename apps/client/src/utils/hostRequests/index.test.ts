import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  TIMER_EXTEND_MAX_SECONDS
} from "@wingnight/shared";

import {
  createHostRequestHandlers,
  hostRequestTable,
  type HostRequestHandlers,
  type HostRequestName,
  type HostRequestSocket
} from "./index";

type EmittedEvent = {
  event: string;
  payload?: unknown;
};

type SocketHarness = {
  socket: HostRequestSocket;
  emittedEvents: EmittedEvent[];
};

const createSocketHarness = (): SocketHarness => {
  const emittedEvents: EmittedEvent[] = [];

  const socket = {
    emit: (event: string, payload?: unknown): void => {
      emittedEvents.push(
        payload === undefined ? { event } : { event, payload }
      );
    }
  } as unknown as HostRequestSocket;

  return { socket, emittedEvents };
};

const createHandlers = (
  hostSecret: string | null
): SocketHarness & { handlers: HostRequestHandlers } => {
  const harness = createSocketHarness();

  return {
    ...harness,
    handlers: createHostRequestHandlers(harness.socket, {
      getHostSecret: () => hostSecret
    })
  };
};

type HandlerInvocation = {
  [Name in HostRequestName]: {
    name: Name;
    invoke: (handlers: HostRequestHandlers) => void;
    expectedPayload: Record<string, unknown>;
  };
}[HostRequestName];

const handlerInvocations: HandlerInvocation[] = [
  {
    name: "onNextPhase",
    invoke: (handlers) => handlers.onNextPhase(),
    expectedPayload: { hostSecret: "valid-host-secret" }
  },
  {
    name: "onCreateTeam",
    invoke: (handlers) => handlers.onCreateTeam("  Spice Squad  "),
    expectedPayload: { hostSecret: "valid-host-secret", name: "Spice Squad" }
  },
  {
    name: "onAddPlayer",
    invoke: (handlers) => handlers.onAddPlayer("  Alex  "),
    expectedPayload: { hostSecret: "valid-host-secret", name: "Alex" }
  },
  {
    name: "onAssignPlayer",
    invoke: (handlers) => handlers.onAssignPlayer("player-1", "team-1"),
    expectedPayload: {
      hostSecret: "valid-host-secret",
      playerId: "player-1",
      teamId: "team-1"
    }
  },
  {
    name: "onAutoAssignRemainingPlayers",
    invoke: (handlers) => handlers.onAutoAssignRemainingPlayers(),
    expectedPayload: { hostSecret: "valid-host-secret" }
  },
  {
    name: "onSetWingParticipation",
    invoke: (handlers) => handlers.onSetWingParticipation("player-1", true),
    expectedPayload: {
      hostSecret: "valid-host-secret",
      playerId: "player-1",
      didEat: true
    }
  },
  {
    name: "onDispatchMinigameAction",
    invoke: (handlers) =>
      handlers.onDispatchMinigameAction("TRIVIA", "recordAttempt", {
        isCorrect: true
      }),
    expectedPayload: {
      hostSecret: "valid-host-secret",
      minigameApiVersion: MINIGAME_API_VERSION,
      minigameId: "TRIVIA",
      actionType: "recordAttempt",
      actionPayload: { isCorrect: true }
    }
  },
  {
    name: "onPauseTimer",
    invoke: (handlers) => handlers.onPauseTimer(),
    expectedPayload: { hostSecret: "valid-host-secret" }
  },
  {
    name: "onResumeTimer",
    invoke: (handlers) => handlers.onResumeTimer(),
    expectedPayload: { hostSecret: "valid-host-secret" }
  },
  {
    name: "onExtendTimer",
    invoke: (handlers) => handlers.onExtendTimer(60),
    expectedPayload: { hostSecret: "valid-host-secret", additionalSeconds: 60 }
  },
  {
    name: "onReorderTurnOrder",
    invoke: (handlers) => handlers.onReorderTurnOrder(["team-2", "team-1"]),
    expectedPayload: {
      hostSecret: "valid-host-secret",
      teamIds: ["team-2", "team-1"]
    }
  },
  {
    name: "onSkipTurnBoundary",
    invoke: (handlers) => handlers.onSkipTurnBoundary(),
    expectedPayload: { hostSecret: "valid-host-secret" }
  },
  {
    name: "onAdjustTeamScore",
    invoke: (handlers) => handlers.onAdjustTeamScore("team-1", -2),
    expectedPayload: {
      hostSecret: "valid-host-secret",
      teamId: "team-1",
      delta: -2
    }
  },
  {
    name: "onResetGame",
    invoke: (handlers) => handlers.onResetGame(),
    expectedPayload: { hostSecret: "valid-host-secret" }
  },
  {
    name: "onRedoLastMutation",
    invoke: (handlers) => handlers.onRedoLastMutation(),
    expectedPayload: { hostSecret: "valid-host-secret" }
  }
];

test("covers every handler in the request table", () => {
  const coveredNames = handlerInvocations.map((invocation) => invocation.name);

  assert.deepEqual(
    [...coveredNames].sort(),
    Object.keys(hostRequestTable).sort()
  );
});

for (const invocation of handlerInvocations) {
  test(`${invocation.name} emits host:claimControl instead of the request when host secret is missing`, () => {
    const { handlers, emittedEvents } = createHandlers(null);

    invocation.invoke(handlers);

    assert.deepEqual(emittedEvents, [
      { event: CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL }
    ]);
  });

  test(`${invocation.name} emits ${hostRequestTable[invocation.name].event} with the built payload when host secret exists`, () => {
    const { handlers, emittedEvents } = createHandlers("valid-host-secret");

    invocation.invoke(handlers);

    assert.deepEqual(emittedEvents, [
      {
        event: hostRequestTable[invocation.name].event,
        payload: invocation.expectedPayload
      }
    ]);
  });
}

type GuardedInvocation = {
  label: string;
  invoke: (handlers: HostRequestHandlers) => void;
};

const guardedInvocations: GuardedInvocation[] = [
  {
    label: "onCreateTeam rejects blank team names",
    invoke: (handlers) => handlers.onCreateTeam("   ")
  },
  {
    label: "onAddPlayer rejects blank player names",
    invoke: (handlers) => handlers.onAddPlayer("   ")
  },
  {
    label: "onExtendTimer rejects zero seconds",
    invoke: (handlers) => handlers.onExtendTimer(0)
  },
  {
    label: "onExtendTimer rejects fractional seconds",
    invoke: (handlers) => handlers.onExtendTimer(1.5)
  },
  {
    label: "onExtendTimer rejects seconds above the shared maximum",
    invoke: (handlers) => handlers.onExtendTimer(TIMER_EXTEND_MAX_SECONDS + 1)
  },
  {
    label: "onReorderTurnOrder rejects empty team id lists",
    invoke: (handlers) => handlers.onReorderTurnOrder([])
  },
  {
    label: "onReorderTurnOrder rejects duplicate team ids",
    invoke: (handlers) => handlers.onReorderTurnOrder(["team-1", "team-1"])
  },
  {
    label: "onReorderTurnOrder rejects blank team ids",
    invoke: (handlers) => handlers.onReorderTurnOrder(["team-1", ""])
  },
  {
    label: "onAdjustTeamScore rejects zero deltas",
    invoke: (handlers) => handlers.onAdjustTeamScore("team-1", 0)
  },
  {
    label: "onAdjustTeamScore rejects fractional deltas",
    invoke: (handlers) => handlers.onAdjustTeamScore("team-1", 1.5)
  },
  {
    label: "onAdjustTeamScore rejects blank team ids",
    invoke: (handlers) => handlers.onAdjustTeamScore(" ", 2)
  }
];

for (const guarded of guardedInvocations) {
  test(`${guarded.label} and emits nothing`, () => {
    const { handlers, emittedEvents } = createHandlers("valid-host-secret");

    guarded.invoke(handlers);

    assert.deepEqual(emittedEvents, []);
  });
}

test("reorder payload copies the team id list instead of sharing the caller's array", () => {
  const { handlers, emittedEvents } = createHandlers("valid-host-secret");
  const teamIds = ["team-2", "team-1"];

  handlers.onReorderTurnOrder(teamIds);
  teamIds.push("team-3");

  const emittedPayload = emittedEvents[0]?.payload as { teamIds: string[] };
  assert.deepEqual(emittedPayload.teamIds, ["team-2", "team-1"]);
});
