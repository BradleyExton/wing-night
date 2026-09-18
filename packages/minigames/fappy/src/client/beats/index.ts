// The two beats the corridor plays that the sim never sees. Both cost clock
// — the relay's clock runs through them — so they are short, and the same
// for every team.
//
// The handoff: the bird lands next to the one waiting, the waiter hops, the
// room is told whose tablet it is now, and only then does the corridor wipe
// to the next leg. The tablet ignores taps for the whole beat, so the finger
// that just landed cannot launch the next player's bird.
export const HANDOFF_BEAT_MS = 1400;

// A crash: the bird goes over where it hit, a puff of sand, and then the
// respawn on the perch. Taps in the beat are ignored so a player mashing
// through sees that they crashed rather than wondering why the bird jumped.
export const CRASH_BEAT_MS = 550;

// The TV mirrors the tablet a few ticks behind and its flap log can arrive a
// little late, so it holds a finished leg on the wall this much longer than
// the beat itself, to be sure its own replay has landed before the wipe.
export const MIRROR_HOLD_SLACK_MS = 350;
