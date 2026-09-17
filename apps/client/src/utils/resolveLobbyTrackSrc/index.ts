import { LOBBY_AUDIO_ROUTE_PATH } from "@wingnight/shared";

// The origin is INJECTED for the same reason `resolveAnthemSrc` injects it:
// client tests run under `tsx --test` with no DOM, so a `window` read at module
// scope throws. The one environment-dependent read stays inside the cue effect.
//
// Percent-encoded, because lobby filenames are whatever a host dropped in the
// directory — spaces, ampersands and apostrophes all turn up in track names.
export const resolveLobbyTrackSrc = (
  trackFileName: string,
  serverOrigin: string
): string => {
  return `${serverOrigin}${LOBBY_AUDIO_ROUTE_PATH}/${encodeURIComponent(trackFileName)}`;
};
