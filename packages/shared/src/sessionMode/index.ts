// How the room is being used tonight. A NIGHT is the full show: SETUP, the
// lock-in, and every round eating first. QUICK_PLAY is the same engine with
// the wings taken out — the host queues the mini-games they want to try, deals
// whoever is in the room into teams, and the round opens straight on the
// briefing and goes from there to play. Server-owned like every other field on
// the snapshot: the phase machine reads it to decide whether EATING exists.
export const SESSION_MODES = {
  NIGHT: "NIGHT",
  QUICK_PLAY: "QUICK_PLAY"
} as const;

export type SessionMode = (typeof SESSION_MODES)[keyof typeof SESSION_MODES];

export const isSessionMode = (value: unknown): value is SessionMode => {
  return value === SESSION_MODES.NIGHT || value === SESSION_MODES.QUICK_PLAY;
};
