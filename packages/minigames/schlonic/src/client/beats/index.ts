// How long the two end-of-run beats hold the last frame before the tablet moves on. Client-only
// holds: the server has already taken its reading and moved the run cursor, and these are the
// seconds the room needs to see what happened before the next player is handed the tablet.
export const WIPEOUT_BEAT_MS = 1500;
export const CLEARED_BEAT_MS = 1900;

// The wall replays a few ticks behind the tablet, so it holds its beat a little longer or the
// next run is drawn over a landing the sofa has not seen yet.
export const MIRROR_HOLD_SLACK_MS = 700;
