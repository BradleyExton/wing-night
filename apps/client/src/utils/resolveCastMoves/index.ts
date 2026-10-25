import { CHARACTER_MOVES, type CharacterMove, type CharacterMovePlay } from "@wingnight/cast";
import type { Outfit } from "@wingnight/shared";

// When a bird on show plays its Move (docs/research/bird-wardrobe.md §2.6). Pure
// numbers in, a play per bird out, so the choreography is testable without a
// beat: the surfaces count the room's beats (`useRoomBeat`) and ask.
//
// - The lobby parade: a bird's Move comes round every eight bars, on a bar its
//   name picks, so the line ripples rather than syncs. A Move is one bar, in
//   place of the pose, and hands it back. When a disco bird plays the Bump, the
//   bird behind it plays the answer in the same bar.
// - The intro lineup: each bird plays its Move once, in seat order, a beat
//   after the bird before it, so the team goes off as a wave.

export const BEATS_PER_BAR = 4;
export const PARADE_MOVE_EVERY_BARS = 8;

// The beat the lineup's wave starts on: four beats is two seconds at the
// lobby's 120 bpm, by when the roster has finished arriving
// (MinigameIntroStageBody's third entrance beat lands at 1.1s and runs 0.6s).
export const LINEUP_MOVE_START_BEAT = 4;

// A dancer: who it is (the name seeds its bar) and the Move it wears, if any.
export type MoveDancer = {
  name: string;
  move: CharacterMove | undefined;
};

const MOVE_IDS: ReadonlySet<string> = new Set(CHARACTER_MOVES);

const isCharacterMove = (id: string): id is CharacterMove => MOVE_IDS.has(id);

/** The Move a resolved outfit wears, when the cast can play it. */
export const resolveOutfitMove = (outfit: Outfit | undefined): CharacterMove | undefined => {
  const item = outfit?.move?.item;

  return item !== undefined && isCharacterMove(item) ? item : undefined;
};

// The cast's hash (FNV-1a over the trimmed, lower-cased name), so the bar is
// the player's own the way their body and groove are: Brad lands his Move on
// the same bar every night, whatever the roster's order. Read off its top bits,
// which the cast's groove tables leave alone, so a bird's bar does not move in
// step with its footwork.
const hashName = (name: string): number => {
  const normalizedName = name.trim().toLowerCase();
  let hash = 2166136261;

  for (let index = 0; index < normalizedName.length; index += 1) {
    hash ^= normalizedName.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash;
};

/** Which of the eight bars a bird's Move falls on. */
export const resolveMoveBarOffset = (name: string): number => (hashName(name) >>> 28) % PARADE_MOVE_EVERY_BARS;

const mod = (value: number, divisor: number): number => ((value % divisor) + divisor) % divisor;

const isDue = (dancer: MoveDancer, bar: number, period: number): boolean =>
  dancer.move !== undefined && bar >= 0 && mod(bar - resolveMoveBarOffset(dancer.name), period) === 0;

// How far back a displaced Move is looked for. A bird is due once a period,
// so its own Move can only have been pushed by the bar before.
const DEFERRAL_DEPTH = 2;

const resolveParadeBar = (
  line: readonly MoveDancer[],
  bar: number,
  period: number,
  depth: number
): Array<CharacterMovePlay | undefined> => {
  const previous = depth > 0 && bar > 0 ? resolveParadeBar(line, bar - 1, period, depth - 1) : [];
  const plays: Array<CharacterMovePlay | undefined> = [];

  line.forEach((dancer, index) => {
    // The Bump is a duet: the bird in front's rump, this bird's chest. The
    // answer wins the bar, and a Move of its own that was due waits one.
    if (index > 0 && plays[index - 1] === "the-bump") {
      plays.push("the-bump-answer");
      return;
    }

    const displaced = previous[index] === "the-bump-answer" && isDue(dancer, bar - 1, period);

    plays.push(isDue(dancer, bar, period) || displaced ? dancer.move : undefined);
  });

  return plays;
};

/**
 * What each bird in a parade line plays in `bar` (counted from 0, the line's
 * first bar on the floor): its Move, the Bump's answer, or nothing (its pose).
 * `line` runs front to back, so the bird at `index + 1` is the one behind
 * `index`, whose chest the Bump's rump lands on.
 *
 * `barsOnFloor` is how many whole bars the line dances before it walks off.
 * Slow music fits fewer than eight, and a bird whose bar never came would
 * leave without its Move; there the period shrinks to the bars there are, so
 * every bird on the floor still plays once.
 */
export const resolveParadeMoves = (
  line: readonly MoveDancer[],
  bar: number,
  barsOnFloor: number = PARADE_MOVE_EVERY_BARS
): Array<CharacterMovePlay | undefined> => {
  const period = Math.max(1, Math.min(PARADE_MOVE_EVERY_BARS, Math.floor(barsOnFloor)));

  return resolveParadeBar(line, bar, period, DEFERRAL_DEPTH);
};

/**
 * What each bird in an intro lineup plays at `beat` (counted from the lineup's
 * first): seat `index` plays its Move for the bar starting on beat
 * `LINEUP_MOVE_START_BEAT + index`, once, and its pose either side.
 */
export const resolveLineupMoves = (
  seats: readonly MoveDancer[],
  beat: number
): Array<CharacterMove | undefined> =>
  seats.map((dancer, index) => {
    const from = LINEUP_MOVE_START_BEAT + index;

    return beat >= from && beat < from + BEATS_PER_BAR ? dancer.move : undefined;
  });

/** The beat after which no lineup seat has a Move left to play. */
export const resolveLineupMovesEndBeat = (seatCount: number): number =>
  LINEUP_MOVE_START_BEAT + seatCount + BEATS_PER_BAR;

// The bar a Move is timed to, from the gaps between the room's last few beats:
// their median (one missed kick or one double-hit does not move it), clamped to
// the clock's own range (BEAT_CLOCK_DEFAULTS: no faster than its refractory
// gap, and a gap longer than a second is a pause, not a tempo).
export const DEFAULT_BAR_MS = 2000;
const MIN_BEAT_MS = 280;
const MAX_BEAT_MS = 1000;

export const resolveBarMs = (beatIntervalsMs: readonly number[]): number => {
  const usable = beatIntervalsMs.filter((interval) => interval >= MIN_BEAT_MS && interval <= MAX_BEAT_MS);

  if (usable.length === 0) {
    return DEFAULT_BAR_MS;
  }

  const sorted = [...usable].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;

  return Math.round(median * BEATS_PER_BAR);
};
