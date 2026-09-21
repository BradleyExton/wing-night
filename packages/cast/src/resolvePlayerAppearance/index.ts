import { CHARACTER_DANCES, resolveContentAssetSrc, type CharacterDance, type Player } from "@wingnight/shared";

import { hashName } from "../hashName/index.js";

export const CHARACTER_BODIES = ["round", "tall", "wide"] as const;
export type CharacterBody = (typeof CHARACTER_BODIES)[number];

export const CHARACTER_COMBS = ["none", "crest", "mohawk"] as const;
export type CharacterComb = (typeof CHARACTER_COMBS)[number];

export const CHARACTER_TAILS = ["fan", "plume"] as const;
export type CharacterTail = (typeof CHARACTER_TAILS)[number];

// How the bird moves on the beat when a surface has it dancing: the body
// bouncing, the head banging, the wing flapping or the feet shuffling. The
// vocabulary lives in `@wingnight/shared` because a team's theme can name a
// dance too — pop is the team whose birds bounce — and the theme crosses the
// package boundary.
export { CHARACTER_DANCES, type CharacterDance };

// Everything `<Character>` needs to draw one cast member. Colour is NOT here:
// it belongs to the team, not the player, and is resolved by the surface that
// knows the seating (see `resolveTeamColorVariant`).
export type CharacterAppearance = {
  body: CharacterBody;
  comb: CharacterComb;
  tail: CharacterTail;
  dance: CharacterDance;
  avatarSrc?: string;
};

// `serverOrigin` is INJECTED rather than read in here, the same seam
// `resolveAnthemSrc` uses: client tests run under `tsx --test` with no DOM and
// no Vite, so a `window` / `import.meta.env` read at module or render scope
// throws. It is `null` until the host app has resolved it (the read happens in
// an effect), and a player whose head cannot be addressed yet simply wears the
// drawn one for that paint — the cast is never missing from the lobby.
export const resolvePlayerAppearance = (
  player: Pick<Player, "name" | "avatarSrc">,
  serverOrigin: string | null = null
): CharacterAppearance => {
  const hash = hashName(player.name);
  // Each choice reads its own bit range so the three do not move in lockstep
  // across the roster.
  const body = CHARACTER_BODIES[hash % CHARACTER_BODIES.length];
  const comb = CHARACTER_COMBS[(hash >>> 8) % CHARACTER_COMBS.length];
  const tail = CHARACTER_TAILS[(hash >>> 16) % CHARACTER_TAILS.length];
  const dance = CHARACTER_DANCES[(hash >>> 24) % CHARACTER_DANCES.length];

  if (player.avatarSrc === undefined) {
    return { body, comb, tail, dance };
  }

  // The roster writes pack-relative paths (`avatars/rob.png`), which live in the
  // content pack and are served by the SERVER. Resolving them here keeps every
  // head-rendering surface honest about the origin split.
  const avatarSrc = resolveContentAssetSrc(player.avatarSrc, serverOrigin);

  if (avatarSrc === null) {
    return { body, comb, tail, dance };
  }

  return { body, comb, tail, dance, avatarSrc };
};
