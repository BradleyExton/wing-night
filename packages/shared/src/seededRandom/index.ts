// The night's two deterministic random streams, in one place.
//
// Every simulation and world generator in this package has to produce the
// identical stream on the host tablet and on the TV — the server sends a seed,
// both clients redraw from it, and a single diverging float puts a bird in a
// different place on each screen. That rules out `Math.random`, which is not
// reproducible at all, and it rules out anything that leans on a
// implementation-defined `Math` member. Both generators below are integer
// operations only, so every engine implementing ES2022 bit operators yields the
// same sequence.
//
// They live here rather than beside each caller because four copies of a PRNG
// is four chances for one of them to be "improved" and silently desync a game.

const UINT32_RANGE = 4294967296;

/** xorshift32 is absorbing at zero, so a zero seed borrows a fixed non-zero state instead. */
const DEFAULT_XORSHIFT_STATE = 0x9e3779b9 | 0;

/**
 * xorshift32. Cheap and short-period — fine for the sub-pixel jitter the Verlet
 * simulations use it for, where the job is only to break perfect symmetry
 * reproducibly.
 */
export const createXorshift32 = (seed: number): (() => number) => {
  const truncated = seed | 0;
  let state = truncated === 0 ? DEFAULT_XORSHIFT_STATE : truncated;

  return (): number => {
    let next = state | 0;
    next ^= next << 13;
    next ^= next >>> 17;
    next ^= next << 5;
    state = next | 0;
    return (state >>> 0) / UINT32_RANGE;
  };
};

/**
 * mulberry32. Better distribution than xorshift32 and no zero-seed trap, which
 * is what the world generators want when they are laying out a whole zone.
 */
export const createMulberry32 = (seed: number): (() => number) => {
  let state = seed | 0;

  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
};

/** Inclusive on both ends, so `pickInteger(random, 1, 3)` can return 3. */
export const pickInteger = (
  random: () => number,
  min: number,
  max: number
): number => {
  return min + Math.floor(random() * (max - min + 1));
};
