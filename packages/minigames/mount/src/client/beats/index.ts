// The client-only holds a climb's ending plays over its last frame before the tablet moves on
// (docs/minigames/mount-your-hens-spec.md §0.5, FAPPY's convention). The server has already
// refereed the climb and moved its cursor; these are the seconds the room needs to see it.

// The mount: the sting, the line jumps to the crown and the climber's name lands on it.
export const MOUNT_BEAT_MS = 2000;

// The clock ran out: the hen goes still where she is and becomes part of the mountain.
export const STUCK_BEAT_MS = 1600;

// A skipped climb has nothing to show, only whose tablet it is now.
export const SKIP_BEAT_MS = 1600;

// The line's jump and the name's landing take the front of the mount beat; the rest is the hen
// sitting on the top of the pile while the room shouts.
export const LINE_JUMP_SHARE = 0.35;

// The wall replays twelve ticks behind the tablet and its samples arrive in 70 ms batches, so it
// holds a climb's ending a little longer than the tablet does, or the next climber is drawn over a
// beat the sofa has not finished seeing (BRAWL's slack).
export const MIRROR_HOLD_SLACK_MS = 700;
