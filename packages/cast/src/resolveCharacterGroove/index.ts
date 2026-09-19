import { hashName } from "../hashName/index.js";

// How loose one bird is, as classes that carry nothing but custom properties.
// The beat is the ROOM's — every dancing bird still answers the `data-beat`
// toggle the music drives — but a floor where they all land it on the same
// millisecond with the same feet reads as a chorus line, not as a party. A
// groove is the set of timings that pull one bird off the others:
//
//   --cast-jig-ms         its footwork tempo, on nobody's clock but its own
//   --cast-jig-delay      where in that footwork it is right now
//   --cast-step-phase     where in a walk stride it is, so a group walking on
//   --cast-step-phase-far   together does not drum its feet in unison either
//   --cast-jive-ms        its whole-body bounce period
//   --cast-jive-delay     where in that bounce it is right now
//   --cast-groove-ms      how snappy its landing on the beat is
//   --cast-groove-delay   how late it lands it (a bird is never early)
//
// The loop offsets are NEGATIVE: a negative delay starts a loop already
// running, part-way through, where a positive one would hold the bird still
// waiting for its turn. Custom properties inherit, so a surface hangs these on
// whatever it wraps a bird in and every part of the drawing picks them up —
// the cast's `dance` and `walk` poses read them out of the shorthands they
// animate with, and fall back to the house timings when nothing sets them.
//
// THREE tables rather than one, each read off its own bit range: a floor of a
// dozen birds would collide on a single table of grooves often enough to stand
// two twins side by side, and twins are the thing this exists to stop. Feet,
// bounce and lag chosen independently is a hundred grooves out of fourteen
// lines. Each is written out in full because Tailwind scans source for class
// LITERALS — a built string is never generated.
export const CHARACTER_FOOTWORKS = [
  "[--cast-jig-ms:210ms] [--cast-jig-delay:0ms] [--cast-step-phase:0ms] [--cast-step-phase-far:-250ms]",
  "[--cast-jig-ms:245ms] [--cast-jig-delay:-90ms] [--cast-step-phase:-120ms] [--cast-step-phase-far:-370ms]",
  "[--cast-jig-ms:275ms] [--cast-jig-delay:-180ms] [--cast-step-phase:-250ms] [--cast-step-phase-far:-500ms]",
  "[--cast-jig-ms:305ms] [--cast-jig-delay:-60ms] [--cast-step-phase:-370ms] [--cast-step-phase-far:-620ms]",
  "[--cast-jig-ms:230ms] [--cast-jig-delay:-145ms] [--cast-step-phase:-60ms] [--cast-step-phase-far:-310ms]",
  "[--cast-jig-ms:330ms] [--cast-jig-delay:-240ms] [--cast-step-phase:-310ms] [--cast-step-phase-far:-560ms]"
] as const;

export const CHARACTER_BOUNCES = [
  "[--cast-jive-ms:700ms] [--cast-jive-delay:0ms]",
  "[--cast-jive-ms:880ms] [--cast-jive-delay:-310ms]",
  "[--cast-jive-ms:640ms] [--cast-jive-delay:-450ms]",
  "[--cast-jive-ms:1020ms] [--cast-jive-delay:-140ms]",
  "[--cast-jive-ms:780ms] [--cast-jive-delay:-620ms]"
] as const;

// How late a bird is on the beat. Half a beat at the 120 BPM the floor falls
// back to is 250ms, so nothing here lags past a bird still dancing to the bar
// the room is hearing.
export const CHARACTER_BEAT_LAGS = [
  "[--cast-groove-ms:120ms] [--cast-groove-delay:0ms]",
  "[--cast-groove-ms:160ms] [--cast-groove-delay:40ms]",
  "[--cast-groove-ms:200ms] [--cast-groove-delay:90ms]",
  "[--cast-groove-ms:135ms] [--cast-groove-delay:130ms]",
  "[--cast-groove-ms:185ms] [--cast-groove-delay:60ms]",
  "[--cast-groove-ms:145ms] [--cast-groove-delay:170ms]"
] as const;

const pick = (table: readonly string[], hash: number, shift: number): string =>
  table[(hash >>> shift) % table.length] ?? table[0] ?? "";

// Seeded off the NAME like the rest of the appearance, and off bit ranges of
// their own so a bird's groove does not move with its body: Brad dances Brad's
// dance night after night, and reordering the roster does not reshuffle the
// floor.
export const resolveCharacterGrooveClassName = (name: string): string => {
  const hash = hashName(name);

  return [
    pick(CHARACTER_FOOTWORKS, hash, 4),
    pick(CHARACTER_BOUNCES, hash, 12),
    pick(CHARACTER_BEAT_LAGS, hash, 20)
  ].join(" ");
};
