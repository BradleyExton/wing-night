import { schlonicPalette } from "../../palette.js";

// The end of the zone: a pole with a pennant, where everything in the runner's hands goes on
// the board.
export const GoalPost = ({
  goalX,
  groundY
}: {
  goalX: number;
  groundY: number;
}): JSX.Element => (
  <g data-schlonic-goal>
    <rect x={goalX - 0.9} y={groundY - 30} width={1.8} height={30} fill={schlonicPalette.postPole} />
    <circle cx={goalX} cy={groundY - 31} r={3.4} fill={schlonicPalette.post} />
    <path
      d={`M ${goalX + 1} ${groundY - 28} L ${goalX + 14} ${groundY - 25} L ${goalX + 1} ${groundY - 22} Z`}
      fill={schlonicPalette.pad}
      stroke={schlonicPalette.padDark}
      strokeWidth={0.4}
    />
  </g>
);
