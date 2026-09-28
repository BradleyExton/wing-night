// Recorded takes for a game's cues: the route that lists them and the shape it
// answers with.
//
// A take is an audio file in the pack at `assets/sfx/<game>/<cue>-<n>.mp3`,
// served by the ordinary content-asset mount. There is nothing to author: the
// route lists whatever files sit in the folder, grouped by the cue name before
// the first dash, so `topple-1.mp3` and `topple-wet.wav` are both takes of
// `topple`. A cue with no takes keeps its synthesised voice.
//
// Shared for the reason `DEV_SANDBOX_MANIFEST_ROUTE_PATH` is: the express mount
// and the TV's fetch have to agree on the string, so a rename is a typecheck
// failure rather than a room that silently falls back to synthesis.
export const SFX_TAKES_ROUTE_PATH = "/sfx-takes";

// The pack folder under a layer's `assets/`, which is also the path segment
// under `CONTENT_ASSET_ROUTE_PATH` the takes are served from.
export const SFX_ASSET_DIR = "sfx";

// Keyed by cue name. Each take is a ROOT-RELATIVE path on the server
// (`/content-assets/sfx/joust/topple-1.mp3`): the server does not know which
// origin the TV reached it on, so the client resolves each path against the
// URL it fetched the listing from.
export type SfxTakesListing = {
  takes: Record<string, string[]>;
};

export const resolveSfxTakesUrl = (
  game: string,
  serverOrigin: string | null
): string | null => {
  if (serverOrigin === null || serverOrigin.trim().length === 0) {
    return null;
  }

  return `${serverOrigin.trim()}${SFX_TAKES_ROUTE_PATH}/${encodeURIComponent(game)}`;
};
