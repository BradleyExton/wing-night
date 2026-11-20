import type { BrawlCrewOutcome } from "@wingnight/shared";

// The client-only beats a block's ending plays over its last frame (docs/minigames/
// brawl-crew-spec.md §0.5: "the beats are the screens', the clock is the server's"). The server
// has already scored the block and put the next one on the line; these are the seconds the room
// needs to see how it went. All of them fit inside the server's own hold before a crew thumb may
// start the next block (`BRAWL_READY_HOLD_MS`, two and a half seconds), so a beat is never cut
// off by the street it is playing over being swapped for the next.
export const BEAT_MS: Record<BrawlCrewOutcome, number> = {
  // Block clear: the crew walks over the line and hops.
  cleared: 2000,
  // The bay: every hen down, and the geese carry the lot of them off the top of the frame into
  // Kempenfelt Bay. The longest beat, because it is the joke.
  wipe: 2400,
  // The bell: the block's own clock ran out, a boxing bell, the hens slump.
  timeout: 1600
};
