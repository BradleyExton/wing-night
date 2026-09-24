/** The dock's boards, its pilings, and the hull, mast and sail of the boats tied to it. */
export type MarinaPalette = {
  dock: string;
  dockDark: string;
  hull: string;
  mast: string;
  sail: string;
};

/** One boat on the bay: hull, mast, main and jib. The marina keeps a few hundred of these. */
const Sailboat = ({
  x,
  waterY,
  scale,
  palette
}: {
  x: number;
  waterY: number;
  scale: number;
  palette: MarinaPalette;
}): JSX.Element => (
  <g transform={`translate(${x} ${waterY}) scale(${scale})`}>
    <path d="M -3.2 0 L 3.2 0 L 2.1 1.5 L -2.1 1.5 Z" fill={palette.hull} />
    <rect x={-0.18} y={-7.2} width={0.36} height={7.2} fill={palette.mast} />
    <path d="M 0.4 -6.9 L 3.6 -0.4 L 0.4 -0.4 Z" fill={palette.sail} />
    <path d="M -0.4 -5.6 L -2.7 -0.4 L -0.4 -0.4 Z" fill={palette.sail} opacity={0.88} />
  </g>
);

/** The marina: a finger of dock on its pilings, with two boats tied off it. */
export const Marina = ({
  x,
  baseY,
  palette
}: {
  x: number;
  baseY: number;
  palette: MarinaPalette;
}): JSX.Element => (
  <g data-scenery-marina>
    <rect x={x} y={baseY - 2.6} width={24} height={1.3} fill={palette.dock} />
    {[1, 8, 15, 22].map((offset) => (
      <rect key={offset} x={x + offset} y={baseY - 1.4} width={0.9} height={2.6} fill={palette.dockDark} />
    ))}
    <Sailboat x={x + 6} waterY={baseY - 3.4} scale={0.85} palette={palette} />
    <Sailboat x={x + 18} waterY={baseY - 2.2} scale={1} palette={palette} />
  </g>
);
