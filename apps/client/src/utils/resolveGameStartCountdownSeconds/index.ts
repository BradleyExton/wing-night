// The count-in is the SERVER's, not a display animation: the host arms it, the
// room state carries the instant it ends, and the phase does not move until it
// has. That is what keeps the first team's anthem and briefing from opening
// behind the lock screen — the TV counts the room in on the waiting screen,
// and the team enters on zero. Both surfaces read the same instant through
// here, so the tablet's button and the TV's digit can never disagree.
//
// An expired countdown reads as null rather than 0: a host that armed one and
// then vanished leaves the lock screen back on its ready label, and its next
// tap starts the night.
export const resolveGameStartCountdownSeconds = (
  gameStartCountdownEndsAt: number | null,
  nowTimestampMs: number
): number | null => {
  if (gameStartCountdownEndsAt === null) {
    return null;
  }

  const remainingMs = gameStartCountdownEndsAt - nowTimestampMs;

  if (remainingMs <= 0) {
    return null;
  }

  return Math.ceil(remainingMs / 1000);
};
