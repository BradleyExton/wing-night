import { CHARACTER_BOX, DRAWN_HEAD } from "@wingnight/cast";

import { fappyPalette } from "../palette.js";

// What a glob leaves on the bird: three blobs across the head and a couple
// of drips off them, in the hen's own 80×72 box so it sits where the face
// is whichever head the player wears. The scene moves it with the bird and
// fades it out; nothing in here animates.
export const Goo = (): JSX.Element => {
  const { cx, cy, r } = DRAWN_HEAD;
  const blob = { fill: fappyPalette.spit, stroke: fappyPalette.spitEdge, strokeWidth: 0.9 };

  return (
    <svg viewBox={`0 0 ${CHARACTER_BOX.width} ${CHARACTER_BOX.height}`} aria-hidden="true">
      <path
        d={`M ${cx + 6} ${cy + 2} q 2 8 0 15 q -1.5 2.5 -3 0 q -1 -8 0 -15 Z`}
        {...blob}
      />
      <path
        d={`M ${cx - 4} ${cy + 6} q 1.5 5 0 9 q -1 1.5 -2 0 q -1 -5 0 -9 Z`}
        {...blob}
      />
      <circle cx={cx + 2} cy={cy - r * 0.4} r={r * 0.62} {...blob} />
      <circle cx={cx + r * 0.7} cy={cy + 1} r={r * 0.42} {...blob} />
      <circle cx={cx - r * 0.55} cy={cy - r * 0.15} r={r * 0.36} {...blob} />
      <circle cx={cx - 1} cy={cy - r * 0.7} r={r * 0.2} fill="#ffffff" />
    </svg>
  );
};
