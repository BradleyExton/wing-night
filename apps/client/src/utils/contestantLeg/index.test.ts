import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  SERVER_TO_CLIENT_EVENTS,
  type ContestantMinigameHostView
} from "@wingnight/shared";

import { createContestantLegController, type ContestantLegSocket } from "./index";

type Handler = (...args: unknown[]) => void;

const createFakeSocket = () => {
  const handlers = new Map<string, Handler>();
  const sent: [string, unknown][] = [];

  const socket = {
    on: (event: string, handler: Handler) => {
      handlers.set(event, handler);
    },
    off: (event: string) => {
      handlers.delete(event);
    },
    emit: (event: string, payload: unknown) => {
      sent.push([event, payload]);
    }
  } as unknown as ContestantLegSocket;

  return {
    socket,
    sent,
    fire: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
    hasHandler: (event: string) => handlers.has(event)
  };
};

// Only `minigame` is read by the controller; the rest of the view is the game's.
const FAPPY_VIEW = { minigame: "FAPPY" } as unknown as ContestantMinigameHostView;

test("does hold the view and tell its listeners when the server sends this phone its leg", () => {
  const { socket, fire } = createFakeSocket();
  const controller = createContestantLegController(socket);
  let calls = 0;

  controller.subscribe(() => {
    calls += 1;
  });
  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW, { minigameHostView: FAPPY_VIEW });

  assert.equal(controller.getHostView(), FAPPY_VIEW);
  assert.equal(calls, 1);
});

test("does send the game's action as a player action without a secret when it holds a view", () => {
  const { socket, sent, fire } = createFakeSocket();
  const controller = createContestantLegController(socket);

  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW, { minigameHostView: FAPPY_VIEW });
  controller.dispatch("flap", { tick: 12 });

  assert.deepEqual(sent, [
    [
      CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION,
      {
        minigameId: "FAPPY",
        minigameApiVersion: MINIGAME_API_VERSION,
        actionType: "flap",
        actionPayload: { tick: 12 }
      }
    ]
  ]);
});

test("does send nothing when the phone holds no view", () => {
  const { socket, sent } = createFakeSocket();
  const controller = createContestantLegController(socket);

  controller.dispatch("flap", {});

  assert.deepEqual(sent, []);
});

test("does forget the view so the next leg never paints the last one when the leg moves on", () => {
  const { socket, sent, fire } = createFakeSocket();
  const controller = createContestantLegController(socket);

  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW, { minigameHostView: FAPPY_VIEW });
  controller.forgetHostView();
  controller.dispatch("flap", {});

  assert.equal(controller.getHostView(), null);
  assert.deepEqual(sent, []);
});

test("does stop listening when disposed", () => {
  const { socket, hasHandler } = createFakeSocket();
  const controller = createContestantLegController(socket);

  assert.equal(hasHandler(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW), true);
  controller.dispose();
  assert.equal(hasHandler(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW), false);
});
