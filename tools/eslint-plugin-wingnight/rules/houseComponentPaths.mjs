// The trees whose styles.ts files are on semantic colour tokens. apps/client is the app;
// packages/cast is the shared character system, split out so minigame packages can draw the
// bird — it left the app, but not the idiom; packages/scenery is the city's landmarks, hoisted
// out of SCHLONIC's backdrop for JOUST to stand too, and it carries no colour at all (every hex
// reaches it as a palette prop); packages/surface is the shared design system. The minigame
// client trees joined on 2026-09-24 with the migration BACKLOG.md named: their chrome is on
// tokens, and the scene art that is licensed to carry its own palette (DESIGN.md §2.4, §2.5,
// §2.7, §2.9, §2.11) lives in `palette.ts` files or in `scene*` exports, which the colour rule
// exempts by name.
const HOUSE_COMPONENT_PATH_MARKERS = [
  "/apps/client/src/components/",
  "/packages/cast/src/",
  "/packages/scenery/src/",
  "/packages/surface/src/",
  "/packages/minigames/"
];

export const normalizeFilename = (filename) =>
  typeof filename === "string" ? filename.replace(/\\/g, "/") : "";

export const isHouseComponentPath = (filename) => {
  const normalized = normalizeFilename(filename);
  return HOUSE_COMPONENT_PATH_MARKERS.some((marker) => normalized.includes(marker));
};

// `styleTokens/index.ts` is a styles file by content if not by name: it is the design system's
// class strings, and leaving it off the list is how `bg-black/20` sat in the deck for months.
export const isHouseStylesFile = (filename) => {
  const normalized = normalizeFilename(filename);
  return (
    isHouseComponentPath(filename) &&
    (normalized.endsWith("/styles.ts") || normalized.endsWith("/styleTokens/index.ts"))
  );
};
