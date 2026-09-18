import type { Player } from "@wingnight/shared";

export const CHARACTER_BODIES = ["round", "tall", "wide"] as const;
export type CharacterBody = (typeof CHARACTER_BODIES)[number];

export const CHARACTER_COMBS = ["none", "crest", "mohawk"] as const;
export type CharacterComb = (typeof CHARACTER_COMBS)[number];

export const CHARACTER_TAILS = ["fan", "plume"] as const;
export type CharacterTail = (typeof CHARACTER_TAILS)[number];

// Everything `<Character>` needs to draw one cast member. Colour is NOT here:
// it belongs to the team, not the player, and is resolved by the surface that
// knows the seating (see `resolveTeamColorVariant`).
export type CharacterAppearance = {
  body: CharacterBody;
  comb: CharacterComb;
  tail: CharacterTail;
  avatarSrc?: string;
};

// Seeded off the NAME, not the id. Player ids are positional in players.json,
// so an id seed would hand Brad a new body every time the roster is reordered.
// The name is the one thing about a player that is the same night after night.
// Case and surrounding whitespace are ignored so "brad " and "Brad" agree.
const hashName = (name: string): number => {
  const normalizedName = name.trim().toLowerCase();
  let hash = 2166136261;

  for (let index = 0; index < normalizedName.length; index += 1) {
    hash ^= normalizedName.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash;
};

export const resolvePlayerAppearance = (
  player: Pick<Player, "name" | "avatarSrc">
): CharacterAppearance => {
  const hash = hashName(player.name);
  // Each choice reads its own bit range so the three do not move in lockstep
  // across the roster.
  const body = CHARACTER_BODIES[hash % CHARACTER_BODIES.length];
  const comb = CHARACTER_COMBS[(hash >>> 8) % CHARACTER_COMBS.length];
  const tail = CHARACTER_TAILS[(hash >>> 16) % CHARACTER_TAILS.length];

  if (player.avatarSrc === undefined) {
    return { body, comb, tail };
  }

  return { body, comb, tail, avatarSrc: player.avatarSrc };
};
