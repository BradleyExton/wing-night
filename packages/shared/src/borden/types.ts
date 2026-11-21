/**
 * Base Borden's vocabulary (docs/minigames/base-borden-spec.md §0.3, §0.4): a side-view
 * run-and-gun, two hens at a time, one stretch of the base per pair.
 *
 * The view is from the side. `x` runs along the stretch and `y` is height above the ground, up
 * being positive, so a jump is `y` growing. A screen turns it over to draw it.
 *
 * A frame is a pure function of stretch + inputs + tick wherever it is stepped. The room steps it
 * to stamp both thumbs onto one clock and holds the frame that scores; every phone steps a copy
 * forward from the latest frame it was sent.
 */

/**
 * Where the left thumb is: at rest (0), or one of eight directions clockwise from east, the crew
 * pad's numbering. 3 is down (she ducks), 7 is up; 2 and 4 duck her facing that way.
 */
export type BordenStick = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * One change in one hen's thumbs, at the tick the room stamped it. `hen` is her slot in the frame.
 * A stick says where the left thumb now is; a jump is the right thumb's press, buffered so a press
 * just before she lands still jumps. A pad sends only when something changes.
 */
export type BordenInput =
  | { tick: number; hen: number; kind: "stick"; dir: BordenStick }
  | { tick: number; hen: number; kind: "jump" };

/**
 * What she sprays. Everyone starts on `mild`; a hotter bottle is the pickup, and a hit takes it
 * off her before it takes a heart.
 */
export type BordenBottle = "mild" | "spread" | "long" | "puddle";

/**
 * `up` is running. `down` is out of hearts, lying where she fell until her partner stands over
 * her. `away` is a hen whose pad has said nothing and held nothing for `awayTicks`: she sits,
 * untargeted and unhurt, until any input stands her up.
 */
export type BordenHenState = "up" | "down" | "away";

/** What one hen did over the stretch: the numbers a results card names people by. */
export type BordenHenStats = {
  /** Things she sprayed down, and what they were worth. */
  downed: number;
  worth: number;
  /** Shots that went past her while she could have been hit: her near misses. */
  dodged: number;
  /** Times she was hit, a bottle lost or a heart. */
  hits: number;
  /** Times she went down. */
  downs: number;
  /** Times she got her partner back up. */
  revives: number;
};

export type BordenHen = {
  /** Her index in `hens`. */
  slot: number;
  x: number;
  /** Her feet above the ground: 0 standing on it. */
  y: number;
  vy: number;
  facing: -1 | 1;
  /** The stick as the sim last heard it. Kept while she is down, so a held stick still runs her once she is up. */
  stick: BordenStick;
  /** A jump press still jumps her on any tick up to here, if she is on the ground by then. */
  jumpWantedUntilTick: number;
  bottle: BordenBottle;
  hearts: number;
  state: BordenHenState;
  nextSauceTick: number;
  hurtUntilTick: number;
  invulnerableUntilTick: number;
  /** On a DOWNED hen: the tick her partner started standing over her, or null while nobody is. */
  reviveSinceTick: number | null;
  /** The tick of her last input, for `away`. */
  lastInputTick: number;
  stats: BordenHenStats;
};

/**
 * What shoots back, all of it the base's own kit (spec §0.3). A turret sits on a fence and fires
 * low or high; a tank rolls in, parks and fires a slow low shell; the motor-pool goose runs at you;
 * the drill sergeant holds the last gate and shouts, low and high in turn.
 */
export type BordenFoeKind = "turret" | "tank" | "goose" | "sergeant";

/** Which way past a shot: `low` is jumped, `high` is ducked. */
export type BordenShotLevel = "low" | "high";

/**
 * Where one foe is dealt. A turret stands at `x` and is in the fight while it is in the window. A
 * goose wakes when the window's right edge reaches `x` and runs in from there. A tank wakes a
 * little before, rolls in from the edge and parks at `x`. The sergeant stands at `x` in front of
 * the gate.
 */
export type BordenSpawn = {
  id: number;
  kind: BordenFoeKind;
  x: number;
  /** A turret's shot height; a sergeant's first shout. Nothing else reads it. */
  level: BordenShotLevel;
};

export type BordenFoe = {
  id: number;
  kind: BordenFoeKind;
  x: number;
  /** Where it was dealt: a tank rolls in and parks here. */
  homeX: number;
  /** Units a tick along the stretch: a goose's run, a tank's roll. */
  vx: number;
  hp: number;
  level: BordenShotLevel;
  /** A tank is shooting only once it has parked. */
  parked: boolean;
  koTick: number | null;
  /** The slot of the hen who sprayed it down, while `koTick` is set. */
  koBy: number | null;
  /** A goose's body hurts each hen once, as it runs through her: the slots it already has. */
  touched: number[];
};

export type BordenShot = {
  id: number;
  x: number;
  /** Its centre's height above the ground; it never changes, every shot flies level. */
  y: number;
  vx: number;
  radius: number;
  /** The hens this shot has already hit or gone past: it never counts twice for one hen. */
  settled: number[];
};

export type BordenSauce = {
  id: number;
  /** The slot of the hen it left. */
  hen: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Puddle sauce falls; the rest flies straight. */
  falls: boolean;
  untilTick: number;
};

/** A splash on the ground from the puddle bottle: it burns anything standing in it until `untilTick`. */
export type BordenPuddle = { id: number; hen: number; x: number; untilTick: number };

/** The hotter bottle lying in the stretch, until a hen runs over it. */
export type BordenBottleDrop = { x: number; bottle: Exclude<BordenBottle, "mild"> };

/** The foe flashing now, and the tick it fires on. One shooter at a time: one answer at a time. */
export type BordenTelegraph = { foeId: number; fireTick: number };

/** One stretch of the base, in the order they are run: the fences, the motor pool, the parade square. */
export type BordenStretchName = "fences" | "motor-pool" | "parade-square";

/**
 * One stretch, furnished for a pair. The kit is a rule of the stretch's index; the seed deals only
 * where things stand, which turret is low and which bottle lies where.
 */
export type BordenStretch = {
  index: number;
  name: BordenStretchName;
  /** One hen or two: the pair that runs it. */
  pair: number;
  length: number;
  /** The stretch is cleared when any hen still up reaches here. */
  gateX: number;
  spawns: BordenSpawn[];
  bottle: BordenBottleDrop;
  /** Ticks from one shot leaving to the next shooter starting its flash: shorter each stretch. */
  restTicks: number;
  /**
   * Everything the stretch can bank: every foe's worth and three hearts' worth for each hen at the
   * gate. The team is scored against the course's sum of these.
   */
  total: number;
};

/** What picks a stretch: the game's seed, which stretch, and how many hens run it. */
export type BordenStretchSpec = { seed: number; stretch: number; pair?: number };

/**
 * Something that happened at one tick, for a screen to flinch, ring or buzz at the right moment.
 * `hen` is a slot, `foeId` a foe. The frame keeps only the last `eventWindowTicks` of them.
 */
export type BordenEventKind =
  | "jump"
  | "fire"
  | "hit"
  | "bottle-lost"
  | "down"
  | "revive"
  | "ko"
  | "splash"
  | "bottle";

export type BordenEvent = { tick: number; kind: BordenEventKind; hen?: number; foeId?: number };

/** `wipe` is both hens down at once. `timeout` is the stretch's safety cap, not a clock anyone sees. */
export type BordenOutcome = "cleared" | "wipe" | "timeout";

/** Everything the sim knows at one tick. `outcome` is set on the terminal frame and never cleared. */
export type BordenFrame = {
  tick: number;
  hens: BordenHen[];
  foes: BordenFoe[];
  /** How many of the stretch's spawns (in `x` order) have woken. */
  woken: number;
  shots: BordenShot[];
  sauce: BordenSauce[];
  puddles: BordenPuddle[];
  /** The bottle still lying in the stretch, or null once a hen has it. */
  bottle: BordenBottleDrop | null;
  cameraX: number;
  telegraph: BordenTelegraph | null;
  nextTelegraphTick: number;
  /** Shots fired so far: the first is the slowest, and it turns the shooters round-robin. */
  volley: number;
  nextId: number;
  /** The worth banked so far: foes down, and hearts at the gate. */
  banked: number;
  events: BordenEvent[];
  outcome: BordenOutcome | null;
};
