import * as styles from "./styles.js";

// lit-floor a (disco Stage), ported from the harness's disco-show.js: the
// Saturday Night Fever floor under the feet, two rows of six tiles in
// perspective on ink grout, every tile always lit, white and team. It flips
// like a chequerboard on every beat, so the whole floor pulses; ink is only
// ever the grout, never a tile, and never ember, where the leg-orange feet
// would vanish. A showpiece: never drawn in a game, whose ground is its own.
//
// The tiles are the harness's perspective grid (vanishing point (40, 28),
// rows 66 / 71.4 / 77.4, columns every 13) written out, back row first.
const TILES = [
  "M 9.23 66 L 19.23 66 L 16.28 71.4 L 4.86 71.4 Z",
  "M 19.23 66 L 29.23 66 L 27.7 71.4 L 16.28 71.4 Z",
  "M 29.23 66 L 39.23 66 L 39.12 71.4 L 27.7 71.4 Z",
  "M 39.23 66 L 49.23 66 L 50.54 71.4 L 39.12 71.4 Z",
  "M 49.23 66 L 59.23 66 L 61.96 71.4 L 50.54 71.4 Z",
  "M 59.23 66 L 69.23 66 L 73.38 71.4 L 61.96 71.4 Z",
  "M 4.86 71.4 L 16.28 71.4 L 13 77.4 L 0 77.4 Z",
  "M 16.28 71.4 L 27.7 71.4 L 26 77.4 L 13 77.4 Z",
  "M 27.7 71.4 L 39.12 71.4 L 39 77.4 L 26 77.4 Z",
  "M 39.12 71.4 L 50.54 71.4 L 52 77.4 L 39 77.4 Z",
  "M 50.54 71.4 L 61.96 71.4 L 65 77.4 L 52 77.4 Z",
  "M 61.96 71.4 L 73.38 71.4 L 78 77.4 L 65 77.4 Z"
];

// A tile is team where its row and column add up odd, as in the harness.
const isTeamTile = (index: number): boolean => (Math.floor(index / 6) + (index % 6)) % 2 === 1;

// Its one style is `team`, so the drawing reads nothing from its context.
export const LitFloorA = (): JSX.Element => {
  return (
    <g>
      {TILES.map((d, index) => (
        <path key={d} className={isTeamTile(index) ? styles.teamTile : styles.whiteTile} d={d} />
      ))}
    </g>
  );
};
