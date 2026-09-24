// The trees whose styles.ts files are already on semantic colour tokens. apps/client is
// the app; packages/cast is the shared character system, split out so minigame packages
// can draw the bird — it left the app, but not the idiom; packages/scenery is the city's
// landmarks, hoisted out of SCHLONIC's backdrop for JOUST to stand too, and it carries no
// colour at all (every hex reaches it as a palette prop); packages/surface is the shared
// design system. The minigame client trees keep the folder shape and are governed by every
// other house rule, but ~50 of their styles.ts literals are still raw hex from before the
// tokens existed, so they join this list with that migration, not before (BACKLOG.md).
const HOUSE_COMPONENT_PATH_MARKERS = [
  "/apps/client/src/components/",
  "/packages/cast/src/",
  "/packages/scenery/src/",
  "/packages/surface/src/"
];

export const normalizeFilename = (filename) =>
  typeof filename === "string" ? filename.replace(/\\/g, "/") : "";

export const isHouseComponentPath = (filename) => {
  const normalized = normalizeFilename(filename);
  return HOUSE_COMPONENT_PATH_MARKERS.some((marker) => normalized.includes(marker));
};

export const isHouseStylesFile = (filename) =>
  isHouseComponentPath(filename) && normalizeFilename(filename).endsWith("/styles.ts");
