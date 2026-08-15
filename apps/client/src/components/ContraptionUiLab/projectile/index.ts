// AC#5 — the one question in this lab that reaches back into the physics.
//
// The WN-17/WN-23 integrator models bodies as circles with position only: `CircleBody` carries
// origin/radius/restitution/slip and there is no angular velocity, no torque, no orientation. A
// sprite rendered over such a body therefore keeps a FIXED orientation for the whole run, however
// far it slides or bounces.
//
// This module records what that looks like for each candidate projectile. It deliberately does NOT
// pick one: the frontmatter reserves the pick for the human, so what belongs here is the
// observation, not the verdict.
export type ProjectileId = "drumette" | "wing-bone";

export const DEFAULT_PROJECTILE_ID: ProjectileId = "drumette";

export type ProjectileMeta = {
  id: ProjectileId;
  label: string;
  /**
   * Whether a fixed-orientation sprite still reads correctly while sliding. This is the
   * observation, recorded from the scene — not a recommendation.
   */
  readsCorrectlyWithoutRotation: boolean;
  observation: string;
};

export const PROJECTILES: readonly ProjectileMeta[] = [
  {
    id: "drumette",
    label: "Drumette",
    readsCorrectlyWithoutRotation: true,
    observation:
      "Reads round. A fixed orientation is invisible because a roughly radially-symmetric shape " +
      "looks the same at every angle, so sliding without tumbling never contradicts the eye."
  },
  {
    id: "wing-bone",
    label: "Wing bone (flat)",
    readsCorrectlyWithoutRotation: false,
    observation:
      "Reads broken while sliding. A flat elongated shape holding one angle down a ramp looks " +
      "pinned rather than tumbling, and the longer the slide the more wrong it looks."
  }
];

export const resolveProjectileMeta = (id: ProjectileId): ProjectileMeta => {
  const found = PROJECTILES.find((projectile) => projectile.id === id);

  return found ?? PROJECTILES[0];
};

/**
 * The physics consequence, stated as an implication rather than a decision: rotation is only
 * needed if the flat shape is the one chosen. Whoever makes the pick reads this and decides; the
 * lab does not decide for them, and nothing here adds angular state to the WN-23 module.
 */
export const requiresAngularVelocity = (id: ProjectileId): boolean => {
  return !resolveProjectileMeta(id).readsCorrectlyWithoutRotation;
};
