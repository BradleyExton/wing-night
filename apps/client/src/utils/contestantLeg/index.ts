import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  SERVER_TO_CLIENT_EVENTS,
  type ContestantMinigameHostView,
  type PlayerMinigameHostViewPayload
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";
import type { Socket } from "socket.io-client";

import type { InboundSocketEvents, OutboundSocketEvents } from "../../socketContracts/index";

// A contestant's phone playing its own leg of an arcade relay, from the phone's side: the game's
// host view, which the server sends to this player's room alone and only while this phone holds
// the leg in hand (`player:minigameHostView`), and the one road back — `player:minigameAction`,
// the host's envelope without the secret, authorized by the face this socket holds.
//
// The view is the phone's own, beside the room snapshot rather than in it, so it rides in as a
// prop like the seat. It is forgotten the moment the leg is not this phone's, so the next leg it
// is handed never paints, even for a frame, the last leg it played.
export type ContestantLegController = {
  getHostView: () => ContestantMinigameHostView | null;
  subscribe: (listener: () => void) => () => void;
  dispatch: (actionType: string, actionPayload: SerializableValue) => void;
  forgetHostView: () => void;
  dispose: () => void;
};

export type ContestantLegSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "on" | "off" | "emit"
>;

export const createContestantLegController = (socket: ContestantLegSocket): ContestantLegController => {
  let hostView: ContestantMinigameHostView | null = null;
  const listeners = new Set<() => void>();

  const setHostView = (next: ContestantMinigameHostView | null): void => {
    if (next === hostView) {
      return;
    }

    hostView = next;

    for (const listener of listeners) {
      listener();
    }
  };

  const handleHostView = ({ minigameHostView }: PlayerMinigameHostViewPayload): void => {
    setHostView(minigameHostView);
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW, handleHostView);

  return {
    getHostView: () => hostView,
    subscribe: (listener) => {
      listeners.add(listener);

      return (): void => {
        listeners.delete(listener);
      };
    },
    // Fire and forget, like the tablet's input: a flap needs no answer, and a refusal (the host
    // took the leg back a beat ago) is told by the next snapshot, which takes the game away.
    dispatch: (actionType, actionPayload) => {
      if (hostView === null) {
        return;
      }

      socket.emit(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, {
        minigameId: hostView.minigame,
        minigameApiVersion: MINIGAME_API_VERSION,
        actionType,
        actionPayload
      });
    },
    forgetHostView: () => {
      setHostView(null);
    },
    dispose: () => {
      socket.off(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_HOST_VIEW, handleHostView);
      listeners.clear();
    }
  };
};
