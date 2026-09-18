// The route the server serves the content pack's images from, and the resolver
// that turns a pack-relative `avatarSrc` / `imageSrc` into a URL the TV can
// actually fetch.
//
// Shared for the same reason `TEAM_AUDIO_ROUTE_PATH` is: the express mount and
// every surface that renders one of these images have to agree on the string,
// so a rename is a typecheck failure instead of a silent 404 on the TV.
export const CONTENT_ASSET_ROUTE_PATH = "/content-assets";

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

// The contract, in one place, because content authors write these by hand in
// players.json and minigames/geo.json:
//
// - `avatars/rob.png` (no leading slash) is PACK-RELATIVE: it lives in the
//   content pack under `local/assets/` (or `sample/assets/`) and is served by
//   the express app, so it must be resolved against the SERVER origin. There is
//   no dev proxy in this repo — the client is always a different origin — so a
//   root-relative URL would resolve against Vite and 404 on the TV. This is the
//   spelling `pnpm import:avatars` and `pnpm import:geo` write.
// - `/sample-assets/geo/eiffel-tower.svg` (leading slash) is left ALONE: the
//   sample pack's placeholder art is committed to the client's own public/
//   directory and is served by Vite, so it is already correct as authored.
// - `https://…` and `data:…` are left alone too, so a pack can point at art it
//   does not own.
//
// `null` when the origin is not known yet rather than a relative URL: the
// origin read touches `window`, so it lands one paint late, and a surface that
// fell back to a relative URL would fire a 404 request against Vite on that
// first paint and cache the miss.
export const resolveContentAssetSrc = (
  assetSrc: string,
  serverOrigin: string | null
): string | null => {
  const normalizedAssetSrc = assetSrc.trim();

  if (normalizedAssetSrc.length === 0) {
    return null;
  }

  if (
    normalizedAssetSrc.startsWith("/") ||
    ABSOLUTE_URL_PATTERN.test(normalizedAssetSrc)
  ) {
    return normalizedAssetSrc;
  }

  if (serverOrigin === null || serverOrigin.trim().length === 0) {
    return null;
  }

  // Encoded per segment, not whole: pack paths are directories plus a file name
  // ("avatars/steve b.png"), so the separators have to survive while spaces and
  // apostrophes in a name do not.
  const encodedPath = normalizedAssetSrc
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${serverOrigin.trim()}${CONTENT_ASSET_ROUTE_PATH}/${encodedPath}`;
};
