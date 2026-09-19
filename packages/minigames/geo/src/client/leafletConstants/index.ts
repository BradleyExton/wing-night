// Leaflet path options take raw color values (JS props, not CSS classes), so
// the theme hexes from DESIGN.md live here as the single source for map pins.
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const GUESS_PIN_COLOR = "#F97316";

export const ANSWER_PIN_COLOR = "#22C55E";

export const CONNECTION_LINE_COLOR = "#A3A3A3";

export const WORLD_CENTER: [number, number] = [20, 0];

export const WORLD_ZOOM = 2;

// Web-Mercator clips at ±85°, so this is the whole drawable world.
export const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180]
];

export const REVEAL_FIT_PADDING: [number, number] = [48, 48];

export const REVEAL_MAX_ZOOM = 12;

// Quick views for the guess chart. Almost every photo in the night pack was
// taken either around Barrie or somewhere else entirely, so panning from the
// whole world down to the home town by hand was the slowest part of a turn.
// Two taps replace it. Add a row here to add a view.
export type GeoMapView = {
  id: string;
  label: string;
  center: [number, number];
  zoom: number;
};

export const BARRIE_CENTER: [number, number] = [44.3894, -79.6903];

export const BARRIE_ZOOM = 11;

export const GEO_MAP_VIEWS: GeoMapView[] = [
  { id: "world", label: "World", center: WORLD_CENTER, zoom: WORLD_ZOOM },
  { id: "barrie", label: "Barrie", center: BARRIE_CENTER, zoom: BARRIE_ZOOM }
];

export const GEO_MAP_VIEW_FLY_SECONDS = 0.7;
