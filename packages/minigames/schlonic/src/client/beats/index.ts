// How long the two end-of-run beats hold the last frame before the tablet moves on. Client-only
// holds: the server has already taken its reading and moved the run cursor, and these are the
// seconds the room needs to see what happened before the next player is handed the tablet.
export const WIPEOUT_BEAT_MS = 1500;
export const CLEARED_BEAT_MS = 1900;

// The wall replays a few ticks behind the tablet, so it holds its beat a little longer or the
// next run is drawn over a landing the sofa has not seen yet.
export const MIRROR_HOLD_SLACK_MS = 700;

// Vlambeer's hit-pause: on a hit the clock stops for this long, so the room has a moment to
// register the wings going, then the run carries on. Both loops pause their own clock, and the
// sim never knows — a tick is a tick, only the wall-clock between two of them stretched.
export const HIT_PAUSE_MS = 180;

// How long the post's count-up takes: the handful out of the bird and into the bank, one at a
// time, inside the cleared beat with room to read the total at the end.
export const BANK_COUNT_MS = 1100;
