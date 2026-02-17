import {
  CLIENT_TO_SERVER_EVENTS,
  type MinigameRecordTriviaAttemptPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";
import { readHostSecret } from "../hostSecretStorage";

type RecordTriviaAttemptSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export const requestRecordTriviaAttempt = (
  socket: RecordTriviaAttemptSocket,
  isCorrect: boolean,
  onMissingHostSecret?: () => void,
  getHostSecret: () => string | null = readHostSecret
): boolean => {
  const hostSecret = getHostSecret();

  if (!hostSecret) {
    onMissingHostSecret?.();
    return false;
  }

  const payload: MinigameRecordTriviaAttemptPayload = {
    hostSecret,
    isCorrect
  };
  socket.emit(CLIENT_TO_SERVER_EVENTS.RECORD_TRIVIA_ATTEMPT, payload);

  return true;
};
