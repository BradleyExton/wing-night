import {
  CLIENT_TO_SERVER_EVENTS,
  SERVER_TO_CLIENT_EVENTS,
  type PlayerPlaceBetResult,
  type PlayerSpectatorBetPayload,
  type SpectatorBetPick
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type { InboundSocketEvents, OutboundSocketEvents } from "../../socketContracts/index";

// A watcher's own side bet, from the phone's side. No snapshot carries a pick before the turn
// settles — the room sees how many have bet, never which way — so the phone's own pick comes over
// its own room (`player:spectatorBet`) and the ack of the tap that placed it. Keyed by the turn it
// was placed on: a pick from the turn before never lights a button on this one.
export type OwnSpectatorBet = { turnKey: string; pick: SpectatorBetPick };

export type SpectatorBetSlipController = {
  getOwnBet: () => OwnSpectatorBet | null;
  subscribe: (listener: () => void) => () => void;
  place: (pick: SpectatorBetPick) => void;
  dispose: () => void;
};

export type SpectatorBetSlipSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "timeout"
>;

// A tap into a dropped socket gives up rather than hanging; the button just stays as it was.
const ACK_TIMEOUT_MS = 8_000;

export const createSpectatorBetSlipController = (
  socket: SpectatorBetSlipSocket
): SpectatorBetSlipController => {
  let ownBet: OwnSpectatorBet | null = null;
  const listeners = new Set<() => void>();

  const setOwnBet = (next: OwnSpectatorBet | null): void => {
    if (next?.turnKey === ownBet?.turnKey && next?.pick === ownBet?.pick) {
      return;
    }

    ownBet = next;

    for (const listener of listeners) {
      listener();
    }
  };

  const handleOwnBet = ({ turnKey, pick }: PlayerSpectatorBetPayload): void => {
    setOwnBet(pick === null ? null : { turnKey, pick });
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.PLAYER_SPECTATOR_BET, handleOwnBet);

  return {
    getOwnBet: () => ownBet,
    subscribe: (listener) => {
      listeners.add(listener);

      return (): void => {
        listeners.delete(listener);
      };
    },
    // A refusal (the window shut a beat ago, a tap-happy thumb) leaves the slip as it was: the next
    // snapshot already says the bets are locked.
    place: (pick) => {
      socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck(CLIENT_TO_SERVER_EVENTS.PLAYER_PLACE_BET, { pick })
        .then((result: PlayerPlaceBetResult) => {
          if (result.ok) {
            setOwnBet({ turnKey: result.turnKey, pick: result.pick });
          }
        })
        .catch(() => undefined);
    },
    dispose: () => {
      socket.off(SERVER_TO_CLIENT_EVENTS.PLAYER_SPECTATOR_BET, handleOwnBet);
      listeners.clear();
    }
  };
};
