// The fixed shapes the harness's metal-show.js builds more than once, written
// out: no item in that unit places itself by its context, so every path is a
// literal.

// `guitarV(SLUNG)`: the Flying V slung across the back that variants a and b
// share. Neck, headstock, then the V body.
export const SLUNG_GUITAR = [
  "M 29.83 45.56 L 18.44 19.98 L 14.6 21.69 L 25.99 47.27 Z",
  "M 18.91 20.31 L 16.69 13.1 L 8.04 15.31 L 14.25 22.39 Z",
  "M 26.48 43.22 L 31.03 42.61 L 45.28 58.38 L 38.94 57.92 L 30.55 52.35 L 29.07 62.31 L 25.18 67.33 L 22.99 46.19 Z"
];

export const SLUNG_PICKUP_BAR = "M 31.68 46.05 L 32.66 48.24 L 26.08 51.17 L 25.11 48.97 Z";

export const SLUNG_NUT_BAR = "M 18.36 19.8 L 19.17 21.62 L 15.33 23.33 L 14.52 21.51 Z";

// `ellipsePath(39, 72.5, 37, 7)`: the ink disc under the feet.
export const STAGE_DISC = "M 2 72.5 A 37 7 0 1 0 76 72.5 A 37 7 0 1 0 2 72.5 Z";
