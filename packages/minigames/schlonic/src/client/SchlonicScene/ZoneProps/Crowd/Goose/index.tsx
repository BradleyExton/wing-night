import { schlonicPalette } from "../../../palette.js";
import { GroundShadow } from "../../GroundShadow/index.js";

const OUTLINE = 0.45;

/**
 * The goose: the Canada goose off the waterfront that has wandered up Dunlop and will not get
 * out of anybody's way. Drawn at the origin with its feet on it, side on, facing down the
 * street, so the zone places it as one of the crowd and the wipeout's punchline can walk one
 * in from the edge to eat the wings. Grey-white body, the black neck with the white chin strap,
 * the orange bill and legs: what makes it a goose at the size of a thumbnail.
 */
export const Goose = (): JSX.Element => {
  const body = "M -3.2 -1.2 Q -3.6 -4.4 0 -4.6 Q 2.6 -4.6 3.2 -2.6 L 3.6 -1.4 Q 2.4 0 0 -0.4 Q -2.4 0 -3.2 -1.2 Z";
  const neck = "M 2.2 -3.6 Q 2.4 -6.6 3.4 -7.6";
  const head = "M 2.6 -8.4 Q 2.6 -9.6 3.8 -9.6 Q 5.2 -9.6 5.2 -8.4 Q 5.2 -7.6 4 -7.4 Q 2.6 -7.4 2.6 -8.4 Z";

  return (
    <g data-schlonic-goose>
      <GroundShadow x={0} y={0} radius={3.4} />
      {/* Legs. */}
      <path d="M -0.8 -0.6 L -1.2 0 M 0.9 -0.6 L 1.1 0" stroke={schlonicPalette.gooseBill} strokeWidth={0.5} strokeLinecap="round" />
      <path d="M -2 0 L -0.4 0 M 0.4 0 L 2 0" stroke={schlonicPalette.gooseBill} strokeWidth={0.5} strokeLinecap="round" />
      {/* The body, its darker back, and the tail. */}
      <path d={body} fill={schlonicPalette.gooseBody} stroke={schlonicPalette.gooseNeck} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <path d="M -3 -1.6 Q -3.2 -4 0 -4.3 Q 1.6 -4.3 2.4 -3.4 Q 0.6 -3.2 -1.6 -2.2 Z" fill={schlonicPalette.gooseDark} />
      <path d="M -3.2 -1.2 L -4.8 -2.8 L -3.4 -3.2 Z" fill={schlonicPalette.gooseNeck} />
      {/* The neck, up and forward, then the head with its chin strap. */}
      <path d={neck} fill="none" stroke={schlonicPalette.gooseNeck} strokeWidth={1.5} strokeLinecap="round" />
      <path d={head} fill={schlonicPalette.gooseNeck} />
      <path d="M 3.4 -7.5 Q 4.2 -8.2 4.9 -8" fill="none" stroke={schlonicPalette.gooseChin} strokeWidth={0.55} strokeLinecap="round" />
      <path d="M 5.1 -8.9 L 6.9 -8.4 L 5.1 -7.9 Z" fill={schlonicPalette.gooseBill} />
      <circle cx={4.2} cy={-8.9} r={0.32} fill={schlonicPalette.gooseChin} />
    </g>
  );
};
