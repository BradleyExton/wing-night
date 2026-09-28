import {
  EATING_AUDIO_ROUTE_PATH,
  MUSIC_PLAYBACK_SOURCES,
  type MusicPlaybackSource
} from "@wingnight/shared";

import { resolveAnthemSrc } from "../resolveAnthemSrc";
import { resolveLobbyTrackSrc } from "../resolveLobbyTrackSrc";

// The server names a track by source and filename; only the client knows the
// server origin, and only this function knows which route each source is served
// from. The origin is INJECTED for the same reason both resolvers below inject
// it: client tests run under `tsx --test` with no DOM, so a `window` read at
// module scope throws.
export const resolveMusicTrackSrc = (
  source: MusicPlaybackSource,
  trackFileName: string,
  serverOrigin: string
): string => {
  if (source === MUSIC_PLAYBACK_SOURCES.LOBBY) {
    return resolveLobbyTrackSrc(trackFileName, serverOrigin);
  }

  if (source === MUSIC_PLAYBACK_SOURCES.EATING) {
    return `${serverOrigin}${EATING_AUDIO_ROUTE_PATH}/${encodeURIComponent(trackFileName)}`;
  }

  return resolveAnthemSrc(trackFileName, serverOrigin);
};
