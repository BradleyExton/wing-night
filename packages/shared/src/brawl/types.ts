/**
 * BRAWL's physics vocabulary: the block a leg is fought over, the hen's state, the goons on the
 * street and the frame the tick-stepped sim produces. Free of any minigame, transport or
 * rendering concern — the tablet plays it live, the server referees a block from its input
 * log, and the display mirrors the same log, so a frame is a pure function of block + inputs +
 * tick on all three (the SCHLONIC rule, `../schlonic/types.ts`).
 */

/**
 * Who is on the street to be pecked. The sim tells them apart by stats and by two rules of their
 * own: the swan only lunges at a hen facing away from it (it `stalk`s one that faces it), and the
 * helmet goose's guard turns a peck into a clank unless it is honking, lunging or spent
 * (`isBrawlGoonGuarded`). The drawing tells them apart by look.
 */
export type BrawlGoonKind = "goose" | "gull" | "raccoon" | "swan" | "helmet" | "boss";

/** Which edge of the camera a goon walks in from. */
export type BrawlSide = -1 | 1;

/** One goon's arrival in a wave: who, from where, and how long after the wave opens. */
export type BrawlSpawn = {
  /** Index within the block's own spawn list, so a frame can name a goon by it. */
  index: number;
  kind: BrawlGoonKind;
  side: BrawlSide;
  /** Ticks after the wave opens before this goon steps in from the edge. */
  atTick: number;
};

/**
 * One wave of a block. The camera locks at `lockX` until every goon of the wave is down; then
 * it lets go and the hen walks on to the next lock, or to the handoff.
 */
export type BrawlWave = {
  index: number;
  /** Where the camera's left edge stops for this wave, in block x. */
  lockX: number;
  spawns: BrawlSpawn[];
};

/** The thing on each block's street a goon can be shoved into: Dunlop's patio railing, the bay, the plinth. */
export type BrawlHazardKind = "railing" | "bay" | "plinth";

/**
 * A spot on the street, `x` to `x + width` in block x. Goons and the hen walk over it freely; a
 * goon a peck SHOVES into or across it is dunked — down at once, whatever its hp (not a gull,
 * which flies, and not the boss, which is too heavy).
 */
export type BrawlHazard = { kind: BrawlHazardKind; x: number; width: number };

/**
 * One block: a stretch of street, `length` wide in world units, from x 0 (the start line) to
 * `handoffX` (the GO arrow, where the next teammate is waiting). Derived from a seed and the
 * block's index, so the same numbers lay out the same block on every machine. Every team in
 * the round fights the same course — a rule, not a roll — and block `k` is harder than block
 * `k - 1`: the first team on a new game needs the easy one first (principles §5).
 */
export type BrawlBlock = {
  index: number;
  length: number;
  waves: BrawlWave[];
  handoffX: number;
  /** Every goon in the block, flattened from the waves, in spawn-index order. */
  spawns: BrawlSpawn[];
  /**
   * The block's hazard, by setting (railing, bay, plinth), placed by the seed in the left or
   * right third of wave 1's window — never wave 0's, never under her or where goons step in.
   */
  hazard: BrawlHazard | null;
  /**
   * The hearts she starts the block with, and the most a wing can bring her back up to:
   * `BRAWL_WORLD.heartsMax` (three), or four on a block whose teammate bought a heart at the
   * handoff (`BrawlCourse.hearts`). Not dealt by the seed — the street is the same either way.
   */
  hearts: number;
  /**
   * What a perfect block is worth to the sim: the sum of each goon's `worth` plus a clean-wave
   * bonus for every wave (`BRAWL_WORLD.cleanWaveBonus`). The hearts she walks off with are worth
   * more again, but the runtime banks those, not the sim (`resolveBrawlBlockWorth`).
   */
  goonsTotal: number;
};

/**
 * What picks a block: one seed for the course, how many blocks the course has, and which of
 * them this leg is. `blocks` and `block` default to one and nought, like the SCHLONIC course.
 * `hearts` is what she starts it with, `BRAWL_WORLD.heartsMax` unless the team bought a fourth
 * at the handoff (`resolveBrawlStartHearts`); the referee, the tablet and the TV all pass the
 * same number, so all three start the block alike.
 */
export type BrawlCourse = {
  seed: number;
  blocks?: number;
  block?: number;
  hearts?: number;
};

/**
 * One tick of input as the tablet logged it. `walk` is the left thumb — down on a side, or
 * lifted (`dir: 0`); `peck` is the right thumb coming down. Ticks are non-decreasing: a walk
 * and a peck may share one, and the referee refuses anything earlier than the last entry.
 */
export type BrawlInput =
  | { tick: number; kind: "walk"; dir: -1 | 0 | 1 }
  | { tick: number; kind: "peck" };

/**
 * Where a goon is in its own little script. `entering` is the walk in from the edge; from
 * `approach` it closes on the hen; `stalk` is a swan in reach that she is facing — it stands and
 * waits, and hisses the moment she turns away; `telegraph` is the honk, the crouch, the hover before the
 * hit — the beat the room reads and shouts about; `attack` is the frames the goon's own box
 * hurts; `recover` the cooldown after; `stunned` the reel from a peck that did not finish it;
 * `ko` the fall, which `gone` ends once the drawing has had its beat.
 */
export type BrawlGoonState =
  | "entering"
  | "approach"
  | "stalk"
  | "telegraph"
  | "attack"
  | "recover"
  | "stunned"
  | "ko"
  | "gone";

export type BrawlGoon = {
  spawnIndex: number;
  kind: BrawlGoonKind;
  x: number;
  /** Height above the ground line; nought for everything that walks, and the gull's dive. */
  y: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  hp: number;
  state: BrawlGoonState;
  /** When the current state ends, for the timed ones. */
  stateUntilTick: number;
  /** The tick it went down, for the fall; null while it stands. */
  koTick: number | null;
};

/** A thing that happened to one goon at one tick: a clank off its helmet, a dunk into the hazard. */
export type BrawlGoonMark = { tick: number; spawnIndex: number };

/** A wing on the pavement, dropped where a goon worth two or more went down. Gone at `untilTick`. */
export type BrawlPickup = { x: number; untilTick: number };

/** How a block ended. `ko` is the hen out of hearts; `timeout` is the block's tick cap. */
export type BrawlOutcome = "cleared" | "ko" | "timeout";

/** Everything the sim knows at one tick. `outcome` is set on the terminal frame and never cleared. */
export type BrawlFrame = {
  tick: number;
  /** The hen, in block x. */
  x: number;
  facing: -1 | 1;
  /** The thumb as the sim sees it this tick. */
  walking: -1 | 0 | 1;
  hearts: number;
  /** Hits pass through up to this tick, so one lunge cannot cost two hearts. */
  invulnerableUntilTick: number;
  /** The peck's own box is live until here; it opens a few ticks after the press. */
  peckUntilTick: number;
  /** No new peck until here: mashing lands at the rate the cooldown allows and no faster. */
  peckCooldownUntilTick: number;
  /** The hen is reeling from a hit until here, and cannot walk or peck. */
  hurtUntilTick: number;
  /** The camera's left edge, in block x. The hen cannot leave the window it frames. */
  cameraX: number;
  /** True while a wave holds the camera; false while the hen walks on. */
  cameraLocked: boolean;
  /** The wave in hand; equal to the block's wave count once all are down. */
  waveIndex: number;
  /**
   * The tick the wave in hand opened (the camera locked on it). A spawn's `atTick` counts from
   * here, and nothing else in the frame remembers it.
   */
  waveOpenedTick: number;
  /** How many of the block's spawns have stepped in so far. */
  spawned: number;
  goons: BrawlGoon[];
  /**
   * The worth banked so far: every goon down plus `cleanWaveBonus` for every wave she took down
   * without being hit. The name is the goons', because that is most of it; the score is this.
   */
  goonsDown: number;
  /** The tick of every hit the hen took, so a surface can flinch at the right moment. */
  hits: number[];
  /**
   * The tick of every peck that connected with a goon — a clank off a helmet too, because a clank
   * spends the peck the same way (one peck, one goon).
   */
  landed: number[];
  /** The tick of every goon that went down. */
  kos: number[];
  /** The tick of every clean wave banked: the wave went down with no hit on her since it opened. */
  bonuses: number[];
  /** The tick of every goon stunned by another goon bowled into it (a chained knockback). */
  bumps: number[];
  /** Every peck that bounced off a helmet goose's guard: no hp, a shove, no stun. Also in `landed`. */
  clanks: BrawlGoonMark[];
  /** Every goon a peck's shove carried into or across the hazard: down at once. Also in `kos`. */
  dunks: BrawlGoonMark[];
  /** The wing on the street, if there is one: at most one at a time. */
  pickups: BrawlPickup[];
  /** The tick of every wing that dropped, so a wave drops one at most. */
  drops: number[];
  /** The tick of every wing she ate: a heart back. */
  wings: number[];
  outcome: BrawlOutcome | null;
};

export type BrawlRun = {
  /** `running` only when the sim was stopped short of the tick cap, which `runBrawlRun` never is. */
  outcome: BrawlOutcome | "running";
  endTick: number;
  /**
   * The worth the block banked in the sim — goons down plus clean-wave bonuses — whatever the
   * outcome: a KO keeps what it earned. Hearts carried off a cleared block are the runtime's to
   * add (`resolveBrawlBlockWorth`).
   */
  goons: number;
  frame: BrawlFrame;
};
