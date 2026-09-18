// The trees whose React components follow the house component idiom (index.tsx
// entry, sibling styles.ts, semantic colour tokens). apps/client is the app;
// packages/cast is the shared character system, split out so minigame packages
// can draw the bird — it left the app, but not the idiom.
const HOUSE_COMPONENT_PATH_MARKERS = ["/apps/client/src/components/", "/packages/cast/src/"];

export const normalizeFilename = (filename) =>
  typeof filename === "string" ? filename.replace(/\\/g, "/") : "";

export const isHouseComponentPath = (filename) => {
  const normalized = normalizeFilename(filename);
  return HOUSE_COMPONENT_PATH_MARKERS.some((marker) => normalized.includes(marker));
};

export const isHouseStylesFile = (filename) =>
  isHouseComponentPath(filename) && normalizeFilename(filename).endsWith("/styles.ts");
