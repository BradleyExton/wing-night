import {
  CONTRAPTION_BENCHMARK_LAYOUT,
  type ContraptionCircleBody,
  type ContraptionLayout,
  type ContraptionSegment
} from "@wingnight/shared";

/**
 * WN-15's "smallest piece set that still allows a clever solution", made switchable.
 *
 * A full placement editor is the honest way to answer this and is far larger than the rest of the
 * harness, so the lab instead offers prebuilt sets at increasing piece counts: you drive them,
 * watch where the solution space opens up, and record the count. The frame — floor, side walls,
 * bucket — is fixed scenery and is NOT counted as a piece; only the ramps a team would place are.
 *
 * All ramps, no loose marbles, and that is itself a finding: the WN-17 integrator resolves bodies
 * against SEGMENTS only (`resolveSegmentContacts` reduces over `layout.segments`), so two circles
 * pass straight through each other. Until body-vs-body contact exists, every clever solution has
 * to be ramp geometry — a marble cannot deflect the wing. See `contraptionLabCopy.bodyContactNote`.
 */

/** Layout units. The field every set is built on. */
const FIELD = 100;

const FLOOR_Y = 98;

const BUCKET_TOP_Y = 84;

const BUCKET_MIN_X = 40;

const BUCKET_MAX_X = 58;

/** Fixed scenery, identical across every set so the piece count is the only variable. */
const FRAME: readonly ContraptionSegment[] = [
  { id: "floor", from: { x: 0, y: FLOOR_Y }, to: { x: FIELD, y: FLOOR_Y } },
  { id: "wall-left", from: { x: 2, y: 0 }, to: { x: 2, y: FLOOR_Y } },
  { id: "wall-right", from: { x: 98, y: 0 }, to: { x: 98, y: FLOOR_Y } },
  {
    id: "bucket-left",
    from: { x: BUCKET_MIN_X, y: FLOOR_Y },
    to: { x: BUCKET_MIN_X, y: BUCKET_TOP_Y }
  },
  {
    id: "bucket-right",
    from: { x: BUCKET_MAX_X, y: FLOOR_Y },
    to: { x: BUCKET_MAX_X, y: BUCKET_TOP_Y }
  }
];

/** Materials copied from the WN-17 benchmark so sets stay comparable with the shipped fixture. */
const WING: ContraptionCircleBody = {
  id: "wing",
  origin: { x: 10, y: 8 },
  radius: 2.6,
  restitution: 0.28,
  slip: 0.86
};

const ramp = (
  id: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): ContraptionSegment => {
  return { id, from: { x: fromX, y: fromY }, to: { x: toX, y: toY } };
};

const buildLayout = (pieces: readonly ContraptionSegment[]): ContraptionLayout => {
  return {
    gravity: { x: 0, y: 180 },
    segments: [...FRAME, ...pieces],
    bodies: [WING]
  };
};

export type LabPieceSet = {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  /** Pieces a team would have placed. The frame is scenery and is not counted. */
  readonly pieceCount: number;
  readonly layout: ContraptionLayout;
};

/**
 * Every set below is a solved route, found by search against the real integrator and kept only if
 * the wing LANDS and physically CONTACTS every piece it was given. Contact means the wing came
 * within a hair of the segment surface, checked at every one of the 240 integration steps rather
 * than at the 30Hz display sampling — a fast wing clears a ramp between two keyframes, and an
 * earlier proximity-based check counted ramps the wing merely flew past, which quietly turned a
 * "2-piece route" into a 1-piece route with a spectator. An uncontacted piece is scenery, and a set
 * full of scenery makes the piece-count question unanswerable.
 *
 * The sets nest: four extends two, six extends four, so the count is the only thing that varies.
 *
 * Ramps deflect rather than shelve, deliberately. The wing spends most of a run in free fall,
 * because `slip` is applied on every integration step rather than per impact — a body RESTING on a
 * shallow ramp has its tangential velocity multiplied by `slip` 240 times a second and creeps
 * instead of sliding. `contraptionLabCopy.creepNote` carries that up to the room.
 */
const TWO_PIECES: readonly ContraptionSegment[] = [
  ramp("ramp-a", 7.4, 43.9, 26.0, 63.0),
  ramp("ramp-b", 32.8, 73.9, 53.6, 87.4)
];

const FOUR_PIECES: readonly ContraptionSegment[] = [
  ...TWO_PIECES,
  ramp("ramp-c", 67.3, 77.4, 56.6, 83.7),
  ramp("ramp-d", 27.7, 71.7, 45.6, 81.2)
];

const SIX_PIECES: readonly ContraptionSegment[] = [
  ...FOUR_PIECES,
  ramp("ramp-e", 28.6, 73.4, 53.0, 86.7),
  ramp("ramp-f", 36.3, 76.1, 44.4, 83.6)
];

export const LAB_PIECE_SETS: readonly LabPieceSet[] = [
  {
    id: "two",
    label: "2 pieces",
    hint: "Solved route, settles ~1.3s. Two ramps is barely a route — is there a solution to find, or only one?",
    pieceCount: TWO_PIECES.length,
    layout: buildLayout(TWO_PIECES)
  },
  {
    id: "four",
    label: "4 pieces",
    hint: "Extends the 2-piece route; settles ~1.3s. Where alternatives appear — does a wrong piece read as a wrong decision?",
    pieceCount: FOUR_PIECES.length,
    layout: buildLayout(FOUR_PIECES)
  },
  {
    id: "six",
    label: "6 pieces",
    hint: "Extends the 4-piece route; settles ~1.2s. Does a sixth piece add cleverness, or just fiddling?",
    pieceCount: SIX_PIECES.length,
    layout: buildLayout(SIX_PIECES)
  },
  {
    id: "benchmark",
    label: "WN-17 benchmark",
    hint: "The shipped fixture WN-17's byte measurement was taken against — six bodies, its own frame. The control.",
    pieceCount: 2,
    layout: CONTRAPTION_BENCHMARK_LAYOUT
  }
];

const [FIRST_PIECE_SET] = LAB_PIECE_SETS;

export const DEFAULT_PIECE_SET_ID = FIRST_PIECE_SET.id;

export const resolvePieceSet = (id: string): LabPieceSet => {
  return LAB_PIECE_SETS.find((pieceSet) => pieceSet.id === id) ?? FIRST_PIECE_SET;
};
