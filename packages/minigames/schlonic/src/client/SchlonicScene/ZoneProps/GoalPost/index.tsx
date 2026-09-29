import { useId } from "react";

import { schlonicPalette } from "../../palette.js";

// The end of the zone, on the Queen's patio under BAR: where everything in the runner's hands
// goes on the board. A finish line painted across the sidewalk, and a checkered disc on a short
// post between the patio umbrellas — the Sonic signpost, sized to stand under the hotel's green
// fascia rather than up through the lettering on it, because the BAR over it is half the joke.

const SQUARE = 1.5;
/** The painted line: two squares wide, down the whole depth of the sidewalk. */
const LINE_COLUMNS = 2;
const LINE_ROWS = 4;
/**
 * The disc's middle, over the ground: its rim clears the underside of the Queen's fascia (8.8
 * up at the hotel's scale), so BAR stays readable over it.
 */
const DISC_RISE = 5.9;
const DISC_RADIUS = 2.7;
const FLAG_SQUARE = 1.3;

export const GoalPost = ({
  goalX,
  groundY
}: {
  goalX: number;
  groundY: number;
}): JSX.Element => {
  const discY = groundY - DISC_RISE;
  const lineLeft = goalX - (LINE_COLUMNS * SQUARE) / 2;
  const flagId = `schlonic-finish${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <g data-schlonic-goal>
      <g>
        {Array.from({ length: LINE_COLUMNS * LINE_ROWS }, (_unused, square) => {
          const column = square % LINE_COLUMNS;
          const row = Math.floor(square / LINE_COLUMNS);

          return (
            <rect
              key={square}
              x={lineLeft + column * SQUARE}
              y={groundY + row * SQUARE}
              width={SQUARE}
              height={SQUARE}
              fill={(column + row) % 2 === 0 ? schlonicPalette.post : schlonicPalette.signInk}
            />
          );
        })}
      </g>
      <rect x={goalX - 0.45} y={discY} width={0.9} height={groundY - discY} fill={schlonicPalette.postPole} />
      <rect x={goalX - 1.8} y={groundY - 0.6} width={3.6} height={0.8} rx={0.3} fill={schlonicPalette.signInk} />
      <circle cx={goalX} cy={discY} r={DISC_RADIUS + 0.45} fill={schlonicPalette.queensGreen} />
      <circle cx={goalX} cy={discY} r={DISC_RADIUS} fill={schlonicPalette.post} />
      {/* The disc is a chequered flag: squares laid square to the screen, clipped round. */}
      <defs>
        <pattern id={flagId} patternUnits="userSpaceOnUse" x={goalX} y={discY} width={FLAG_SQUARE * 2} height={FLAG_SQUARE * 2}>
          <rect width={FLAG_SQUARE} height={FLAG_SQUARE} fill={schlonicPalette.signInk} />
          <rect x={FLAG_SQUARE} y={FLAG_SQUARE} width={FLAG_SQUARE} height={FLAG_SQUARE} fill={schlonicPalette.signInk} />
        </pattern>
      </defs>
      <circle cx={goalX} cy={discY} r={DISC_RADIUS} fill={`url(#${flagId})`} />
      <circle cx={goalX} cy={discY} r={DISC_RADIUS} fill="none" stroke={schlonicPalette.queensGreen} strokeWidth={0.4} />
    </g>
  );
};
