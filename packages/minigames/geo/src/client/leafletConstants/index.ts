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

// The chart's graticule: a faint lat/lng grid drawn under the pins on every GEO map, so a party
// whose Wi-Fi cannot reach the tile server (or a headless test with no network) still has a chart
// to aim at and tap rather than a blank ground. Every 30 degrees, like a school atlas.
export const GRATICULE_COLOR = "#FFFFFF";

// Bright enough to aim at on the bare ground when no tile arrives; faint enough under real tiles.
export const GRATICULE_OPACITY = 0.24;

export const GRATICULE_STEP_DEGREES = 30;

const graticuleSteps = (from: number, to: number): number[] => {
  const steps: number[] = [];

  for (let value = from; value <= to; value += GRATICULE_STEP_DEGREES) {
    steps.push(value);
  }

  return steps;
};

// Each line as a list of [lat, lng] points, for a non-interactive Polyline each.
export const GRATICULE_LINES: [number, number][][] = [
  ...graticuleSteps(-60, 60).map((lat): [number, number][] => [
    [lat, -180],
    [lat, 180]
  ]),
  ...graticuleSteps(-180, 180).map((lng): [number, number][] => [
    [-85, lng],
    [85, lng]
  ])
];
