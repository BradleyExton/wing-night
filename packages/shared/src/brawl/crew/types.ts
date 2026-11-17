import type { BrawlGoonKind, BrawlGoonState, BrawlHazard, BrawlSide } from "../types.js";

/**
 * The crew sim's vocabulary (docs/minigames/brawl-crew-spec.md §0.4): the whole team on the street
 * at once, on a street with DEPTH. It sits beside the relay's sim (`../types.ts`) until the last
 * surface has moved over, and borrows the relay's goon kinds, their script states and the hazard.
 *
 * A frame is a pure function of block + inputs + tick wherever it is stepped. The server steps it
 * to stamp everyone's thumbs onto one clock and holds the frame that scores; every screen steps a
 * copy forward from the latest frame it was sent.
 */

/**
 * Where the left thumb is: standing (0), or one of eight directions clockwise from east. South is
 * toward the camera (`z` grows), so 3 walks her down the screen and 7 up it.
 */
export type BrawlCrewWalk = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * One change in one hen's thumbs, at the tick the server stamped it. `hen` is her slot in the
 * frame. A walk says where the stick now is; a peck says whether the right thumb is down — the
 * press pecks, and a thumb left down keeps pecking at the sim's own rate. A pad sends only when
 * one of them changes.
 */
export type BrawlCrewInput =
  | { tick: number; hen: number; kind: "walk"; dir: BrawlCrewWalk }
  | { tick: number; hen: number; kind: "peck"; held: boolean };

/**
 * `up` is fighting. `down` is out of hearts, lying where she fell until a teammate stands over
 * her. `away` is a hen whose pad has said nothing and held nothing for `awayTicks`: she sits,
 * untargeted and unhurt, until any input stands her up.
 */
export type BrawlCrewHenState = "up" | "down" | "away";

/** What one hen did over the block: the numbers the turn's results card names people by. */
export type BrawlCrewHenStats = {
  /** Goons she put down, and what they were worth. */
  goons: number;
  worth: number;
  /** Hearts she lost. */
  hits: number;
  /** Times she went down. */
  downs: number;
  /** Teammates she got back up. */
  revives: number;
};

export type BrawlCrewHen = {
  /** Her index in `hens`, and the order she stepped out in. */
  slot: number;
  /** Along the street, in block x. */
  x: number;
  /** Across it: 0 at the back of the band, `depth` nearest the camera. */
  z: number;
  facing: -1 | 1;
  /** The thumbs as the sim last heard them. Kept while she is down, so a held stick still walks her once she is up. */
  walk: BrawlCrewWalk;
  peckHeld: boolean;
  /** A press that could not open a peck yet (cooldown, a reel) still does until here. */
  peckWantedUntilTick: number;
  hearts: number;
  state: BrawlCrewHenState;
  /** The peck's own box is live until here; it opens `peckDelayTicks` after it starts. */
  peckUntilTick: number;
  peckCooldownUntilTick: number;
  /** One peck, one goon: set when the peck in flight has connected. */
  peckLanded: boolean;
  /** The line of the goon this peck is for; she slides toward it while the peck is out. */
  alignZ: number | null;
  hurtUntilTick: number;
  invulnerableUntilTick: number;
  /** On a DOWNED hen: the tick a teammate started standing over her, or null while nobody is. */
  reviveSinceTick: number | null;
  /** The tick of her last input, for `away`. */
  lastInputTick: number;
  /** Whether she lost a heart in the wave in hand: the clean-wave bonus is hers to lose. */
  hitInWave: boolean;
  stats: BrawlCrewHenStats;
};

export type BrawlCrewGoon = {
  spawnIndex: number;
  kind: BrawlGoonKind;
  x: number;
  /** The line it stands on. A flier's too: its shadow is on this line all the way in. */
  z: number;
  /** Height above the street: nought for everything that walks, and the gull's dive. */
  y: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  hp: number;
  state: BrawlGoonState;
  stateUntilTick: number;
  koTick: number | null;
  /** The slot of the hen it is on, or null while there is nobody up to be on. */
  target: number | null;
};

/** One goon's arrival: the relay's spawn, plus the line it walks in on. */
export type BrawlCrewSpawn = {
  index: number;
  kind: BrawlGoonKind;
  side: BrawlSide;
  /** Ticks after the wave opens before this goon may step in (it also waits for a place, `standingCap`). */
  atTick: number;
  z: number;
};

export type BrawlCrewWave = {
  index: number;
  lockX: number;
  spawns: BrawlCrewSpawn[];
};

/**
 * One block, furnished for a crew of `crew` hens. The mix is a rule of the block's index and the
 * crew's size; the seed deals only the order, the sides, the lines and the hazard's spot.
 */
export type BrawlCrewBlock = {
  index: number;
  crew: number;
  length: number;
  waves: BrawlCrewWave[];
  /** Past the last wave: the block is cleared when any hen still up walks to here. */
  exitX: number;
  spawns: BrawlCrewSpawn[];
  hazard: BrawlHazard | null;
  /** The most goons on the street at once; a wave's later goons wait at the edge for a place. */
  standingCap: number;
  /** The boss's hp for this crew. */
  bossHp: number;
  /**
   * Everything the block can bank: every goon's worth, a clean-wave bonus for every hen in every
   * wave, and three hearts' worth for every hen at the clear. The team is scored against this.
   */
  total: number;
};

/** What picks a block: the course's seed and length, which block, and how many hens are on it. */
export type BrawlCrewCourse = {
  seed: number;
  blocks?: number;
  block?: number;
  crew?: number;
};

/** A wing on the pavement, on the line the goon that dropped it fell on. */
export type BrawlCrewPickup = { x: number; z: number; untilTick: number };

/**
 * Something that happened at one tick, for a screen to flinch, ring or count at the right moment.
 * `hen` is a slot, `spawnIndex` a goon. The frame keeps only the last `eventWindowTicks` of them:
 * it is sent whole and often, so it cannot grow with the block.
 */
export type BrawlCrewEventKind =
  | "hit"
  | "landed"
  | "ko"
  | "clank"
  | "dunk"
  | "bump"
  | "drop"
  | "wing"
  | "down"
  | "revive"
  | "bonus";

export type BrawlCrewEvent = { tick: number; kind: BrawlCrewEventKind; hen?: number; spawnIndex?: number };

/** `wipe` is every hen down at once: the geese carry the crew to the bay. `timeout` is the block's cap. */
export type BrawlCrewOutcome = "cleared" | "wipe" | "timeout";

/** Everything the sim knows at one tick. `outcome` is set on the terminal frame and never cleared. */
export type BrawlCrewFrame = {
  tick: number;
  hens: BrawlCrewHen[];
  goons: BrawlCrewGoon[];
  pickups: BrawlCrewPickup[];
  cameraX: number;
  cameraLocked: boolean;
  waveIndex: number;
  waveOpenedTick: number;
  /** How many of the block's spawns have stepped in. */
  spawned: number;
  /** Whether the wave in hand has dropped its wing: one a wave. */
  wingDropped: boolean;
  /** The worth banked so far: goons down, clean-wave bonuses, and hearts at the clear. */
  banked: number;
  events: BrawlCrewEvent[];
  outcome: BrawlCrewOutcome | null;
};
