import assert from "node:assert/strict";
import test from "node:test";

import { CLIENT_TO_SERVER_EVENTS, SERVER_TO_CLIENT_EVENTS, type PlayerPlaceBetResult } from "@wingnight/shared";

import { createSpectatorBetSlipController, type SpectatorBetSlipSocket } from "./index";

type Handler = (...args: unknown[]) => void;

const createFakeSocket = (answer: PlayerPlaceBetResult | Error) => {
  const handlers = new Map<string, Handler>();
  const sent: [string, unknown][] = [];

  const socket = {
    on: (event: string, handler: Handler) => {
      handlers.set(event, handler);
    },
    off: (event: string) => {
      handlers.delete(event);
    },
    timeout: () => ({
      emitWithAck: (event: string, payload: unknown) => {
        sent.push([event, payload]);

        return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
      }
    })
  } as unknown as SpectatorBetSlipSocket;

  return {
    socket,
    sent,
    fire: (event: string, ...args: unknown[]) => handlers.get(event)?.(...args),
    hasHandler: (event: string) => handlers.has(event)
  };
};

const settle = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

test("does keep the pick the server confirmed when a bet is placed", async () => {
  const { socket, sent } = createFakeSocket({ ok: true, turnKey: "1:0", pick: "under" });
  const controller = createSpectatorBetSlipController(socket);
  let calls = 0;

  controller.subscribe(() => {
    calls += 1;
  });
  controller.place("under");
  await settle();

  assert.deepEqual(sent, [[CLIENT_TO_SERVER_EVENTS.PLAYER_PLACE_BET, { pick: "under" }]]);
  assert.deepEqual(controller.getOwnBet(), { turnKey: "1:0", pick: "under" });
  assert.equal(calls, 1);
});

test("does leave the slip as it was when the server refuses the bet or the ack times out", async () => {
  const refused = createSpectatorBetSlipController(createFakeSocket({ ok: false, reason: "closed" }).socket);
  const timedOut = createSpectatorBetSlipController(createFakeSocket(new Error("timeout")).socket);

  refused.place("over");
  timedOut.place("over");
  await settle();

  assert.equal(refused.getOwnBet(), null);
  assert.equal(timedOut.getOwnBet(), null);
});

test("does take its own pick from its room when the phone takes its seat again", () => {
  const { socket, fire } = createFakeSocket({ ok: false, reason: "closed" });
  const controller = createSpectatorBetSlipController(socket);

  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_SPECTATOR_BET, { turnKey: "2:1", pick: "over" });
  assert.deepEqual(controller.getOwnBet(), { turnKey: "2:1", pick: "over" });

  fire(SERVER_TO_CLIENT_EVENTS.PLAYER_SPECTATOR_BET, { turnKey: "2:2", pick: null });
  assert.equal(controller.getOwnBet(), null);
});

test("does stop listening when it is disposed", () => {
  const { socket, hasHandler } = createFakeSocket({ ok: false, reason: "closed" });
  const controller = createSpectatorBetSlipController(socket);

  controller.dispose();

  assert.equal(hasHandler(SERVER_TO_CLIENT_EVENTS.PLAYER_SPECTATOR_BET), false);
});
