import {
  CLIENT_TO_SERVER_EVENTS,
  type MusicPlaybackSource,
  type MusicTrackEndedPayload
} from "@wingnight/shared";
import type { Socket } from "socket.io-client";

import type {
  InboundSocketEvents,
  OutboundSocketEvents
} from "../../socketContracts/index";

// The display's entire outbound surface, and it is deliberately one message.
//
// `hostRequests` is the shape this mirrors, minus the host secret — there is
// none to send, because the display never claims control. That is what keeps
// "the display is read-only" (SPEC.md §1) true in the sense that matters: this
// reports an observation about the room's speaker, not an instruction about the
// game. The server treats it as a report too, ignoring any that does not name
// the track it already believes is playing.
export type DisplayReportSocket = Pick<
  Socket<InboundSocketEvents, OutboundSocketEvents>,
  "emit"
>;

export type DisplayReportHandlers = {
  onMusicTrackEnded: (
    source: MusicPlaybackSource,
    trackIndex: number
  ) => void;
};

export const createDisplayReportHandlers = (
  socket: DisplayReportSocket
): DisplayReportHandlers => {
  return {
    onMusicTrackEnded: (source, trackIndex): void => {
      const payload: MusicTrackEndedPayload = { source, trackIndex };

      socket.emit(CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED, payload);
    }
  };
};
