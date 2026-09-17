// Which of a team's anthems plays this round.
//
// Deterministic by round number, never random, and that is the whole contract:
// the display can refresh mid-MINIGAME_INTRO — a TV that lost the socket, a
// browser reloaded because someone bumped the HDMI — and it must come back on
// the SAME track rather than restarting the night's playlist somewhere else.
// `currentRound` is display-safe state, so both the reload and the original
// render resolve from identical inputs.
//
// Rounds are 1-based (0 means pre-round), hence `currentRound - 1`. A team with
// more rounds than anthems wraps around to the top of its own list.
export const resolveAnthemForRound = (
  anthems: string[] | null,
  currentRound: number | null
): string | null => {
  if (anthems === null || anthems.length === 0) {
    return null;
  }

  if (currentRound === null || currentRound < 1) {
    return anthems[0];
  }

  return anthems[(currentRound - 1) % anthems.length];
};
