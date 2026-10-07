import assert from "node:assert/strict";
import test from "node:test";

import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  SERVER_TO_CLIENT_EVENTS,
  type MinigamePlayerView
} from "@wingnight/shared";

import { createPhoneAnswerCardController, type PhoneAnswerCardSocket } from "./index";

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
  } as unknown as PhoneAnswerCardSocket;

  return {
    socket,
    sent,
    fire: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
    hasHandler: (event: string) => handlers.has(event)
  };
};

const GEO_CARD: MinigamePlayerView = {
  minigame: "GEO",
  promptId: "geo-1",
  promptTitle: "The bridge",
  photoNumber: 1,
  promptsPerTurn: 2,
  status: "open",
  pin: null,
  result: null
};

test("does hold the card and tell its listeners when the server sends this phone its card", () => {
  const { socket, fire } = createFakeSocket();
  const controller = createPhoneAnswerCardController(socket);
  let calls = 0;

  controller.subscribe(() => {
    calls += 1;
  });
  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW, { minigamePlayerView: GEO_CARD });

  assert.equal(controller.getView(), GEO_CARD);
  assert.equal(calls, 1);

  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW, { minigamePlayerView: null });

  assert.equal(controller.getView(), null);
});

test("does send an answer as a player action for the card's game when it holds a card", () => {
  const { socket, sent, fire } = createFakeSocket();
  const controller = createPhoneAnswerCardController(socket);

  controller.answer("placePin", { lat: 1, lng: 2 });
  assert.deepEqual(sent, []);

  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW, { minigamePlayerView: GEO_CARD });
  controller.answer("placePin", { lat: 1, lng: 2 });

  assert.deepEqual(sent, [
    [
      CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION,
      {
        minigameId: "GEO",
        minigameApiVersion: MINIGAME_API_VERSION,
        actionType: "placePin",
        actionPayload: { lat: 1, lng: 2 }
      }
    ]
  ]);
});

test("does stop listening when it is disposed", () => {
  const { socket, hasHandler } = createFakeSocket();
  const controller = createPhoneAnswerCardController(socket);

  assert.equal(hasHandler(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW), true);
  controller.dispose();
  assert.equal(hasHandler(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW), false);
});
