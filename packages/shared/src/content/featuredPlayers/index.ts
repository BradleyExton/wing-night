// Tags naming the people who appear IN a prompt — the faces in a geo photo,
// the subject of a trivia question. One concept across every prompt bank, so
// it lives here rather than in any one minigame's content module.
//
// Tags are NAMES, deliberately, not player ids. `loadPlayers` derives ids
// positionally (`player-${index + 1}`) from the order of `players.json`, so an
// id is a statement about an array position, not about a person: adding or
// reordering a roster entry silently re-points every tag that used one. A name
// survives that edit. It does not survive a rename — which is why an unknown
// tag is reported rather than quietly treated as "absent".
export type FeaturedPlayers = string[];

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isFeaturedPlayers = (value: unknown): value is FeaturedPlayers => {
  return Array.isArray(value) && value.every((entry) => isNonEmptyString(entry));
};

// Reads the tags off an unvalidated prompt. Returns `null` for "carries no
// tags at all", which callers MUST distinguish from `[]` only in so far as
// both mean the same thing here: untagged. The split exists so a clone can
// omit the key entirely rather than materializing an empty array on every
// prompt in every pack.
export const readFeaturedPlayers = (prompt: unknown): FeaturedPlayers | null => {
  if (typeof prompt !== "object" || prompt === null) {
    return null;
  }

  if (!("featuredPlayers" in prompt) || prompt.featuredPlayers === undefined) {
    return null;
  }

  if (!isFeaturedPlayers(prompt.featuredPlayers)) {
    return null;
  }

  return prompt.featuredPlayers;
};

// Distinguishes "carries no tags" from "carries tags that are not names" —
// `readFeaturedPlayers` collapses both to null, which is right for filtering
// and wrong for error reporting. The strict parse uses this to fail loudly at
// boot rather than let a mistyped tag degrade into an untagged prompt that
// silently survives every roster.
export const hasMalformedFeaturedPlayers = (prompt: unknown): boolean => {
  if (typeof prompt !== "object" || prompt === null) {
    return false;
  }

  if (!("featuredPlayers" in prompt) || prompt.featuredPlayers === undefined) {
    return false;
  }

  return !isFeaturedPlayers(prompt.featuredPlayers);
};

// Case and surrounding whitespace are noise in hand-edited JSON: a pack author
// typing "alex " means the roster's "Alex".
const normalizePlayerName = (playerName: string): string => {
  return playerName.trim().toLowerCase();
};

export const buildRosterNameSet = (playerNames: string[]): Set<string> => {
  return new Set(playerNames.map((playerName) => normalizePlayerName(playerName)));
};

// ANY, not ALL: a group photo still lands with the room when one of four faces
// didn't show up, and an all-must-be-present rule shrinks a pack fastest
// exactly where the pack is most fun.
//
// Untagged prompts are ALWAYS kept. That is the load-bearing default — the
// whole sample pack carries no tags, and `import:geo` emits empty tags for a
// human to fill in, so treating untagged as "nobody present" would delete
// every pack in the repo the moment this filter shipped.
export const isFeaturedOnRoster = (
  featuredPlayers: FeaturedPlayers | null,
  rosterNames: Set<string>
): boolean => {
  if (featuredPlayers === null || featuredPlayers.length === 0) {
    return true;
  }

  return featuredPlayers.some((playerName) => {
    return rosterNames.has(normalizePlayerName(playerName));
  });
};

// Tags matching nobody on the roster at all. A name that is simply absent
// tonight is indistinguishable from a typo by shape alone, so this does not
// decide anything — it feeds the warning that lets a host spot "Jordn" before
// the round starts.
export const findUnknownFeaturedPlayers = (
  featuredPlayers: FeaturedPlayers | null,
  rosterNames: Set<string>
): string[] => {
  if (featuredPlayers === null) {
    return [];
  }

  return featuredPlayers.filter((playerName) => {
    return !rosterNames.has(normalizePlayerName(playerName));
  });
};
