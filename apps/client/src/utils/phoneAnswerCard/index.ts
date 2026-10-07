import {
  CLIENT_TO_SERVER_EVENTS,
  MINIGAME_API_VERSION,
  SERVER_TO_CLIENT_EVENTS,
  type MinigamePlayerView,
  type PlayerMinigamePlayerViewPayload
} from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";
import type { Socket } from "socket.io-client";

import type { InboundSocketEvents, OutboundSocketEvents } from "../../socketContracts/index";

// A playing-team phone answering the question in hand (a GEO pin, a TRIVIA choice), from the
// phone's side: its own answer card, which the server sends to this player's room alone
// (`player:minigamePlayerView`) — never in the room snapshot, because it carries this phone's own
// answer — and the road an answer takes back, `player:minigameAction`, authorized by the face this
// socket holds. The card rides in as a prop beside the seat, like the contestant's leg.
export type PhoneAnswerCardController = {
  getView: () => MinigamePlayerView | null;
  subscribe: (listener: () => void) => () => void;
  answer: (actionType: string, actionPayload: SerializableValue) => void;
  dispose: () => void;
};

export type PhoneAnswerCardSocket = Pick<Socket<InboundSocketEvents, OutboundSocketEvents>, "on" | "off" | "emit">;

export const createPhoneAnswerCardController = (socket: PhoneAnswerCardSocket): PhoneAnswerCardController => {
  let view: MinigamePlayerView | null = null;
  const listeners = new Set<() => void>();

  const handleView = ({ minigamePlayerView }: PlayerMinigamePlayerViewPayload): void => {
    view = minigamePlayerView;

    for (const listener of listeners) {
      listener();
    }
  };

  socket.on(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW, handleView);

  return {
    getView: () => view,
    subscribe: (listener) => {
      listeners.add(listener);

      return (): void => {
        listeners.delete(listener);
      };
    },
    // Fire and forget: the card that comes back is the answer's receipt. A refusal (the host locked
    // the question a beat ago) leaves the card as the server last drew it.
    answer: (actionType, actionPayload) => {
      if (view === null) {
        return;
      }

      socket.emit(CLIENT_TO_SERVER_EVENTS.PLAYER_MINIGAME_ACTION, {
        minigameId: view.minigame,
        minigameApiVersion: MINIGAME_API_VERSION,
        actionType,
        actionPayload
      });
    },
    dispose: () => {
      socket.off(SERVER_TO_CLIENT_EVENTS.PLAYER_MINIGAME_PLAYER_VIEW, handleView);
      listeners.clear();
    }
  };
};
