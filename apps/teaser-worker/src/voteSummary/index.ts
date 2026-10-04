// The admin's read of every vote: the genres by Borda total, the pairs who asked for each other,
// how the room wants teams made, and who still has to vote. Wishes are only ever seen here.
import {
  PORTAL_GENRES,
  TEAM_FORMATS,
  resolveGenreBordaPoints,
  type AdminVoteSummary,
  type GuestVote,
  type PortalGuest,
  type TeamFormat,
  type VoteGenreTally,
  type VoteMutualWish
} from "@wingnight/shared/guestPortal";

export type CastVote = {
  guestId: string;
  vote: GuestVote;
};

const resolveGenreTallies = (votes: readonly CastVote[]): VoteGenreTally[] => {
  const tallies = PORTAL_GENRES.map((genre) => ({ genre, points: 0, firstChoices: 0 }));

  for (const { vote } of votes) {
    const points = resolveGenreBordaPoints(vote.genreRanking);

    for (const tally of tallies) {
      tally.points += points.get(tally.genre) ?? 0;
      tally.firstChoices += vote.genreRanking[0] === tally.genre ? 1 : 0;
    }
  }

  // Ties fall to first choices, then to the ballot's own order, so the list never reshuffles
  // between two reads of the same votes.
  return tallies
    .map((tally, ballotIndex) => ({ tally, ballotIndex }))
    .sort(
      (left, right) =>
        right.tally.points - left.tally.points ||
        right.tally.firstChoices - left.tally.firstChoices ||
        left.ballotIndex - right.ballotIndex
    )
    .map(({ tally }) => tally);
};

const resolveMutualWishes = (
  votes: readonly CastVote[],
  guestsById: ReadonlyMap<string, PortalGuest>
): VoteMutualWish[] => {
  const wishesByGuest = new Map(votes.map(({ guestId, vote }) => [guestId, new Set(vote.teammateWishes)]));
  const mutualWishes: VoteMutualWish[] = [];

  for (const [guestId, wishes] of wishesByGuest) {
    for (const wishedId of wishes) {
      const isMutual = wishesByGuest.get(wishedId)?.has(guestId) === true;
      const guest = guestsById.get(guestId);
      const wished = guestsById.get(wishedId);

      // Each pair once, from its lower id.
      if (isMutual && guestId < wishedId && guest !== undefined && wished !== undefined) {
        mutualWishes.push({ guests: [guest, wished] });
      }
    }
  }

  return mutualWishes;
};

export const resolveVoteSummary = (
  guests: readonly PortalGuest[],
  votes: readonly CastVote[]
): AdminVoteSummary => {
  const guestsById = new Map(guests.map((guest) => [guest.guestId, guest]));
  const formatTallies = Object.fromEntries(TEAM_FORMATS.map((format) => [format, 0])) as Record<TeamFormat, number>;

  for (const { vote } of votes) {
    formatTallies[vote.teamFormat] += 1;
  }

  const voterIds = new Set(votes.map(({ guestId }) => guestId));

  return {
    voterCount: votes.length,
    genreTallies: resolveGenreTallies(votes),
    mutualWishes: resolveMutualWishes(votes, guestsById),
    formatTallies,
    notVoted: guests.filter((guest) => !voterIds.has(guest.guestId))
  };
};
