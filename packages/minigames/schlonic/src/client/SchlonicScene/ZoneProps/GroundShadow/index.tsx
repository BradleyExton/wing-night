import { schlonicPalette } from "../../palette.js";

// The smudge under anything standing on the turf, so a prop sits on the ground rather than
// floating over it.
export const GroundShadow = ({
  x,
  y,
  radius
}: {
  x: number;
  y: number;
  radius: number;
}): JSX.Element => (
  <ellipse cx={x} cy={y + 0.5} rx={radius} ry={1.1} fill={schlonicPalette.shadow} opacity={0.3} />
);
