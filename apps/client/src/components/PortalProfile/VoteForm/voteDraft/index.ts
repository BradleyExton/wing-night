// The vote form's working copy and the moves a thumb makes on it, kept apart from the form so
// what reaches PUT /api/me/vote is decided in one tested place. The genre list is a ranked
// prefix (GuestVote): the guest orders as many as they care to and the rest stay unranked.
import {
  PORTAL_GENRES,
  TEAMMATE_WISHES_MAX,
  type GuestVote,
  type PortalGenre,
  type TeamFormat
} from "@wingnight/shared/guestPortal";

export type VoteDraft = {
  ranking: PortalGenre[];
  wishes: string[];
  format: TeamFormat | null;
};

export const EMPTY_VOTE_DRAFT: VoteDraft = { ranking: [], wishes: [], format: null };

// A saved vote back into the form. Wishes for guests no longer on the list are dropped, so a
// removed guest cannot be saved again unseen.
export const draftFromVote = (vote: GuestVote | null, knownGuestIds: ReadonlySet<string> | null): VoteDraft => {
  if (vote === null) {
    return EMPTY_VOTE_DRAFT;
  }

  return {
    ranking: [...vote.genreRanking],
    wishes: knownGuestIds === null ? [...vote.teammateWishes] : vote.teammateWishes.filter((id) => knownGuestIds.has(id)),
    format: vote.teamFormat
  };
};

export const unrankedGenres = (ranking: readonly PortalGenre[]): PortalGenre[] =>
  PORTAL_GENRES.filter((genre) => !ranking.includes(genre));

export const rankGenre = (ranking: readonly PortalGenre[], genre: PortalGenre): PortalGenre[] =>
  ranking.includes(genre) ? [...ranking] : [...ranking, genre];

export const unrankGenre = (ranking: readonly PortalGenre[], genre: PortalGenre): PortalGenre[] =>
  ranking.filter((entry) => entry !== genre);

// Swaps a genre with its neighbour `delta` places away; a move off either end does nothing.
export const moveGenre = (ranking: readonly PortalGenre[], index: number, delta: -1 | 1): PortalGenre[] => {
  const target = index + delta;

  if (index < 0 || index >= ranking.length || target < 0 || target >= ranking.length) {
    return [...ranking];
  }

  const next = [...ranking];
  [next[index], next[target]] = [next[target], next[index]];

  return next;
};

// On, or off; a third wish is refused rather than bumping the first.
export const toggleWish = (wishes: readonly string[], guestId: string): string[] => {
  if (wishes.includes(guestId)) {
    return wishes.filter((wish) => wish !== guestId);
  }

  return wishes.length >= TEAMMATE_WISHES_MAX ? [...wishes] : [...wishes, guestId];
};

// The body PUT /api/me/vote takes, or null while the form cannot be saved yet: at least one genre
// ranked and a format picked.
export const toGuestVote = (draft: VoteDraft): GuestVote | null => {
  if (draft.ranking.length === 0 || draft.format === null) {
    return null;
  }

  return { genreRanking: [...draft.ranking], teammateWishes: [...draft.wishes], teamFormat: draft.format };
};
