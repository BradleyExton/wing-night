# Mount Your Hens (MOUNT) Minigame Spec

Status: **Planned** (`packages/minigames/mount/`, not started)

Last updated: 2026-10-02 (promoted from `ideas/mount-your-hens.md`; the reasoning is
[cast-minigame-candidates.md](../research/cast-minigame-candidates.md) §4)

> **§0 is the build plan; §1 to §3 are the reasoning it rests on; §4 answers the review
> checklist.** Adding a `MinigameType` breaks every `Record<MinigameType, …>` in the repo until
> fully wired (authoring guide §1), so there is no useful half-state: steps 3 to 5 land as one
> change.

## 0) Build plan

### 0.1 What ships

One `MinigameRuntimePlugin` package, `@wingnight/minigames-mount`, registered on server and
client like Streets of Barrie. Mount Your Friends (Stegersaurus, 2013) with the cast: the active
team's players take the tablet in roster order, one **climb** each, and climb their own cast hen
(the `@wingnight/cast` hen wearing their head, in the team colour and genre silhouette, drawn as
a ragdoll) onto **the pile**: a Canada goose on the Spirit Catcher's plinth, and every hen that
climbed before them this round, stuck exactly where each one stopped. The climber touches one of
four limbs (left foot, right foot, wing, beak), drags it and lets go; a let-go limb grabs the
first thing it touches. Get the top of your head above the **high line** and you have mounted:
the line jumps to your head and carries your name. Run out of clock and your hen stays where it
is, part of the mountain, and scores how far it got.

The pile is plugin round memory: it outlives the turn, so the second team climbs the first
team's hens and the last team climbs everyone. The spectating teams are the terrain. The pile at
the end of the round is the keepsake, a group photo nobody posed for.

No content file (the pile starts from a seed in the rules), no room timer (host-paced like
Streets of Barrie; each climb has its own tick clock, and it is the game's, not the room's). The
TV carries the game's sound through `@wingnight/audio` (§0.7).

### 0.2 Order of work (each step ends with the gate green)

Gate for every step: `pnpm lint && pnpm typecheck && pnpm test`, judged on exit codes. Client,
minigame `.tsx` and `tests/e2e` changes also need
`CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` (CLAUDE.md). The order is
the authoring guide's §2 file checklist in Streets of Barrie's order.

1. **Shared sim.** `packages/shared/src/mount/{types,world,pile,simulate}` + `index.ts`,
   exported from `packages/shared/src/index.ts`. `types.ts` is the contract (§0.4) and is
   written first. Pure, tick-stepped, seeded, covered by a copy of **JOUST's**
   `noTranscendentals.test.ts` (it bans trig and allows `Math.sqrt`, §0.4) scanning this module.
   Gate.
2. **Cast ragdoll** (in parallel with step 1). `CharacterRagdollFigure` and the ragdoll anchors
   in `packages/cast` (§0.8). Every existing pose renders byte-identically. Gate after both land.
   If the sim and the cast disagree on an anchor, the cast is right and the sim's copy changes.
3. **Shared contracts.** `MINIGAME_DEFINITIONS.MOUNT` (`slug: "mount"`,
   `displayName: "Mount Your Hens"`, `timerKey: null`, `rulesKey: "mount"`).
   `MountMinigameHostView` / `MountMinigameDisplayView` in the room-state unions (§0.5), one
   outer member each.
4. **Runtime package.** Scaffold from `packages/minigames/brawl` (closest sibling: rules-backed,
   host-paced, a relay of one player at a time, an input log refereed by re-running a seeded
   sim). `src/runtime/{types,guards,rules,scoring,views}/index.ts` + `index.ts` + tests. No
   content adapter.
5. **Registries + config.** Both registries, `apps/client/src/copy/minigameBriefings.ts` (the
   verb line, the clock rule, `mount-illustration.svg`), workspace deps in `apps/server` and
   `apps/client`, `content/sample/gameConfig.json` `minigameRules.mount` defaults, a `RoundGlyph`
   for the SETUP card. **Not scheduled in a sample round** (Streets of Barrie precedent; sample
   round 1 is an e2e fixture). Steps 3 to 5 are one change: typecheck is red until every
   `Record<MinigameType, …>` is wired. Gate.
6. **Surfaces.** `HostMountSurface` (the close-up and the four limb handles) and
   `DisplayMountSurface` (the whole pile, the marquee), sharing one `MountScene` and its
   `camera/`. Copy in `copy.ts`, styles in `styles.ts`. Look in `apps/client/public/mockups/`
   first; there is no Mount mockup, so the surfaces follow the shipped Canvas games and
   `DESIGN.md`. `DESIGN.md` §2.15 paragraph in the same change. Judge the host at 1280×800 only.
   Gate plus e2e.
7. **E2E.** `tests/e2e/mount-sandbox.spec.ts` against `/dev/minigame/mount` (§0.9). Gate plus
   e2e.
8. **Docs.** Flip this file to Shipped with an as-built list; README row.

### 0.3 Locked decisions

- **Name and id:** "Mount Your Hens", `MOUNT`, slug `mount`, package `packages/minigames/mount`,
  sim `packages/shared/src/mount`. One name (authoring guide §1).
- **A climb each, in roster order.** Fappy Bird's relay shape: climb `k` belongs to
  `playerIds[k]` of the active team, one climb per player, `climbsPerTurn = max(1, roster
  length)`. Host-paced: `timerKey: null`; each climb has its own tick clock in the sim, and
  nothing auto-advances the phase.
- **The pile is round memory.** It starts as one Canada goose on a plinth. Every hen that climbs
  stays exactly where it stopped: its pose (the particles its part transforms are drawn from)
  and the limbs it was holding with. `selectRoundMemory` returns `{ pile }`, which carries the
  high line; the next team's `initialize` receives it as `roundMemory`. The TV shows the whole
  pile between turns (the intro beat) and on results.
- **One gesture.** On the tablet's close-up, touch one of four limbs (left foot, right foot,
  wing, beak), drag it, release. The drag moves the limb's end toward the finger within the
  limb's reach; on release the limb grabs the first surface it touches (floor, plinth, goose,
  any stuck hen) and stays grabbed until it is next touched. Letting go of the limbs that hold
  the bird up is the fling and the fall. No other control. The input log is a sequence of
  `MountInputSample` (§0.4).
- **Mount and score.** The climber's crown (the top of its head, the "comb" of the rules) above
  the current high line is a mount: the climb ends there, it banks a full share, and the line
  moves to that crown and carries the climber's `playerId`. At the clock an unmounted hen stays
  where it lies and banks the fraction of the way it got from where it started to the line
  (near misses, §2). The per-climb share is the round's max over the turn's climbs; the turn's
  points are `round(pointsMax × Σ shares / climbsPerTurn)`, rounded once at the end like Streets
  of Barrie's worth over total. Points land on the TV within a second of the line moving.
- **The clock grows with the pile,** a published rule: a climb gets
  `(climbSeconds + secondsPerHen × hensOnPile) × tickHz` ticks, where `hensOnPile` is the hens
  on the pile when the climb comes into hand. Defaults `minigameRules.mount.climbSeconds` 30 and
  `minigameRules.mount.secondsPerHen` 3; `MOUNT_WORLD.tickHz` 60. The briefing and the TV both
  state it.
- **Falls.** A bird whose body or head touches the floor is set upright beside the pile, still
  on the clock, and goes again after a 0.75 s beat. A fall never costs a point on its own.
- **Cameras.** The tablet frames the climber (the sim's 240×150 view box, following the hen);
  the TV frames the whole pile on the same sim (a fit-all camera), so the room sees holds the
  climber cannot. Both live in `MountScene/camera`, after `BrawlScene/camera`.
- **Sound** through `@wingnight/audio` on the TV only: a grab tick, a slip, a thud, a mount
  sting (§0.7). The soundboard pattern of `packages/minigames/brawl/src/client/audio`; no new
  engine.
- **Not scheduled** in `content/sample/gameConfig.json` rounds. Rules defaults go in; the round
  list does not change.
- **Escape hatches:** `skipClimb` (banks nothing, adds no hen, next player) and `resetTurn` (back
  to the first climber, the pile back to how this turn found it, hands back exactly the turn's
  points), the SCHLONIC/BRAWL pair (§0.6).
- **The ragdoll is the cast's.** The hen is drawn by `CharacterRagdollFigure` from per-part
  transforms; the cast owns every anchor and the sim keeps a pinned copy (§0.8).
- **Determinism.** Position-based dynamics: Verlet particles for the climber, distance
  constraints for bones and the rigid torso, grabbed limb ends pinned, circle and capsule
  contacts against a static mesh of floor, plinth, goose and stuck hens. Tick-stepped, seeded,
  no trig anywhere in the module. The live sim is one bird against a static mesh, so a 20-hen
  pile is cheap.

### 0.4 The sim (`packages/shared/src/mount`)

The world is the cast's own bird box at scale 1: one world unit is one unit of the 80×72 box
the hen is drawn in, y runs **down** as it does in the box, and the floor is the line y = 0, so
a point's height above the floor is `-y`. A hen's part transforms are therefore in world units
already, and no surface flips or rescales between the sim and the cast.

Public API, exported from `packages/shared/src/mount/index.ts` and re-exported from
`packages/shared/src/index.ts`. `types.ts` is written first and is the contract; it does not
change without changing this section.

```ts
// ---- types.ts -------------------------------------------------------------------------------

/** The four limbs a climber moves. Left and right are the box's, the hen facing right at rest:
 *  footLeft is the cast's legNear, footRight its legFar, wing its wingNear, beak its head. */
export type MountLimb = "footLeft" | "footRight" | "wing" | "beak";

/** A point in world units (the bird box at scale 1, y down, the floor at y 0). */
export type MountVec = { x: number; y: number };

/**
 * The climber's particles. The torso is four held rigid (rump, neck, both hips); each limb is
 * one particle at the tip of its bone; the far wing is a tip nobody controls, which only dangles.
 */
export type MountParticle =
  | "rump"
  | "neck"
  | "hipLeft"
  | "hipRight"
  | "footLeft"
  | "footRight"
  | "wing"
  | "beak"
  | "wingFar";

/** Where every particle is. A hen frozen on the pile is one of these and nothing more. */
export type MountPose = Record<MountParticle, MountVec>;

/**
 * One pointer sample as the tablet logged it. `grab-start` is a finger landing on a limb (it
 * lets go of whatever that limb held), `move` is the finger moving, `release` is the finger
 * lifting. `x` and `y` are where the finger is, in world units through the tablet's camera,
 * each a multiple of `MOUNT_WORLD.inputQuantum`. Ticks are non-decreasing through a climb's log;
 * several samples may share a tick (two fingers), applied in log order.
 */
export type MountInputSample = {
  tick: number;
  limb: MountLimb;
  kind: "grab-start" | "move" | "release";
  x: number;
  y: number;
};

/** What a surface a limb can grab is. `hen` names a stuck hen by its place in the pile. */
export type MountSurfaceRef =
  | { kind: "floor" }
  | { kind: "plinth" }
  | { kind: "goose" }
  | { kind: "hen"; pileIndex: number };

/** A static collision shape: a ball, or a capsule (a segment with a radius). */
export type MountShape =
  | { kind: "circle"; c: MountVec; r: number; surface: MountSurfaceRef }
  | { kind: "capsule"; a: MountVec; b: MountVec; r: number; surface: MountSurfaceRef };

/**
 * What a limb is doing. `limp`: free and not sticky (the wing and beak at the start).
 * `held`: a finger is on it; it chases `target` and is not sticky. `seeking`: let go away from
 * any surface; it grabs the first one it touches. `grabbed`: pinned at `at` until next touched.
 */
export type MountLimbState =
  | { kind: "limp" }
  | { kind: "held"; target: MountVec }
  | { kind: "seeking" }
  | { kind: "grabbed"; at: MountVec; surface: MountSurfaceRef; brace: number };

/** The goose's stance, dealt by the pile's seed. Every team in a round climbs the same goose. */
export type MountGooseStance = "stand" | "honk" | "preen";

/** The line to beat. `playerId` is null while the goose holds it. */
export type MountHighLine = {
  /** Height above the floor, world units. */
  height: number;
  /** Where the crown that set it was, so a surface can hang the holder's head on the line. */
  x: number;
  playerId: string | null;
};

/** A hen on the pile: frozen where its climb ended, a static hold for everyone after it. */
export type MountPileHen = {
  /** Its place in the round's pile, from 0, in the order the hens joined. */
  pileIndex: number;
  playerId: string | null;
  pose: MountPose;
  /** The limbs that were holding on when the climb ended, and where. For drawing the grip. */
  grabs: Partial<Record<MountLimb, MountVec>>;
  /** True when this climb took the line. */
  mounted: boolean;
};

/** The round's mountain. The whole of the plugin's round memory. */
export type MountPile = {
  seed: number;
  goose: MountGooseStance;
  hens: MountPileHen[];
  highLine: MountHighLine;
};

/** The two published clock rules, in seconds, as `minigameRules.mount` carries them. */
export type MountClimbRules = { climbSeconds: number; secondsPerHen: number };

/** How a climb ended. `mounted` is the crown over the line; `timeout` is the climb's clock. */
export type MountOutcome = "mounted" | "timeout";

/** A tick and a limb, for the events a surface flinches or sounds at. */
export type MountLimbEvent = { tick: number; limb: MountLimb };

/** Everything the sim knows at one tick. `outcome` is set on the terminal state, never cleared. */
export type MountState = {
  /** The round's pile seed, carried so a re-run names its stream (see "Seeded" below). */
  seed: number;
  playerId: string | null;
  tick: number;
  /** This climb's clock, fixed at creation by the published rule. */
  climbTicks: number;
  /** What this climb is climbing. It never changes during a climb. */
  pile: MountPile;
  /** The pile as shapes, built once at creation. The floor is the line y = 0, not a shape. */
  mesh: MountShape[];
  /** The start stance beside the pile: where the climb begins and where a fall puts the hen. */
  start: MountPose;
  pose: MountPose;
  /** Verlet's last positions: a particle's velocity is `pose − previous`. */
  previous: MountPose;
  limbs: Record<MountLimb, MountLimbState>;
  /** After a fall, samples are ignored and the hen blinks until here. */
  recoveringUntilTick: number;
  /** The crown's height in the start stance: a near miss is measured from here. */
  startHeight: number;
  /** The highest the crown has been this climb, falls included. */
  bestHeight: number;
  /** Every grab (a seeking limb sticking), every let-go (a grabbed limb touched loose), every fall. */
  grabs: MountLimbEvent[];
  letGoes: MountLimbEvent[];
  falls: number[];
  outcome: MountOutcome | null;
};

/** What a finished climb is worth and what it leaves behind. */
export type MountClimbResult = {
  outcome: MountOutcome;
  endTick: number;
  /** 1 on a mount; otherwise (best − start) / (line − start), clamped to [0, 1). */
  share: number;
  bestHeight: number;
  falls: number;
  /** The hen as it joins the pile: its pose on the terminal tick, frozen. */
  hen: MountPileHen;
};

// ---- world/ ---------------------------------------------------------------------------------

export const MOUNT_WORLD: {
  /** Sixty fixed steps a second on every machine; a tick count is a duration everywhere. */
  tickHz: 60;
  /** The floor line. y is down, so a height above the floor is −y. */
  floorY: 0;
  /** 0.25 units a tick a tick, added to every free particle: floatier than a real hen, on purpose. */
  gravity: number;
  /** 0.99: the share of last tick's velocity a particle keeps, so a swing dies down. */
  damping: number;
  /** 5 units a tick: no particle moves further in one tick, so nothing tunnels (see minStaticRadius). */
  maxSpeed: number;
  /** 8 passes over the constraints each tick, always in the same order. */
  solverIterations: number;
  /** 4 units a tick: how fast a held limb chases the finger, and so the ceiling on a push-off. The fling's lever. */
  dragStep: number;
  /** 0.6: the share of sliding a contact takes out each tick. */
  contactFriction: number;
  /** 0.5 units a tick: the most a grabbed limb's brace corrects per tick. One brace sags under the bird; two stand it. */
  braceStrength: number;
  /** 3: a limb tip's own ball, for touching a surface and for sticking to it. */
  gripRadius: number;
  /** 4: no static shape is thinner than this, so a stuck hen's leg is a foothold a hair wider than it is drawn. */
  minStaticRadius: number;
  /** 14: how near a touch must land to a limb's tip to take that limb. At the tablet's scale this is over 44 CSS px. */
  touchRadius: number;
  /** 0.125: every sample's x and y is a multiple of this, so a log is small and exact. */
  inputQuantum: number;
  /** 2: at most one `move` per limb every this many ticks; between samples the target holds. */
  moveSampleTicks: number;
  /** 45 ticks: the set-upright beat after a fall. The clock keeps running through it. */
  fallRecoverTicks: number;
  /** 40: how far left of the pile's leftmost shape the start stance's front foot stands. */
  startGap: number;
  /** The tablet's view box, 16:10 like the tablet, centred on the climber's torso. */
  view: { width: 240; height: 150 };
  /** The Spirit Catcher's plinth, centred on x 0, standing on the floor: three capsules (top and two sides) of edgeRadius. */
  plinth: { halfWidth: 70; height: 60; edgeRadius: 6 };
  /** The goose on the plinth per stance: its balls and capsules, and `top`, the starting line's height (160, 145, 125). */
  goose: Record<MountGooseStance, { shapes: MountShape[]; top: number; topX: number }>;
  /** The hen's bones, copied from the cast (§0.8) and pinned to it by a test. Box units at rest. */
  rig: {
    /** Every particle where `still` draws it: torso rump (20, 42), neck (52, 36), hips (32, 57) and (44, 57);
     *  tips footLeft (32, 71), footRight (44, 71), wing (24, 55), wingFar (28, 53), beak (81, 20). */
    rest: MountPose;
    /** Fixed points of the torso: the body's joint (40, 45), both shoulders (47, 35) and (51, 33). */
    bodyJoint: MountVec;
    wingRoot: MountVec;
    wingFarRoot: MountVec;
    /** Each bone's length, joint to tip: legs 14, wings 30.48, head 33.12. Bones never stretch. */
    bone: Record<MountLimb | "wingFar", number>;
    /** The body ball in the torso: centre (41.5, 44), radius 23. */
    body: { c: MountVec; r: number };
    /** The head ball on the head bone: the costume head's centre (58, 10), radius 22. */
    head: { c: MountVec; r: number };
    /** The crown on the head bone: the costume head's top (58, −12). What the line measures. */
    crown: MountVec;
    /** Capsule radii: legs 1.75 (half the leg stroke), wings 12, head bone 12. */
    radius: Record<MountLimb | "wingFar", number>;
    /** Particle masses: each torso particle 4, the beak 2, every other tip 1. */
    mass: Record<MountParticle, number>;
    /** Joint limits as distances, never angles. The first cut has one: beak to rump at least 45. */
    limits: { from: MountParticle; to: MountParticle; min: number }[];
  };
};

// ---- pile/ ----------------------------------------------------------------------------------

/** The round's first pile: the plinth, the goose in the stance the seed deals, the line at its top. */
export const createMountPile: (seed: number) => MountPile;
/** A climb's clock in ticks: (climbSeconds + secondsPerHen × hensOnPile) × tickHz. */
export const resolveMountClimbTicks: (rules: MountClimbRules, hensOnPile: number) => number;
/** The pile as static shapes: plinth, goose, and each stuck hen's body, head, legs and near wing. */
export const resolveMountPileMesh: (pile: MountPile) => MountShape[];
/** The pile's extent, for the TV's fit-all camera and the start stance: leftmost, rightmost, top. */
export const resolveMountPileBounds: (pile: MountPile) => { minX: number; maxX: number; minY: number };
/** The pile with a finished climb's hen added; on a mount the line moves to its crown. */
export const addMountHen: (pile: MountPile, result: MountClimbResult) => MountPile;
/** Where a pose's crown is, and how high. */
export const resolveMountCrown: (pose: MountPose) => MountVec;

// ---- simulate/ ------------------------------------------------------------------------------

/** A climb at tick 0: the hen in the start stance beside `pile`, both feet grabbed on the floor,
 *  the wing and beak limp, the clock resolved from `rules` and the hens on `pile`. */
export const createMountState: (
  seed: number,
  pile: MountPile,
  rules: MountClimbRules,
  playerId: string | null
) => MountState;
/** One tick: applies every sample whose tick equals `state.tick`, then steps. A terminal state is returned as is. */
export const stepMount: (state: MountState, samples: readonly MountInputSample[]) => MountState;
/** Steps until `toTick` or a terminal state. The tablet's loop and the wall's mirror both call this. */
export const advanceMount: (state: MountState, samples: readonly MountInputSample[], toTick: number) => MountState;
/** The referee: the whole climb from the top to its terminal state. Always terminal: the clock guarantees it. */
export const runMountClimb: (
  seed: number,
  pile: MountPile,
  rules: MountClimbRules,
  playerId: string | null,
  samples: readonly MountInputSample[]
) => MountClimbResult;
/** A terminal state's result, or null while the climb runs. */
export const resolveMountOutcome: (state: MountState) => MountClimbResult | null;
```

Rules the sim keeps:

- **Deterministic.** Three parties re-run a climb from the same pile and log (the tablet live,
  the server as referee, the wall as a mirror) and must land on the same bits. The four
  operators, `Math.sqrt`, `Math.imul`, `floor`, `ceil`, `min`, `max` and `abs` only. `sqrt` is
  allowed because IEEE-754 requires it correctly rounded, as it does the four operators (JOUST's
  `noTranscendentals.test.ts` says so and is the copy to take); every trig and exponential member
  and `Math.random` are banned. **There are no angles in the sim.** A bone's direction is a
  vector divided by its `sqrt` length, a perpendicular is `(−dy, dx)`, and a fixed point of a
  rigid part is placed by its coordinates in that part's rest frame. Rotations in degrees, which
  the cast's transforms take, are made in the client (`MountScene/ragdollTransforms`, with
  `Math.atan2`), where nothing is refereed. JSON round-trips a double exactly, so a pile sent
  over the wire is the same pile.
- **Seeded.** `createMountPile` deals the goose's stance from `createMulberry32(seed)`. The climb
  itself draws no random numbers: `seed` rides on the state so a referee re-run names its stream,
  and any later variant that needs one (wind, a goose that shifts) seeds from
  `seed ^ Math.imul(pileIndex + 1, 0x9e3779b9)`, BRAWL's per-block rule.
- **Inputs are a log, not a state.** `stepMount` applies every sample whose `tick` equals the
  state's tick, in log order, before it moves anything. `grab-start` takes the limb: a grabbed
  limb lets go (a let-go event), and the limb is `held` with `target` at the sample's point.
  `move` sets a held limb's target (ignored for a limb not held). `release` turns a held limb
  `seeking`. During a fall's recovery every sample is ignored. The log is non-decreasing in
  tick; a state never looks backwards through it.
- **One tick, in order.** (1) Apply samples. (2) Verlet: every free particle moves by its
  velocity times `damping` plus `gravity`, clamped to `maxSpeed`. (3) Held limbs (below).
  (4) `solverIterations` passes, each in this fixed order: the torso's six pairwise distances,
  each bone's length, each grabbed limb's pin and brace, the joint limits, then contacts against
  the floor and every shape the broad phase kept. (5) Friction on every contact. (6) Seeking tips
  that touch a surface grab it. (7) The fall test. (8) The mount test. (9) The clock.
- **The torso** is four particles held at their rest distances, so it is one rigid piece. Every
  joint that is not a particle (the body's joint, both shoulders) and the body ball are fixed
  points in the torso's frame (origin the rump, x axis toward the neck). **Bones never
  stretch**: a limb tip is held at its bone's length from its joint, so the drawing and the
  physics are always the same bird. The far wing dangles: it has a bone and gravity, no grip,
  no contacts.
- **Held limbs.** The finger's target is projected onto the circle of the bone's length about
  the limb's joint (the nearest point the tip could be). A tip that touched nothing last tick
  moves toward that point by at most `dragStep`, and its bone moves only the tip: waving a limb
  in the air does not move the bird. A tip that is touching a surface is **planted**: the torso
  moves instead, by at most `dragStep`, so the tip comes to lie the way the finger points from
  the joint. That is the push-off: a planted foot dragged down lifts the body; a planted beak
  dragged down hauls it up. A push-off's speed is at most `dragStep` a tick, which Verlet keeps
  as momentum; let go of everything else while pushing and the bird flies. That is the fling.
- **Grabs.** A `seeking` tip whose grip ball overlaps the floor or any shape grabs it: `grabbed`
  at its current point, with the surface it hit, and a grab event. A tip let go while it is
  touching a surface grabs on that same tick: letting go onto a hold is how you take it. A
  grabbed tip is pinned to its point. Its **brace** holds the angle it grabbed at: a distance
  between the tip and the body's joint, kept at the length it had when it grabbed (`brace`),
  correcting at most `braceStrength` a tick. So two grabbed feet stand the bird still, while a
  bird hanging by its beak alone sags and swings. A held, limp or seeking limb has no brace.
- **Contacts.** The climber collides as its body ball, its head ball, both leg capsules and the
  near wing's capsule; a limb tip also has its grip ball. Every one is pushed out of the floor
  and out of the static shapes along the contact normal, the correction shared by the particles
  that carry the shape by their inverse masses, and friction takes `contactFriction` of the
  sliding out. **Broad phase:** each tick only the shapes whose boxes overlap the climber's box
  (grown by `maxSpeed`) are tested, so the cost tracks the holds within reach, not the pile.
  `maxSpeed` (5) is below the thinnest pair that can meet (a leg's 1.75 against
  `minStaticRadius`'s 4), so nothing passes through anything.
- **Falls.** The body ball or the head ball touching the floor is a fall: the pose goes back to
  `start` with no velocity, both feet grabbed on the floor and the wing and beak limp,
  `recoveringUntilTick` is set `fallRecoverTicks` ahead, and the tick is pushed on `falls`.
  `bestHeight` is kept: reached is reached.
- **The start stance** stands the hen as `still` draws it, its toes on the floor (box y 71 is
  world y 0) and its front foot `startGap` left of the pile's leftmost shape, facing the pile.
  Its crown is then 83 units up: `startHeight`.
- **Mount.** On any tick the crown's height is above `pile.highLine.height`, the climb is
  terminal with `outcome: "mounted"`. The hen freezes exactly as it is on that tick, mid-fling
  included: a hen frozen in the air over the pile is a hold like any other.
- **Clock.** `tick ≥ climbTicks` is terminal with `outcome: "timeout"`, and the hen freezes as
  it is. Every tick updates `bestHeight` before the tests.
- **The share.** A mount is 1. A timeout is
  `(bestHeight − startHeight) / (highLine.height − startHeight)`, clamped to at least 0 and below
  1: a hen that stood still banks nothing, and a hen that got its crown to within a head of the
  line banks most of a share.
- **The pile is static.** Stuck hens, goose and plinth never move, and nothing pushes them. A
  stuck hen's shapes are its body ball, head ball, legs and near wing at their frozen places,
  each at least `minStaticRadius` thick; the far wing is drawn and never collides. The live sim
  is one bird of nine particles against that mesh.
- **What the tests pin** (`simulate/index.test.ts`, `pile/index.test.ts`): a hen with all four
  limbs grabbed settles within 30 ticks and then does not move; letting every limb go drops it;
  a seeking tip that touches the goose grabs it and holds; a planted foot dragged down lifts the
  torso; a scripted climb (the **goose bot**, a list of samples) mounts the default goose and
  the line moves to its crown with its `playerId`; a climb that never touches the tablet times
  out with share 0; a fall resets the stance and keeps `bestHeight`; `runMountClimb` and the
  tick-by-tick `advanceMount` land on identical states; a 20-hen pile resolves to a static mesh
  and a 90-second climb against it re-runs on the server in well under a second; the clock is
  `(30 + 3 × hens) × 60` ticks.

### 0.5 Views, actions and surfaces

`MountPlayerFigure` is `BrawlPlayerFigure`'s twin (`playerId`, `name`, `avatarSrc`, `teamId`,
`genre`). Nothing about a climb is secret, so host and display views carry the same fields. One
outer union member each, with the turn's phase as the internal discriminant (authoring guide
§3):

```ts
type MountClimbStatus = "ready" | "running" | "done";
type MountMinigameClimbResult = {
  outcome: MountOutcome; endTick: number; share: number; bestHeight: number; falls: number;
};
type MountMinigameClimb = {
  climbIndex: number;
  player: MountPlayerFigure | null;
  status: MountClimbStatus;
  /** This climb's clock by the published rule, fixed when it comes into hand; null before. */
  climbTicks: number | null;
  /** The climb in hand's log; emptied once the climb is refereed (its hen is on the pile). */
  inputs: MountInputSample[];
  skipped: boolean;
  result: MountMinigameClimbResult | null;
};
type MountMinigameViewFields = {
  minigame: "MOUNT";
  climbIndex: number;
  climbsPerTurn: number;
  /** The published clock rule, for the briefing line and the TV. */
  rules: MountClimbRules;
  /** The round's pile as it stands: every earlier turn's hens and this turn's refereed ones. */
  pile: MountPile;
  /** Every player on the pile or in this turn, so a head and a team colour can be drawn on each hen. */
  figures: Record<string, MountPlayerFigure>;
  climbs: MountMinigameClimb[];
  /** The sum of this turn's shares so far, and the points it is worth now. */
  shareBanked: number;
  pointsSoFar: number;
} & (
  | { phase: "ready" | "running"; points: null }
  | { phase: "finished"; points: number }
);
export type MountMinigameHostView = MountMinigameViewFields;
export type MountMinigameDisplayView = MountMinigameViewFields;
```

**Actions** (bare names, `transientActionTypes: ["limb"]`):

- `limb` `{ samples: MountInputSample[] }`: the tablet batches its samples and flushes every
  70 ms (DRAWING's 14 a second), so the wire carries a handful of actions a second, not sixty.
  The reducer refuses the whole batch if any sample is malformed (unknown limb or kind, a
  coordinate not finite or not a multiple of `inputQuantum`) or ticks below the log's last
  tick, and refuses it once the climb is refereed.
- `endClimb` `{}`: re-runs the log with `runMountClimb(pile.seed, pile, rules, playerId,
  inputs)`, the only reading that scores. The result is banked, its hen joins the pile through
  `addMountHen`, the log is emptied, and the next climb comes into hand with its clock resolved
  from the pile as it now stands.
- `skipClimb` `{}` and `resetTurn` `{}` (§0.6).

**Rules** (`minigameRules.mount`, every field optional, positive integers): `climbSeconds` (30),
`secondsPerHen` (3), `pileSeed` (20261002). **Round memory:** `{ pile }`. `initialize` reads it
with a guard (`isMountRoundMemory`); null or malformed means the round's first turn, and the pile
is `createMountPile(pileSeed)`. The roster comes from `input.teams` (the active team's
`playerIds`) and `input.players`, as BRAWL's `resolveTeamFigures` reads it. Runtime state keeps
`pileAtTurnStart` and `turnStartPoints` for `resetTurn`, and rescores after every climb:
`pendingPointsByTeamId[team] = turnStartPoints + round(pointsMax × shareBanked / climbsPerTurn)`.

**The host surface.** A `<TakeoverCanvas>`: the body's meaning is spread evenly, a climbing
wall. `rail` and `clock` forwarded untouched (`clock` draws nothing; `timerKey` is null).

- `counter`, read-only: "Climb 2 of 4" with the climber's name under it; the climb's clock
  (`data-mount-clock`), written by the paint loop; the line, "Line: Steve, 3.1 hens up" (heights
  shown to people in hens, world units over 72, one decimal).
- `actions`, floating bottom-left: Skip climb, Reset turn, and the hint line. Skip is disabled
  through a beat, for BRAWL's reason. While a climb is ready the hint says whose climb it is and
  what to do ("Caitlin's climb: touch a limb, drag it, let go to grab"); while it runs, nothing.
- `readout`, floating bottom-right, only during a climb's ending beat or once the team is
  through: the finish card, the climb list (who climbed, mounted or how far), and
  `RunningTotals` once finished.

The body is `[data-mount-arena]`: the scene full-bleed through `TABLET_CAMERA_FIT`, with a ring
handle on each limb tip (`[data-mount-limb="footLeft"]`, lit by state). Pointers are tracked by
id with `touch-action: none` and pointer capture; a touch takes the nearest limb tip within
`touchRadius` that no other finger owns, so two thumbs can hold two limbs. The client turns a
pointer into world units through the scene's camera, quantises it, logs `grab-start` at the
current tick, one `move` per `moveSampleTicks` while it moves, and `release` when it lifts, and
the tablet's own sim runs on exactly those samples. When the line is above the close-up, an arrow
on the top edge says how far ("Line 1.4 hens up"). A fall drops every finger's ownership: lift
and touch again. The arena keeps the 4.5rem dock corner clear by the layout, never a hand-typed
gutter. The handoff callout ("Hand it to *name*") is client-only.

`useMountRunner` is `useBrawlRunner`'s twin: a fixed-step sim on the local clock, painted every
frame through a `MountSceneHandle`, the clock started by the first touch, `endClimb` sent when
the local sim is terminal, then a beat before the next climb is drawn. The server's echo never
drives the loop.

**The display surface.** The house `<NeonMarquee>` (game name as kicker) over the pile, a status
line under the stage. The marquee's readout: "Climb 2 of 4 · Caitlin", the climb's clock (the
house last-ten treatment under ten seconds: larger, ticking, the `time` cue at nought), the line's
holder (head and name, or "the goose") with its height, and `pointsSoFar`. The stage is
`MountScene` through `TV_CAMERA_FIT`: the whole pile, the start stance and the line, with a
dashed high line across it and the holder's head hung on it at `highLine.x`. On the intro beat
it is the pile alone, the line and its holder. Once the team is through, the pile holds under a
`<ResultPlaque>` ("3 of 4 mounted", the points). `RunningTotals` never appears on the TV.
`requiresDisplayAudio: true`.

`useMountMirror` is `useBrawlMirror`'s twin: it re-runs the climb in hand from the view's log on
a local clock `MIRROR_DELAY_TICKS` (12, a fifth of a second, longer than BRAWL's 6 because
samples arrive in 70 ms batches) behind, rebuilds from the top only when a sample lands on a tick
it has already drawn, finishes the climb it has before drawing the next, and a wall that missed a
climb (a reload) draws the refereed hen from the pile.

**The scene** (`MountScene`), one component on both surfaces with an imperative handle
(`paint(state)`, `paintMount(state, progress)`, `paintStuck(state, progress)`,
`paintFall(state, progress)`). The pile's hens are `<CharacterRagdollFigure>`s drawn once from
their frozen poses (memoised; they never re-render during a climb); only the climber is painted
per frame. `MountScene/ragdollTransforms` turns a `MountPose` into the cast's
`CharacterRagdollTransforms` (each part's joint and its rotation in degrees against rest). The
goose and the plinth are drawn from the sim's shapes; the Spirit Catcher from `@wingnight/scenery`
stands behind the plinth.

**Cameras** (`MountScene/camera`, after `BrawlScene/camera`): `TABLET_CAMERA_FIT` is a `follow`
camera of `MOUNT_WORLD.view` (240×150) centred on the climber's torso, eased by the scene and
clamped so the floor never rises above the bottom edge. `TV_CAMERA_FIT` is a `fit-all` camera:
the box around the pile's bounds, the start stance, the climber and the line, plus a margin of
20, widened to the stage's aspect and never shorter than 220, eased as the pile grows. Pure,
with tests like BRAWL's.

**Beats** (client-only holds, FAPPY's convention): **mount** (2 s: the sting, the line jumps to
the crown, the holder's head slides onto it, the share pops on the marquee), **stuck** (timeout,
1.6 s: the hen goes still and joins the pile, "Stuck!"), **fall** (0.75 s, the sim's own
recovery: a thud, the hen set upright and blinking), **handoff** (the next climber's name).
Every beat ends on the pile.

**As built (runtime, 2026-10-02): every turn action is stamped.** The plugin envelope carries no
team, so `limb`, `endClimb` and `skipClimb` take an optional `{ teamId, climbIndex }`; an action
stamped for another team or another climb is refused. An `endClimb` on an untouched climb is only
accepted when stamped (Streets of Barrie's `endBlock` rule), so a duplicate tap cannot end the next
player's climb before they touch it. The surfaces always send both stamps. The views are
`MinigameHostViewBase & MountMinigameViewFields` (and the display twin), Streets of Barrie's
pattern, so they also carry `activeTurnTeamId` and `pendingPointsByTeamId`; `pointsSoFar` is
pending points minus the turn's starting points.

### 0.6 Escape hatches

- `skipClimb`: the climb in hand banks nothing (`skipped`, share 0), **no hen joins the pile**,
  and the next player's climb comes into hand. Disabled during a beat.
- `resetTurn`: back to the first climber; `pile` goes back to `pileAtTurnStart` (so this turn's
  hens come off the mountain), and `pendingPointsByTeamId` back to `turnStartPoints`, handing
  back exactly the turn's points. Solo (no other teams) it reads Restart.
- The host's undo, skip and manual override stay on the corner dock (`AGENTS.md` §11). `limb` is
  transient, so undo steps back over a refereed climb, never a drag; `selectRoundMemory` reads
  the latest state, so an undone climb's hen leaves the round's memory too.

### 0.7 Sound

`packages/minigames/mount/src/client/audio/index.ts`: a `createMountSoundboard` cue table on
`@wingnight/audio`, played by the display through `useGameSoundboard`; the tablet is silent
unless `solo`. Synthesised voices, each with a minimum gap per cue (`MOUNT_CUE_MIN_GAP_MS`), and
a master gain. Recorded takes from `assets/sfx/mount/<cue>-N.mp3` replace a cue's synthesis once
they exist.

- `grab`: a short tick when a seeking limb sticks (the state's `grabs`).
- `slip`: a grabbed limb touched loose (`letGoes`).
- `thud`: a fall (`falls`).
- `mount`: the sting when the line moves.
- `time`: the climb's clock reaching nought, a whistle (not in the locked four; added so the
  stuck beat has a sound, §0.10).

The mirror reads the events off its replay (`mirrorEvents/`), so the room hears the grab when
the wall draws it.

### 0.8 Cast needs

Being built in parallel in `packages/cast` as `CharacterRagdollFigure` with its anchors in
`Character/ragdoll`. **The cast is the source of truth for every anchor**; the sim keeps a copy
in `MOUNT_WORLD.rig` (shared cannot import the cast, which depends on shared), and a test in the
mount client pins the two together, JOUST's `ArenaHen` precedent. What the sim needs from it:

- **The part list** in draw order: `wingFar`, `legFar`, `body`, `legNear`, `wingNear`, `head`
  (the tail rides on the body). Six rigid parts, the rig's own five and a far wing.
- **The four limbs** and the part each is the tip of: `footLeft` is `legNear`, `footRight` is
  `legFar`, `wing` is `wingNear`, `beak` is `head`. On a costume head there is no beak; the tip
  is the front edge of the player's photo at mouth height.
- **Joints and tips in bird-box units**, y down, at rest: each segment's joint (hip, shoulder,
  base of the neck), its tip (the point a limb grabs with), its length and its thickness, and the
  body's joint, centre and radius. The sim's bones are those lengths and never stretch.
- **The head ball and the crown**: `CHARACTER_HEAD_CENTRE` with `CHARACTER_HEAD_RADIUS`, and the
  costume head's top (`COSTUME_HEAD_ANCHORS.top` over `cx`), carried on the head bone. The crown
  is measured off the costume head for every player, because that is the silhouette the room
  sees; a drawn-head player mounts by the same point.
- **The transform convention** the figure reads: per part, its joint's position and its rotation
  in degrees clockwise against rest. The client makes these from a pose; the sim never does.
- **Limb reach** is a bone's length about its joint. The sim adds no range: a hen reaches as far
  as it is drawn.

Nothing else in the cast changes, and every existing pose renders byte-identically.

### 0.9 Sandbox and e2e

`createDevManifest({ rules: { climbSeconds: 30, secondsPerHen: 3, pileSeed: 20261002 },
content: null })`: three players a team, so three climbs of 5 points each. The sandbox's team
switch already hands `selectRoundMemory` to the next team's `initialize`
(`SandboxStage/bootRuntime`), so the second team in the sandbox climbs the first team's pile with
no new plumbing.

Data attributes, for the spec and never the drawing:

- On the scene root: `data-mount-scene` (`host` or `display`), `data-mount-camera` (`x y w h` in
  world units), `data-mount-tick`, `data-mount-pile-count`, `data-mount-high-line` (height,
  rounded), `data-mount-line-holder` (a `playerId`, or `goose`), `data-mount-crown-height` and
  `data-mount-falls` (written by the paint loop).
- On each limb handle: `data-mount-limb` and `data-mount-limb-state` (`limp`, `held`, `seeking`,
  `grabbed`), on both scenes.
- On each stuck hen: `data-mount-pile-hen` with `data-mount-player-id`.
- `data-mount-clock` (ticks left) on both surfaces; `data-mount-climb-outcome` on the beat.
- `[data-mount-arena]` on the host's pointer area.

`tests/e2e/mount-sandbox.spec.ts`:

- Both previews draw the scene (scene count 2), pile count 0, line holder `goose`, "Climb 1 of
  3" and the ready hint visible.
- Touching the wing's handle and dragging it onto the goose, then lifting, logs samples and the
  wing's `data-mount-limb-state` reads `grabbed` on the host, then on the display within the
  mirror delay; the clock starts on that first touch.
- Touching a grabbed foot turns it `held`, and lifting it in the air turns it `seeking`.
- **The goose bot:** the sim is chaotic, so the same drags at a slightly different finger
  timing do not reliably mount (found while building the sim: no timing-robust sequence
  exists). Replaying world points through the arena would be a flaky test. Instead the sandbox
  takes a dev-only hook that feeds `MOUNT_GOOSE_BOT_SAMPLES` (from `@wingnight/shared`) into the
  `limb` action at their exact ticks, the same path a real tablet batch takes. The bot mounts on
  tick 458: the line holder becomes the climber's id and the pile count goes to 1 on both
  scenes. The pointer path is covered by the grab and held/seeking checks above, which assert
  that samples are logged and limb states change, never where the bird ends up.
- Skip climb leaves the pile count where it was and shows "Climb 3 of 3".
- Switching the sandbox to the next team draws that pile on both scenes from round memory: pile
  count 1, the same line holder, and the climb's clock longer by `secondsPerHen`.
- The asymmetry (§3): with a pile taller than the tablet's view, the display's camera height
  covers the pile's bounds and the host's is 150.
- No socket request leaves the sandbox.

### 0.10 Open questions

- **Fairness across teams. Needs a table.** The pile only grows, so the last team climbs the
  tallest one. The published compensation is the clock (3 s a hen), and the pile also hands
  later teams more holds, and the line only rises on a mount, so a round where nobody mounts gets
  easier, not harder. Whether that balances is a measurement at a real table: log every climb's
  share by its position in the round over a night, and if late climbs bank less, the levers in
  order are `secondsPerHen`, then a start perch a fixed height under the line (the idea file's
  second candidate), then measuring the share against the climb's own start rather than the
  floor. Whatever ships is printed on the briefing.
- **Fling tuning. Needs a table.** `dragStep`, `braceStrength`, `gravity`, `damping` and
  `contactFriction` together decide whether flinging beats climbing, as it does in the original,
  and whether hanging by the beak is a swing or a drop. The sim tests pin only that both are
  possible. Retune `MOUNT_WORLD` at a table, the way Streets of Barrie's and Slingshlong's
  numbers were.
- **Found while building the sim (2026-10-02), for the table:**
  - Climbing the plinth slowly is nearly impossible. Standing on the floor, the beak and wing
    fall 1 to 3 units short of the plinth top, and two grabbed rigid limbs lock the torso, so a
    climb is beak hooks, hauls and flings. If the room cannot get off the floor in its first
    climb, lower the plinth before touching the physics.
  - The fling is very strong. An early search found a vault over the plinth corner that mounts
    in about 1.4 s with four drags. `dragStep` 4 and `maxSpeed` 5 are the levers.
  - Hanging by the beak is rigid, not a swing. Lifting both feet near the floor usually ends
    in a fall.
  - Near the line, a timeout share reaches 0.99 easily, because flings peak around 157 against
    a line of 160. The share is capped at 0.99, so the mount still matters, but the gap
    between a near miss and a mount is small.
- **The host camera under a held finger.** If the tablet's camera follows the torso, a finger
  held still on the glass keeps moving in world space and a haul never ends. The host runner
  freezes the camera's follow while any finger is down, and resumes when the last one lifts.
  This is a surface rule, not an open question; it is listed here so the surfaces build it.
- **Cast drift.** `@wingnight/cast` depends on shared, so `MOUNT_WORLD.rig` holds copies of the
  cast's anchors. A cast-side test pins them equal; without it, moving a pivot in the cast
  silently desyncs the drawing from the physics.
- **Freezing mid-air.** A hen that mounts or times out mid-fling freezes in the air. That is
  funny and a hold, but a pile of floating hens may read as broken. If it does, settle a
  timed-out hen for up to a second with no input before freezing it (a mount stays instant).
- **Snapshot weight.** A climb's log is at most one `move` per limb every two ticks; a
  90-second climb with a finger always moving is about 2,700 samples, around 100 KB in the view
  while it runs, broadcast on each 70 ms batch. Measure it on the tablet over the LAN before
  shipping. Finished climbs carry no log, and the pile is 9 points a hen, about 8 KB at 20 hens,
  and must survive a display reload like Dunlop Dash's ghost does.
- **The TV's scale.** At 20 hens the pile may be 1,000 units tall and a hen 70 px on the wall.
  If heads stop reading, the fit-all camera could favour the top of the pile and the line over
  the floor.
- **The `time` cue** is a fifth cue beside the locked four, added so the stuck beat has a
  sound. Drop it if the four read better alone.
- **The goose drawing.** Streets of Barrie draws its goose inside its own package. If both games
  want the same goose, it moves to `@wingnight/scenery` or the cast rather than being copied.
- **The keepsake.** The round's last pile is in round memory until the next round starts. Saving
  it as an image (to the pack, beside RECREATE's forgeries) is not in this build.
- **Variants, not v1:** the four-teammates-one-limb-each mode, and the bridge mode across
  Kempenfelt Bay from the dock.

## 1) Why Mount Your Friends

The room already knows the original: Brad's group played it, so the five-second teach is paid.
Its shape is already ours: a turn order, a clock per climber, a hard commit (let go) and then
physics nobody can touch. And the mountain is the other players, which is Slingshlong's insight
("the targets are everyone who isn't on your team") made permanent. Every failure improves the
mountain. A hen stuck sideways across two friends is a worse climb and a better pile, and by the
third team the thing on the wall is twelve of your friends' faces stuck to each other in
whatever shape they fell, with yours three layers down under somebody's foot. Nothing in the
roster is a persistent spectacle like this, and none of the shipped games is about vertigo.

The cost is the cast: the hen had to become a ragdoll before a line of game code (§0.8). Once it
exists the game is one bird against a static mesh, the cheapest kind of physics there is.

## 2) The rules in prose

Each player climbs once, in seating order. The climb starts with your hen standing on the floor
beside the pile, and your clock starts when you first touch the tablet: 30 seconds, plus three
for every hen already on the pile.

Touch a limb (either foot, the wing, the beak), drag it, let go. Wherever it is when you let go,
it grabs: the goose, the plinth, a friend's face. It holds until you touch it again. Hold a limb
against something and drag it the other way and you push off. Let go of everything at once while
pushing and you fly. Hit the floor with your body and you are set back on your feet beside the
pile, the clock still running.

Get the top of your head above the line and you have mounted. Your climb is over, your hen stays
exactly where it is, the line moves up to your head with your name on it, and you bank a full
share of the round's points. If the clock runs out first your hen stays where it is anyway, part
of the mountain for everyone after you, and you bank the part of a share you climbed: halfway
from where you started to the line is half a share. The team's points are its shares over its
climbs, so a team of three and a team of five can both score the round's max.

The pile never resets inside a round. The next team climbs everything your team left.

### 2.1 Near misses

Every unmounted climb scores how far it got, measured from where the hen started, so standing
still is nothing and nearly touching the line is nearly a share. On the sandbox's 15-point turn
of three climbs, two mounts and a climb that got 60% of the way are
`round(15 × 2.6 / 3)` = 13 of 15.

## 3) Information asymmetry

Spectator-only, by camera, over an outcome nobody knows. Nothing is secret: host and display
carry the same fields, and the pile is the same pile on both. But the tablet's close-up is the
sim's 240×150 box around the climber, about three hens wide and two tall, while the TV frames the
whole pile and the line at once. The climber sees the next hold within a bone's length; the room
sees the friend's head two hens up and left that is the route, the gap behind the goose, and how
far the line really is. So the room calls the holds ("Steve's face, up and left!") and the
climber climbs blind to everything else. It collapses at every grab, which both screens show,
and hard at the mount or the clock. The spectating teams have a second stake on top of the read:
their own hens are the holds being used, and the line carries one of their names until it is
beaten. `tests/e2e/mount-sandbox.spec.ts` asserts that the wall's camera covers the pile while
the tablet's does not.

## 4) Principles check (docs/minigame-design-principles.md §11)

1. **Yes.** The climb's clock is on the TV marquee with the house last-ten treatment, larger and
   ticking, and the `time` cue at nought. There is no room timer (`timerKey: null`).
2. ★ **Yes.** Every release is a commit with no undo: the limb grabs whatever it touches. Touching
   a grabbed limb is the bigger one, because letting go of a hold is how you fall. Where the
   bird ends up is the reveal.
3. **Yes.** The mount (2 s), stuck (1.6 s), fall (0.75 s) and handoff beats are all client holds
   before the next demand.
4. **Yes.** An unmounted climb banks the fraction of the way it got: two mounts and a 60% climb
   of three is 13 of 15 (§2.1).
5. **Yes.** The one compensation, the clock growing 3 s a hen, is a published rule on the
   briefing and drawn on the TV. The fairness question (§0.10) will be answered with another
   published rule, never a hidden one.
6. ★ **Yes.** There is no prompt bank; the "bank" is the pile, and three bad climbs that beat
   good ones: a hen that bites the goose's face and hangs there for 30 seconds; a fling that
   freezes upside down in mid-air over the pile at the buzzer; a hen that times out face-down on
   the plinth and becomes the next team's best foothold.
7. **No, and it does not need one.** It is a physics game; there is no creative answer to judge.
   The host keeps skip, reset and the manual override.
8. **Yes.** A fall is a thud and a set-upright on the wall; a timeout freezes your hen into the
   pile in whatever ridiculous pose it was in, permanently, for the rest of the round.
9. ★ **Yes.** Every teammate climbs once; the rest call holds off the TV, which sees the route
   the climber cannot.
10. ★ **Yes.** Spectator-only lead over a nobody-knows outcome, by camera; it collapses at every
    grab and hard at the mount or the clock (§3).
11. **Yes.** The marquee carries the climb of N and whose hands, the clock, the line's holder and
    height, and the points so far, all the time.
12. **Yes.** `RunningTotals` is in the host's readout once the team is through, never on the TV.
13. ★ **Yes.** The spectating teams are the pile: their hens are the holds, a face is a foothold,
    and the line carries one of their names until it is beaten. They call holds and heckle.
14. **Yes.** The mount moves the line and pops the share on the marquee in the same beat, a
    fifth of a second behind the tablet; the server banks it on `endClimb` within the beat.
15. ★ **Yes.** "Drag a limb, let go to grab. Get above the line."
16. **No.** There is no demo beat before the first team. Worth it anyway: the room knows the
    original, the first climb of a round is the shortest (the goose alone, about one hen of
    climbing), and watching the first climber is the demo for everyone after, which is item 16's
    second clause in spirit even though nothing is secret.
17. **Yes, with a stated cost.** One gesture and never a menu, but four limbs is a choice of
    which to move. Two thumbs on two limbs is allowed and never required.
18. **Yes.** The pile only grows, so a turn's first climb is its shortest, and the round's first
    climb is the goose alone.
19. **Yes.** The hint line says whose climb it is and that the tablet is waiting for a touch.
20. **Yes.** Every climber and every stuck hen is the player's own cast bird wearing their head.
    The goose is a prop, like Streets of Barrie's goons.
21. **Yes.** The marquee carries the team, and the pile shows every team's hens in their colours
    with their heads.
22. **Yes.** A fall costs 0.75 s of beat and the climb goes on; nothing costs more.
23. ★ **Yes.** A drag is forgiving and the precision is only in where you let go; shaky hands
    make worse climbs and better piles.
24. **Yes.** Every climb ends on the mount sting or the stuck freeze, and the turn ends on the
    whole pile under a plaque.
25. **Yes, when scheduled with care.** It is a touch-drag physics relay; it must not sit next to
    Slingshlong (also drag and release) or another relay of the cast. It is unscheduled for now.
26. **No.** It is not the finale; Slingshlong stays. The pile is spectacular, but it builds over
    the round rather than landing in one moment, which suits a middle slot.
