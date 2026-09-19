// The one hash in the cast. Everything about a bird that is "randomly" the
// player's own — its body, its dance, and how loose its footwork is — is a
// slice of this number, so the same person is the same bird on every surface
// and on every night.
//
// Seeded off the NAME, not the id. Player ids are positional in players.json,
// so an id seed would hand Brad a new body every time the roster is reordered.
// The name is the one thing about a player that is the same night after night.
// Case and surrounding whitespace are ignored so "brad " and "Brad" agree.
export const hashName = (name: string): number => {
  const normalizedName = name.trim().toLowerCase();
  let hash = 2166136261;

  for (let index = 0; index < normalizedName.length; index += 1) {
    hash ^= normalizedName.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash;
};

