// The broody bird's measurements the country kit is fitted to, ported from the
// harness's country-kit.js so a cast item builds the same path strings: the
// body's front edge (a Top that runs down it starts at the head's shoulders,
// so its path depends on the head) and the wing's trailing edge (the fringe
// sleeve's ink cuff follows it). Rounding is the harness's `f1`, to the
// hundredth, so the strings match digit for digit.

export const f1 = (n: number): number => Math.round(n * 100) / 100;

// The broody body's front edge, sampled off its path: [y, x].
const FRONT: ReadonlyArray<readonly [number, number]> = [
  [29, 52],
  [30.2, 56.4],
  [32.1, 60.1],
  [34.5, 63],
  [37.3, 65.2],
  [40.5, 66.8],
  [43.9, 67.6],
  [47.5, 67.9],
  [51, 67.5],
  [54.6, 66.5],
  [58, 65],
  [60.5, 61.9],
  [62.5, 57.6]
];

/** x of the body's front edge at height y, pulled in by `inset`. */
export const frontX = (y: number, inset = 0.6): number => {
  for (let i = 1; i < FRONT.length; i += 1) {
    const [y0, x0] = FRONT[i - 1] ?? [0, 0];
    const [y1, x1] = FRONT[i] ?? [0, 0];
    if (y <= y1) {
      return f1(x0 + ((x1 - x0) * Math.max(0, y - y0)) / (y1 - y0) - inset);
    }
  }
  return f1(57.6 - inset);
};

/** " L x y" points down the front edge from y0 to y1 (y0 < y1). */
export const frontEdge = (y0: number, y1: number, inset = 0.6): string => {
  const out: string[] = [];
  for (let y = y0; y < y1; y += 1.5) {
    out.push(`L ${frontX(y, inset)} ${f1(y)}`);
  }
  out.push(`L ${frontX(y1, inset)} ${f1(y1)}`);
  return out.join(" ");
};
