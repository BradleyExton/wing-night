import type { JoustShooterProfile } from "../types.js";

/**
 * The shot as it has always flown: the values every constant in `world/` and `simulate/` used to
 * hard-code, gathered into one profile so a content file can author a kind as a diff against it.
 * A pin is light next to it (`massShare` 0.15) so it ploughs on down the rack instead of stopping
 * dead in the first player; a leg is heavier still (`legShare` 0.35) so a tower is something to
 * bounce off unless there is real weight behind the shot.
 */
export const JOUST_STANDARD_SHOOTER_PROFILE: JoustShooterProfile = Object.freeze({
  shaftRadius: 2.3,
  headRadius: 3.3,
  ballRadius: 2.5,
  linkSpacing: 3,
  massShare: 0.15,
  legShare: 0.35,
  restitution: 0.32,
  slip: 0.7,
  bendStiffness: 0.45,
  damping: 0.999,
  launchSpeedScale: 1
});

const PROFILE_KEYS = Object.keys(JOUST_STANDARD_SHOOTER_PROFILE) as (keyof JoustShooterProfile)[];

/**
 * A full profile from a partial one: every lever the overrides leave out is the Standard's. The
 * content validator has already kept the numbers inside the ranges the integrator is sane over;
 * this only fills the gaps, so a kind authored as `{ launchSpeedScale: 0.75 }` is exactly today's
 * shot thrown softer.
 */
export const resolveJoustShooterProfile = (
  overrides?: Partial<JoustShooterProfile> | null
): JoustShooterProfile => {
  if (overrides === undefined || overrides === null) {
    return JOUST_STANDARD_SHOOTER_PROFILE;
  }

  const resolved: Record<keyof JoustShooterProfile, number> = {
    ...JOUST_STANDARD_SHOOTER_PROFILE
  };

  for (const key of PROFILE_KEYS) {
    const value = overrides[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      resolved[key] = value;
    }
  }

  return resolved;
};
