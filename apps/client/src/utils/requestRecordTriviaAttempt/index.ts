import type { Socket } from "socket.io-client";
import type { SerializableValue } from "@wingnight/minigames-core";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { requestMinigameAction } from "../requestMinigameAction";

type RecordTriviaAttemptSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestRecordTriviaAttempt = (
  socket: RecordTriviaAttemptSocket,
  isCorrect: boolean,
  onMissingHostSecret?: () => void,
  getHostSecret?: () => string | null
): boolean => {
  return requestMinigameAction(
    socket,
    "TRIVIA",
    "recordAttempt",
    { isCorrect } satisfies SerializableValue,
    onMissingHostSecret,
    getHostSecret
  );
};
