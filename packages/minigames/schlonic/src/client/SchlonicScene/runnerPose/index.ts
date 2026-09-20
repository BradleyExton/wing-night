/**
 * How the runner is held at one frame. The runner is the player's own cast hen (§2.8), so unlike
 * the schlong it has no spine to bend — its pose is how the whole bird is turned and how tightly
 * it is tucked. On its feet it runs, leaning with the ground; the moment it leaves the ground it
 * tucks and spins, which is both the Sonic move and the rule: a spinning bird is what squashes
 * what is standing in the zone.
 *
 * Everything here is a pure function of the frame, with no state kept between paints, so the
 * tablet and the TV draw the same runner from the same frame without having to agree on
 * anything: the spin comes off the distance travelled, and so does the run's own bob.
 */
export type RunnerPose = {
  /** Degrees the whole bird is turned through, about the hitbox's centre. */
  angle: number;
  /** 0 on its feet, 1 fully tucked. Pulls the bird onto its own centre so the spin does not orbit. */
  tuck: number;
  /** A small bounce in the step, in world units, so a running bird is not a sliding one. */
  bob: number;
};

/** A full turn of the spin per this many world units — it rolls rather than spins on the spot. */
const SPIN_UNITS = 26;
/** One bounce of the step per this many world units. */
const STRIDE_UNITS = 13;
const BOB_UNITS = 0.7;

export type RunnerPoseInput = {
  /** Distance travelled, which is what drives both the step and the spin. */
  x: number;
  grounded: boolean;
  /** The ground's gradient under the runner, so a hill is leaned into rather than stood on. */
  slope: number;
  /** 0 on its feet, 1 fully tucked. The scene eases this so the tuck is not a jump cut. */
  curl: number;
};

export const resolveRunnerPose = ({ x, grounded, slope, curl }: RunnerPoseInput): RunnerPose => {
  const eased = Math.max(0, Math.min(1, curl));
  const leanDegrees = (Math.atan(slope) * 180) / Math.PI;
  const spinDegrees = (x / SPIN_UNITS) * 360;

  return {
    angle: leanDegrees * (1 - eased) + spinDegrees * eased,
    tuck: eased,
    // A bird in a ball has no step to bounce.
    bob: grounded ? Math.abs(Math.sin((x / STRIDE_UNITS) * Math.PI)) * BOB_UNITS * (1 - eased) : 0
  };
};

/** How tucked the runner is at this frame. Off the ground it curls, and it curls fast. */
export const resolveRunnerCurl = (grounded: boolean, previousCurl: number): number => {
  const target = grounded ? 0 : 1;

  return previousCurl + (target - previousCurl) * 0.45;
};
