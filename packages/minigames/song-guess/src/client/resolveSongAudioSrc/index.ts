import { SONG_GUESS_AUDIO_ROUTE_PATH } from "@wingnight/shared";

// The origin is INJECTED rather than read here, for the same reason
// `resolveAnthemSrc` injects it: package tests run under `tsx --test` with no
// DOM and no Vite, so any `window` / `import.meta.env` read at module or render
// scope throws. Keeping this a pure function leaves the one environment read
// (the client app's `resolveServerOrigin`) inside an effect.
//
// The filename is percent-encoded — song filenames routinely carry spaces,
// apostrophes and parentheses.
export const resolveSongAudioSrc = (
  audioFileName: string,
  serverOrigin: string
): string => {
  return `${serverOrigin}${SONG_GUESS_AUDIO_ROUTE_PATH}/${encodeURIComponent(
    audioFileName
  )}`;
};
