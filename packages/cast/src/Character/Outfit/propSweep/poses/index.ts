import type { CharacterDance } from "../../../../resolvePlayerAppearance/index.js";
import * as figureStyles from "../../../CharacterFigure/styles.js";
import { CHARACTER_PIVOTS, type CharacterPivot } from "../../../geometry/index.js";
import {
  CHARACTER_MOVES,
  resolveCharacterMoveKeys,
  resolveCharacterMovePartTransform,
  resolveCharacterMovePropTransform,
  type CharacterMovePlay,
  type CharacterMovePose
} from "../../../moves/index.js";
import {
  applySweepMatrix,
  multiplySweepMatrix,
  parseSweepTransform,
  type SweepMatrix,
  type SweepPoint
} from "../index.js";

// The face-crossing sweep (docs/research/bird-wardrobe.md §2.1, rule 5 of
// §2.8): every place a Prop is carried while it is drawn — every pose a bird
// on show stands in, every dance's beat and jig extremes, and every frame of
// every Move — as the transforms the figure puts on the Prop's layer and on
// the head. A Prop is drawn only on show (the parade, the intro lineup, the
// portal), so the game poses (ride, peck, hurt, ko) are not swept.
//
// The poses and dances are read from the figure's own tables
// (`CharacterFigure/styles`), so a new step is swept the day it is written.
// A part that loops names a `cast-*` keyframe in the client's index.css, which
// a package cannot import: its turns are copied here, and a name this table
// does not know throws rather than going unswept.
const KEYFRAME_TURNS: Record<string, readonly number[]> = {
  // apps/client/src/index.css
  "cast-tuck": [0, -8],
  "cast-jig-wing": [4, -26, -8],
  "cast-nod": [-4, 5],
  "cast-peck": [0, 22, -4, 18]
};

// The rules, in bird units.
//   strict  standing, idle, walking and flying, and a dance between its wing
//           beats: out of the head box and never through the floor, where the
//           bird stands; with the wing at rest, out of the face-forward corner
//           too (the harness's: right of x 64 above y 40 is pointing at the
//           face), and tucked for a stride, never forward of the face;
//   soft    a dance's wing beat and every frame of a Move: may pass BEHIND the
//           head (the Prop paints in the wing's layer, under the head) and dip
//           SOFT_DIP under the floor, but never cross forward of the face — in
//           the head's own frame, so a nodding head takes its face with it;
//   parked  a Move's flipped frames, where the wing is mirrored to point
//           forward: the Prop holds its place on the body (see the Moves), so
//           it is held to the strict rules in the body's frame.
export const PROP_SWEEP_HEAD_BOX = { x0: 36, x1: 80, y0: -12, y1: 37 } as const;
// The harness's FACE_FORWARD: right of x 64 above y 40 is pointing at the face.
export const PROP_SWEEP_FACE_FORWARD = { x: 64, y: 40 } as const;
export const PROP_SWEEP_FLOOR_Y = 72.75;
export const PROP_SWEEP_SOFT_DIP = 4;

export type PropSweepKind = "strict" | "soft" | "parked";

export type PropSweepPose = {
  label: string;
  kind: PropSweepKind;
  // A strict pose with the wing at rest, which the face-forward corner holds.
  rest: boolean;
  // Where the Prop's layer puts a point of the drawing, in the bird's box.
  prop: SweepMatrix;
  // The frame the face rules are measured in: the head's own (so a nodding
  // head takes its face with it), or for a parked Prop the body's.
  frame: SweepMatrix;
};

const about = ({ x, y }: CharacterPivot, inner: SweepMatrix): SweepMatrix =>
  multiplySweepMatrix(multiplySweepMatrix([1, 0, 0, 1, x, y], inner), [1, 0, 0, 1, -x, -y]);

const turnAbout = (pivot: CharacterPivot, degrees: number): SweepMatrix =>
  about(pivot, parseSweepTransform(`rotate(${degrees})`));

const invert = ([a, b, c, d, e, f]: SweepMatrix): SweepMatrix => {
  const det = a * d - b * c;

  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
};

// Every turn a part's class can put it at: a static `rotate(Ndeg)` (a beat
// pose, or a held pose like `fly`'s legs), or a looping keyframe's stops.
const turnsOf = (className: string | undefined): number[] => {
  if (className === undefined) {
    return [0];
  }

  const turns = [...className.matchAll(/rotate\((-?[\d.]+)deg\)/g)].map((match) => Number(match[1]));
  const looped = [...className.matchAll(/animation:(cast-[a-z-]+)_/g)].flatMap(([, name = ""]) => {
    const stops = KEYFRAME_TURNS[name];

    if (stops === undefined) {
      throw new Error(`the prop sweep does not know the turns of @keyframes ${name}`);
    }

    return [...stops];
  });

  return [...turns, ...looped];
};

const sums = (a: number[], b: number[]): number[] => [...new Set(a.flatMap((x) => b.map((y) => x + y)))];

const SHOWN_POSES = ["still", "idle", "walk", "fly"] as const;

// A strict pose is judged where the bird stands, so only the wing's turns
// matter to it, not the head's.
const strictPose = (label: string, wing: number): PropSweepPose => ({
  label: `${label} (wing ${wing}°)`,
  kind: "strict",
  rest: wing === 0,
  prop: turnAbout(CHARACTER_PIVOTS.wing, wing),
  frame: turnAbout(CHARACTER_PIVOTS.head, 0)
});

const poseSweep = (): PropSweepPose[] =>
  SHOWN_POSES.flatMap((pose) => [...new Set(turnsOf(figureStyles.poses[pose].wing))].map((wing) => strictPose(pose, wing)));

// A dancing part is two layers about the same pivot, the beat (rest or on the
// beat) inside the bird's own jig, so its turn is any beat turn plus any jig turn.
const danceSweep = (): PropSweepPose[] =>
  (Object.keys(figureStyles.dances) as CharacterDance[]).flatMap((dance) => {
    const beat = figureStyles.dances[dance];
    const jig = figureStyles.danceJigs[dance];
    const wings = sums([0, ...turnsOf(beat.wing)], turnsOf(jig.wing));
    const heads = sums([0, ...turnsOf(beat.head)], turnsOf(jig.head));

    return wings.flatMap((wing) =>
      wing === 0
        ? [strictPose(`${dance} dance`, wing)]
        : heads.map((head) => ({
            label: `${dance} dance (wing ${wing}°, head ${head}°)`,
            kind: "soft" as const,
            rest: false,
            prop: turnAbout(CHARACTER_PIVOTS.wing, wing),
            frame: turnAbout(CHARACTER_PIVOTS.head, head)
          }))
    );
  });

// A Move's CSS transform (`translate(Apx, Bpx) rotate(Cdeg) scale(-1, 1)`) as
// the list of functions CSS interpolates between keys: function by function
// when the two lists match, a missing trailing scale padded with identity.
type CssFunction = { name: string; args: number[] };

const cssFunctions = (transform: string): CssFunction[] =>
  [...transform.matchAll(/([a-z]+)\(([^)]*)\)/g)].map(([, name = "", raw = ""]) => ({
    name,
    args: raw.split(",").map((arg) => Number.parseFloat(arg))
  }));

const IDENTITY_ARGS: Record<string, number[]> = { translate: [0, 0], rotate: [0], scale: [1, 1] };

const interpolate = (from: CssFunction[], to: CssFunction[], t: number): CssFunction[] =>
  Array.from({ length: Math.max(from.length, to.length) }, (_, i) => {
    const a = from[i] ?? { name: to[i]!.name, args: IDENTITY_ARGS[to[i]!.name]! };
    const b = to[i] ?? { name: a.name, args: IDENTITY_ARGS[a.name]! };

    if (a.name !== b.name) {
      throw new Error(`a Move interpolates ${a.name} against ${b.name}, which the sweep does not model`);
    }

    return { name: a.name, args: a.args.map((value, k) => value + ((b.args[k] ?? value) - value) * t) };
  });

const cssMatrix = (pivot: CharacterPivot, functions: CssFunction[]): SweepMatrix =>
  about(pivot, parseSweepTransform(functions.map(({ name, args }) => `${name}(${args.join(" ")})`).join(" ")));

// Between two keys CSS moves each function's numbers in a straight line (the
// easing only says how fast), so a few steps along each span see every place
// the Prop passes through, not just where the keys put it.
const STEPS_PER_SPAN = 4;

const bodyFrameOf = (pose: CharacterMovePose): string =>
  resolveCharacterMovePartTransform({ ...pose, wing: 0, wingX: 0, wingY: 0, wingFlip: false }, "wing");

const moveSweep = (move: CharacterMovePlay): PropSweepPose[] => {
  const keys = resolveCharacterMoveKeys(move);

  return keys.slice(0, -1).flatMap(([percent, pose], index) => {
    const [nextPercent, nextPose] = keys[index + 1]!;
    const parked = pose.wingFlip === true && nextPose.wingFlip === true;

    return Array.from({ length: STEPS_PER_SPAN }, (_, step) => {
      const t = step / STEPS_PER_SPAN;
      const at = (of: (pose: CharacterMovePose) => string, pivot: CharacterPivot): SweepMatrix =>
        cssMatrix(pivot, interpolate(cssFunctions(of(pose)), cssFunctions(of(nextPose)), t));

      return {
        label: `${move} at ${(percent + (nextPercent - percent) * t).toFixed(2)}%${parked ? " (wing flipped)" : ""}`,
        kind: parked ? ("parked" as const) : ("soft" as const),
        rest: false,
        prop: at(resolveCharacterMovePropTransform, CHARACTER_PIVOTS.wing),
        frame: parked
          ? at(bodyFrameOf, CHARACTER_PIVOTS.wing)
          : at((p) => resolveCharacterMovePartTransform(p, "head"), CHARACTER_PIVOTS.head)
      };
    });
  });
};

/** Every place a Prop is carried while it is drawn, for a bird of `genre`. */
export const resolvePropSweepPoses = (genre: string): PropSweepPose[] => {
  const moves = [...CHARACTER_MOVES, "the-bump-answer" as const].filter((move) => {
    const id = move === "the-bump-answer" ? "the-bump" : move;

    return MOVE_GENRES[id] === genre || MOVE_GENRES[id] === "shared";
  });

  return [...poseSweep(), ...danceSweep(), ...moves.flatMap(moveSweep)];
};

// Which rail sells each Move (the catalogue's `genre`), so a metal prop is
// swept through metal's Moves and the shared chicken dance, and no others.
const MOVE_GENRES: Record<(typeof CHARACTER_MOVES)[number], string> = {
  "horns-pump": "metal",
  "double-headbang": "metal",
  "heart-point": "pop",
  "sporty-hop": "pop",
  "boot-scoot": "country",
  "yeehaw-buck": "country",
  "night-fever": "disco",
  "the-bump": "disco",
  "chicken-dance": "shared"
};

const inBox = ([x, y]: SweepPoint): boolean =>
  x > PROP_SWEEP_HEAD_BOX.x0 && x < PROP_SWEEP_HEAD_BOX.x1 && y > PROP_SWEEP_HEAD_BOX.y0 && y < PROP_SWEEP_HEAD_BOX.y1;

const inFaceForward = ([x, y]: SweepPoint): boolean => x > PROP_SWEEP_FACE_FORWARD.x && y < PROP_SWEEP_FACE_FORWARD.y;

// In FRONT of the face, in the head's own frame: forward of the head box at
// face height, or forward above it. Behind the head box's front edge the Prop
// is behind the head, which paints over it.
const inFrontOfFace = ([x, y]: SweepPoint): boolean =>
  (x > PROP_SWEEP_HEAD_BOX.x1 && y < PROP_SWEEP_FACE_FORWARD.y) ||
  (x > PROP_SWEEP_FACE_FORWARD.x && y <= PROP_SWEEP_HEAD_BOX.y0);

export type PropSweepFault = { rule: "floor" | "head" | "face"; at: SweepPoint };

/** The first point of the drawing (in its own units) that breaks this pose's rules, or undefined. */
export const resolvePropSweepFault = (points: readonly SweepPoint[], pose: PropSweepPose): PropSweepFault | undefined => {
  const toFrame = invert(pose.frame);
  const floor = PROP_SWEEP_FLOOR_Y + (pose.kind === "strict" ? 0 : PROP_SWEEP_SOFT_DIP);

  for (const point of points) {
    const at = applySweepMatrix(pose.prop, point);
    // Strict poses are judged where the bird stands, as the harness judged
    // them; the others in their own frame (the head's, or the body's when parked).
    const seen = pose.kind === "strict" ? at : applySweepMatrix(toFrame, at);

    if (at[1] > floor) {
      return { rule: "floor", at };
    }

    if (pose.kind !== "soft" && inBox(seen)) {
      return { rule: "head", at };
    }

    if (pose.rest || pose.kind === "parked" ? inFaceForward(seen) : inFrontOfFace(seen)) {
      return { rule: "face", at };
    }
  }

  return undefined;
};
