// The client-only holds a block's ending plays over its last frame before the tablet moves on
// (docs/minigames/brawl-spec.md §0.7, FAPPY's convention). The server has already refereed the
// block and moved its cursor; these are the seconds the room needs to see how it went.

// Vlambeer's hit-pause: a hit on the hen stops the clock this long and jolts the picture. The
// clock, not the sim — a tick is a tick; only the wall-clock between two of them stretches.
export const HIT_PAUSE_MS = 120;

// The GO ▶ arrow's flash when a wave goes down, the camera already letting go under it.
export const GO_BEAT_MS = 1200;

// The handoff: the hen walks up to the next teammate waiting at the line and the tablet changes
// hands.
export const CLEARED_BEAT_MS = 2000;

// The bay: out of hearts, the geese lift the hen off the top of the frame and drop her in
// Kempenfelt Bay. The longest beat, because it is the joke.
export const KO_BEAT_MS = 2400;

// The bell: the block's own clock ran out, the hen slumps and a boxing bell rings.
export const TIMEOUT_BEAT_MS = 1600;

// The wall replays a few ticks behind the tablet, so it holds a block's ending a little longer than
// the tablet does or the next block is drawn over a beat the sofa has not finished seeing
// (SCHLONIC's slack).
export const MIRROR_HOLD_SLACK_MS = 700;
