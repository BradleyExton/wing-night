import { CHARACTER_PARTS, CHARACTER_PIVOTS, type CharacterPart } from "../geometry/index.js";

// The Moves (docs/research/bird-wardrobe.md §2.1, the wardrobe's seventh slot):
// a one-bar flourish a bird on show plays now and then, its owner's choice from
// their team's rail. Drawn and judged as filmstrips in
// `apps/client/public/mockups/cast/outfit-moves.html` (Gate 1 kept all nine),
// and copied from there key for key: a Move is a handful of key poses, and
// every part's transform falls out of each one by the same sum the page does.
//
// A key pose's numbers, in degrees and bird units (SVG sense, + clockwise):
//   <part>        the part's own turn about its pivot: head + nods, wing +
//                 lifts the back tip and − swings it forward, tail + raises it,
//                 a leg + swings its foot back
//   lean          the whole upper body (tail, body, wing, head) turned about
//                 LEAN_AT, between the hips: + pitches forward
//   x, y          the whole bird (a hop is y < 0); drop sinks the upper body
//   <part>X/Y     nudge one part; legNearLift/legFarLift raise a hip
//   wingFlip      the wing mirrored about its own shoulder, so a wing pointing
//                 FORWARD keeps its smooth edge on top and its feather notches
//                 underneath (Gate 1's fix for heart-point and the chicken
//                 dance's clap): the one transform in the rig that is not a turn
//
// A Move is CSS, like every other pose: `resolveCharacterMovesCss` writes one
// keyframe set per moving part per Move (and one for the Prop's layer where the
// Move flips the wing), which `moves.css` holds (a test keeps the two equal),
// and `CharacterFigure`'s `move` plays it once.
export type CharacterMovePose = Partial<
  Record<
    | CharacterPart
    | `${CharacterPart}X`
    | `${CharacterPart}Y`
    | "legNearLift"
    | "legFarLift"
    | "lean"
    | "drop"
    | "x"
    | "y",
    number
  >
> & { wingFlip?: boolean };

const EASE = {
  io: "cubic-bezier(.45,0,.55,1)",
  // snaps into the pose
  out: "cubic-bezier(.15,.85,.3,1)",
  // falls into the next one
  in: "cubic-bezier(.65,0,.85,.35)",
  lin: "linear"
} as const;

type CharacterMoveEase = keyof typeof EASE;

export type CharacterMoveKey = readonly [percent: number, pose: CharacterMovePose, ease?: CharacterMoveEase];

type CharacterMoveScript = {
  id: string;
  genre: string;
  name: string;
  keys: readonly CharacterMoveKey[];
  // The Bump's partner half: the bird behind takes the hip (the parade's
  // scheduler fires it on the neighbour in the same bar).
  roles?: { answer: readonly CharacterMoveKey[] };
};

// Where a lean turns the upper body: between the hips and just under them, so
// the body pitches over legs that stay planted on the foot line.
const LEAN_AT = { x: 38, y: 60 } as const;

const UPPER_PARTS: readonly CharacterPart[] = ["tail", "body", "wing", "head"];

const STOMP: CharacterMovePose = { legNear: -8, legNearLift: 2 };
// The fist pump swings 62° and 16 units between the fist stood up behind
// the head (its tip above the hair top, y < −12) and a low spread wing at
// shoulder height: an upright spike and a low wing are two different
// shapes, which is what makes the pump read in motion. The spiky wing is
// big enough to stand clear of the back at wingX −24; the broody one is not.
const PUMP_UP: CharacterMovePose = { wing: 82, wingX: -24, wingY: -20, tail: -2 };
const PUMP_DOWN: CharacterMovePose = { wing: 20, wingX: -18, wingY: -4, tail: -2 };
// The pointing arm is the wing mirrored (wingFlip), so its smooth edge
// leads and its notches hang underneath; between jabs it folds right
// back down the chest, so each jab is 71° and 9 units out and back.
const JAB: CharacterMovePose = { wing: -26, wingFlip: true, wingX: 11, wingY: 6 };
const JAB_BACK: CharacterMovePose = { wing: 45, wingFlip: true, wingX: 2, wingY: 2, x: 0, lean: 1, head: 1, tail: 10 };
// The bronco's seesaw: a buck (body flat, head down, heels kicked up
// behind) against a rear (upright, head back, feet pawing forward).
const BUCK_LAND: CharacterMovePose = { drop: 4, lean: 6, head: 8, tail: 10, wing: -20 };
const BUCK: CharacterMovePose = { y: -7, lean: 14, head: 12, tail: 30, legNear: 45, legNearX: -4, legFar: 40, legFarX: -3, wing: -20 };
const REAR: CharacterMovePose = { y: -4, lean: -14, head: -18, tail: -8, legNear: -30, legFar: -20, wing: 30, wingX: -8, wingY: -3 };
// Boot-scoot's heel and toe, both on the near (bright) leg.
const SCOOT_HEEL: CharacterMovePose = { x: 5, legFarX: -5, lean: -17, legNear: -46, legNearLift: 3, legNearX: 22, tail: 20, head: -4, wing: -10 };
const SCOOT_TOE: CharacterMovePose = { x: -5, legFarX: 5, lean: 10, legNear: 35, legNearX: -6, legNearLift: 1.6, tail: -14, head: 6, wing: 10 };
// The chicken dance's flap (tail swung low out from under the wing) and
// its clap (the wing folded flat on the chest).
const FLAP_UP: CharacterMovePose = { wing: 84, wingX: -15, wingY: -5, y: -3.5, head: -8, tail: -65 };
const CLAP: CharacterMovePose = { wing: 60, wingFlip: true, wingX: 2, wingY: 2, y: -2, lean: -3, head: -8 };
const FEVER_UP: CharacterMovePose = { wingX: -14, wingY: -6, lean: -10, head: -12, legNear: -28, legNearLift: 3 };

const MOVES: readonly CharacterMoveScript[] = [
  {
    id: "horns-pump", genre: "metal", name: "Fist pump",
    keys: [
      [0, {}],
      [10, { wing: -24, head: 8, drop: 1.5, lean: 3 }, "in"],
      [15, { wing: -30, head: 10, drop: 2, lean: 4, ...STOMP }, "in"],
      [25, { ...PUMP_UP, wing: 84, wingY: -22, y: -4, head: -12, lean: -4, drop: -1.5, ...STOMP }, "out"],
      [31.25, { ...PUMP_DOWN, head: 12, lean: -4 }],
      [37.5, { ...PUMP_UP, head: -10, lean: -3, drop: -1.5, ...STOMP }],
      [43.75, { ...PUMP_DOWN, head: 12, lean: -4 }],
      [50, { ...PUMP_UP, head: -12, lean: -3, drop: -1.5, ...STOMP }],
      [56.25, { ...PUMP_DOWN, head: 12, lean: -4 }],
      [62.5, { ...PUMP_UP, head: -10, lean: -3, drop: -1.5, ...STOMP }],
      [75, { ...PUMP_UP, tail: 0, head: -8, lean: -3 }, "in"],
      [87.5, { wing: -8, head: 4, lean: 1 }],
      [100, {}]
    ]
  },
  {
    id: "double-headbang", genre: "metal", name: "Double headbang",
    keys: [
      [0, {}],
      [12.5, { lean: -5, head: -13, drop: -1, tail: -6, wing: 8 }, "in"],
      [25, { lean: 10, head: 28, drop: 2, tail: 22, wing: -22, legNear: -10, legNearLift: 2 }, "out"],
      [35, { lean: -5, head: -13, drop: -1, tail: -4, wing: 6 }, "in"],
      [50, { lean: 10, head: 28, drop: 2, tail: 22, wing: -22, legNear: -10, legNearLift: 2 }, "out"],
      [60, { lean: -2, head: -8, tail: 0, wing: 4 }],
      [75, { lean: 4, head: 12, drop: 1, tail: 8, wing: -8 }],
      [87.5, { lean: -1, head: -3 }],
      [100, {}]
    ]
  },
  {
    id: "heart-point", genre: "pop", name: "Point and swoon",
    keys: [
      [0, {}],
      [15, { wing: 28, head: -6, lean: -3, tail: 6 }, "in"],
      [25, { ...JAB, head: 4, lean: 5, x: 1.5, tail: 12 }, "out"],
      [31.25, { ...JAB_BACK }],
      [37.5, { ...JAB, head: 4, lean: 5, x: 1.5, tail: 12 }, "out"],
      [40.625, { ...JAB_BACK }],
      [43.75, { ...JAB, wing: -42, wingX: 15, wingY: 6, head: 5, lean: 7, x: 2.5, tail: 14 }, "out"],
      [47, { ...JAB_BACK, head: 0, lean: 2, x: 1, tail: 12 }, "in"],
      [50, { lean: -12, head: -22, tail: 30, wing: 64, wingX: -13, wingY: -3 }, "out"],
      [56.25, { lean: -12, head: -22, tail: 30, wing: 64, wingX: -13, wingY: -3, drop: -2 }],
      [59.375, { lean: -12, head: -22, tail: 30, wing: 64, wingX: -13, wingY: -3 }],
      [62.5, { lean: -12, head: -22, tail: 30, wing: 64, wingX: -13, wingY: -3, drop: -2 }],
      [68.75, { lean: -12, head: -22, tail: 30, wing: 64, wingX: -13, wingY: -3 }],
      [80, { lean: -10, head: -18, tail: 24, wing: 58, wingX: -12, wingY: -3 }, "in"],
      [90, { wing: -8, head: 2, lean: 1 }],
      [100, {}]
    ]
  },
  {
    id: "sporty-hop", genre: "pop", name: "Sporty hop",
    keys: [
      [0, {}],
      [15, { drop: 3.5, head: 10, wing: -24, lean: 6, tail: -8 }, "in"],
      [25, { y: -10, drop: -1, head: -8, wing: 56, wingX: -10, wingY: -3, lean: -4, tail: 2, legNear: 40, legFar: -22 }, "out"],
      [40, { y: -18, drop: -1, head: -10, wing: 86, wingX: -18, wingY: -6, lean: -5, tail: -10, legNear: 62, legFar: -45 }, "in"],
      [50, { drop: 3.5, head: 10, wing: -10, lean: 6, tail: -6 }, "out"],
      [60, { y: -3, drop: -1.5, head: -10, wing: 88, wingX: -18, wingY: -6, lean: -4, tail: -12 }, "out"],
      [75, { drop: -1, head: -8, wing: 86, wingX: -18, wingY: -6, lean: -3, tail: -10 }, "in"],
      [87.5, { wing: -6, head: 2 }],
      [100, {}]
    ]
  },
  {
    id: "boot-scoot", genre: "country", name: "Boot-scoot",
    keys: [
      [0, {}],
      [12.5, { ...SCOOT_HEEL }, "out"],
      [25, { ...SCOOT_TOE }, "out"],
      [37.5, { tail: 0 }],
      [50, { ...SCOOT_HEEL }, "out"],
      [62.5, { ...SCOOT_TOE }, "out"],
      [68.75, { y: -3, lean: -12, legNear: -75, legNearLift: 8, legNearX: 27, tail: 14, head: -8, wing: -24, drop: -1 }, "in"],
      [75, { drop: 4.5, head: 10, tail: 28, wing: 6 }, "out"],
      [87.5, { drop: 0.5, head: 2 }],
      [100, {}]
    ]
  },
  {
    id: "yeehaw-buck", genre: "country", name: "Bronco buck",
    keys: [
      [0, {}],
      [6.25, { ...BUCK_LAND }, "in"],
      [12.5, { ...BUCK }, "out"],
      [25, { ...REAR }, "out"],
      [31.25, { ...BUCK_LAND }, "in"],
      [37.5, { ...BUCK }, "out"],
      [50, { ...REAR }, "out"],
      [62.5, { drop: 4, lean: 7, head: 9, tail: -6, wing: -22 }, "in"],
      [75, { y: -12, drop: -1, legNear: 48, legNearX: -6, legFar: 42, legFarX: -4, lean: -8, head: -16, tail: 28, wing: 50, wingX: -9, wingY: -4 }, "out"],
      [81.25, { drop: 3, head: 7, lean: 3, tail: 8, wing: -6 }, "out"],
      [90, { drop: 0.5, head: 1 }],
      [100, {}]
    ]
  },
  {
    id: "night-fever", genre: "disco", name: "Night Fever point",
    keys: [
      [0, {}],
      [6, { wing: -16, lean: 3, head: 4, drop: 1 }, "in"],
      [12.5, { ...FEVER_UP, wing: 82, x: 1, tail: -95 }, "out"],
      [25, { ...FEVER_UP, wing: 80, head: -10, x: 1, tail: -95, legNear: -26 }, "in"],
      [37.5, { wing: -100, lean: 7, head: 8, x: -1, tail: 6, drop: 1.5 }, "out"],
      [44, { wing: -94, lean: 6, head: 6, x: -1, tail: 4, drop: 1 }, "in"],
      [50, { ...FEVER_UP, wing: 82, x: 1, tail: -95 }, "out"],
      [62.5, { ...FEVER_UP, wing: 82, x: 3, legFarX: -2, tail: -91 }, "out"],
      [68.75, { ...FEVER_UP, wing: 82, x: 1, tail: -95 }],
      [75, { ...FEVER_UP, wing: 82, x: 3, legFarX: -2, tail: -93 }, "out"],
      [82, { ...FEVER_UP, wing: 80, lean: -9, x: 1, tail: -95, legNear: -26 }, "in"],
      [92, { wing: -8, lean: 1, head: 2 }],
      [100, {}]
    ]
  },
  {
    id: "the-bump", genre: "disco", name: "The Bump",
    keys: [
      [0, {}],
      [15, { x: 1.5, lean: -4, head: -6, tail: 10 }, "in"],
      [25, { bodyX: -6, tailX: -7, wingX: -6, bodyY: 1, tailY: 1, wingY: 1, headX: -2, head: -4, wing: -10, tail: -95 }, "out"],
      [31.25, { bodyX: -3, tailX: -3.5, wingX: -3, bodyY: 0.5, tailY: 0.5, wingY: 0.5, headX: -1, head: -2, wing: -5, tail: -50 }, "out"],
      [37.5, { head: -4, tail: 10 }],
      [50, { drop: 2, head: 6, tail: 26, wing: 10 }],
      [56.25, { drop: 0, head: -4, tail: 12, wing: -10 }],
      [62.5, { x: 1.5, lean: -4, head: -6, tail: 10 }, "in"],
      [75, { bodyX: -6, tailX: -7, wingX: -6, bodyY: 1, tailY: 1, wingY: 1, headX: -2, head: -4, wing: -10, tail: -95 }, "out"],
      [81.25, { bodyX: -3, tailX: -3.5, wingX: -3, bodyY: 0.5, tailY: 0.5, wingY: 0.5, headX: -1, head: -2, wing: -5, tail: -50 }, "out"],
      [87.5, { tail: 10 }],
      [100, {}]
    ],
    roles: {
      // The bird behind: leans in to meet the rump, takes it on the chest
      // and is knocked off its feet, both feet flying forward, head and
      // wing thrown back.
      answer: [
        [0, {}],
        [15, { x: -1, lean: -3, head: -2 }, "in"],
        [25, { x: 2, lean: 5, head: 4, tail: 6 }, "out"],
        [31.25, { y: -3, x: -5, legNear: -28, legFar: -20, lean: -8, head: -18, wing: 55, wingX: -12, tail: -14 }, "out"],
        [42, { x: 0, lean: -1, head: -3, wing: 4 }, "in"],
        [50, { drop: 2, head: 6, tail: -26, wing: 10 }],
        [56.25, { drop: 0, head: -4, tail: 26, wing: -10 }],
        [62.5, { x: -1, lean: -3, head: -2 }, "in"],
        [75, { x: 2, lean: 5, head: 4, tail: 6 }, "out"],
        [81.25, { y: -3, x: -5, legNear: -28, legFar: -20, lean: -8, head: -18, wing: 55, wingX: -12, tail: -14 }, "out"],
        [92, { x: 0, lean: -1, head: -3, wing: 4 }, "in"],
        [100, {}]
      ]
    }
  },
  {
    id: "chicken-dance", genre: "shared", name: "The Chicken Dance",
    keys: [
      [0, {}],
      [3.125, { head: 18, drop: 1, wing: -18 }, "out"],
      [9.375, { head: -6, wing: 8 }],
      [15.625, { head: 18, drop: 1, wing: -18 }, "out"],
      [21.875, { head: -6, wing: 8 }],
      [25, { ...FLAP_UP }, "out"],
      [31.25, { wing: -40, drop: 1, head: 4, tail: 4 }, "out"],
      [37.5, { ...FLAP_UP }, "out"],
      [43.75, { wing: -40, drop: 1, head: 4, tail: 4 }, "out"],
      [53.125, { drop: 4, lean: 6, tail: 34, x: -4, head: 2, wing: -10 }, "out"],
      [65.625, { drop: 4, lean: -6, tail: -28, x: 4, head: 2, wing: -10 }, "out"],
      [71.875, { drop: 1, lean: 2, head: 0, wing: -30 }, "in"],
      [78.125, { ...CLAP }, "out"],
      [84.375, { wing: 10, wingFlip: true, wingX: 3, head: 0 }],
      [90.625, { ...CLAP }, "out"],
      [96, { wing: -30 }],
      [100, {}]
    ]
  }
];


/** The nine Moves, by the catalogue id each one is worn under (`OUTFIT_ITEMS`, slot `move`). */
export const CHARACTER_MOVES = [
  "horns-pump",
  "double-headbang",
  "heart-point",
  "sporty-hop",
  "boot-scoot",
  "yeehaw-buck",
  "night-fever",
  "the-bump",
  "chicken-dance"
] as const;
export type CharacterMove = (typeof CHARACTER_MOVES)[number];

/** A Move a figure can play: one of the nine, or the Bump's answer, played on the bird behind. */
export type CharacterMovePlay = CharacterMove | "the-bump-answer";

const SCRIPTS: ReadonlyArray<readonly [CharacterMovePlay, readonly CharacterMoveKey[]]> = MOVES.flatMap((move) => [
  [move.id as CharacterMove, move.keys] as const,
  ...(move.roles === undefined ? [] : [["the-bump-answer" as const, move.roles.answer] as const])
]);

const round = (n: number): number => (Math.abs(n) < 1e-4 ? 0 : Math.round(n * 1000) / 1000);

/**
 * One part's CSS transform in one key pose, about that part's own pivot (the
 * figure has already moved the part's origin there), as the Moves page wrote it.
 */
export const resolveCharacterMovePartTransform = (pose: CharacterMovePose, part: CharacterPart): string => {
  const pivot = CHARACTER_PIVOTS[part];
  let tx = (pose.x ?? 0) + (pose[`${part}X`] ?? 0);
  let ty = (pose.y ?? 0) + (pose[`${part}Y`] ?? 0);
  let turn = pose[part] ?? 0;

  if (UPPER_PARTS.includes(part)) {
    const lean = pose.lean ?? 0;
    const cos = Math.cos((lean * Math.PI) / 180);
    const sin = Math.sin((lean * Math.PI) / 180);
    const vx = LEAN_AT.x - pivot.x;
    const vy = LEAN_AT.y - pivot.y;

    // (I − R)(L − c): the translate that makes "turn about my own pivot" equal
    // "turn about the hips".
    tx += vx - (cos * vx - sin * vy);
    ty += vy - (sin * vx + cos * vy) + (pose.drop ?? 0);
    turn += lean;
  } else if (part === "legNear" || part === "legFar") {
    ty -= pose[`${part}Lift`] ?? 0;
  }

  const flip = part === "wing" && pose.wingFlip === true ? " scale(-1, 1)" : "";

  return `translate(${round(tx)}px, ${round(ty)}px) rotate(${round(turn)}deg)${flip}`;
};

/** A Move's key poses, as its keyframes are written from them (for a sweep that walks the bar). */
export const resolveCharacterMoveKeys = (move: CharacterMovePlay): readonly CharacterMoveKey[] =>
  SCRIPTS.find(([id]) => id === move)?.[1] ?? [];

/**
 * The Prop's CSS transform in one key pose, about the wing's pivot. A Prop is
 * held at the wing and turns with it, except while the wing is flipped: a
 * mirrored wing points FORWARD (the heart-point jab, the chicken dance's
 * clap), and a Prop mirrored with it would point forward across the chest
 * and face (docs/research/bird-wardrobe.md §2.1). For those frames the wing
 * sets the Prop down: it holds its rest place on the body (the lean, drop and
 * hop still carry it; the wing's own turn, nudge and flip do not), the way it
 * hangs slung on the back, and the wing picks it up again as it unflips.
 * Between a held key and a parked one CSS slides it from the wing to the body.
 */
export const resolveCharacterMovePropTransform = (pose: CharacterMovePose): string =>
  resolveCharacterMovePartTransform(
    pose.wingFlip === true ? { ...pose, wing: 0, wingX: 0, wingY: 0, wingFlip: false } : pose,
    "wing"
  );

const REST_TRANSFORM = "translate(0px, 0px) rotate(0deg)";

/** The class a figure playing this Move wears: it names each part's keyframes (`moves.css`). */
export const resolveCharacterMoveClassName = (move: CharacterMovePlay): string => `cast-move-${move}`;

const MOVES_CSS_HEADER = `/* The cast's Moves (packages/cast/src/Character/moves), one bar each.
 * GENERATED by resolveCharacterMovesCss — do not edit by hand; a test fails
 * when this file and the generator disagree, and prints how to rewrite it. */`;

/**
 * Every Move's keyframes and naming class, as `moves.css` must hold them. Each
 * part that moves in a Move gets `@keyframes cast-move-<move>-<part>`, and the
 * Move's class points that part's custom property at it; a part that holds
 * still gets `none`, so nothing a surface wraps the bird in can leak a
 * neighbour's Move into it. The Prop's layer is named too (`--cast-move-prop`):
 * the wing's keyframes, or its own where the Move flips the wing.
 */
export const resolveCharacterMovesCss = (): string => {
  const blocks = SCRIPTS.map(([move, keys]) => {
    const framesOf = (transformOf: (pose: CharacterMovePose) => string) =>
      keys.map(([percent, pose, ease = "io"]) => ({ percent, transform: transformOf(pose), ease }));
    const animated = CHARACTER_PARTS.map((part) => {
      const frames = framesOf((pose) => resolveCharacterMovePartTransform(pose, part));

      return { part, frames, still: frames.every((frame) => frame.transform === REST_TRANSFORM) };
    });
    // The Prop's layer: the wing's own keyframes, unless the Move flips the
    // wing, when it gets its own set (`resolveCharacterMovePropTransform`).
    const propFrames = framesOf(resolveCharacterMovePropTransform);
    const wingFrames = animated.find(({ part }) => part === "wing")?.frames ?? [];
    const propOwn = propFrames.some((frame, index) => frame.transform !== wingFrames[index]?.transform);
    const wingStill = wingFrames.every((frame) => frame.transform === REST_TRANSFORM);
    const propName = propOwn ? `cast-move-${move}-prop` : wingStill ? "none" : `cast-move-${move}-wing`;
    const keyframes = [...animated, ...(propOwn ? [{ part: "prop", frames: propFrames, still: false }] : [])]
      .filter(({ still }) => !still)
      .map(
        ({ part, frames }) =>
          `@keyframes cast-move-${move}-${part} {\n${frames
            .map(
              ({ percent, transform, ease }) =>
                `  ${percent}% {\n    transform: ${transform};\n    animation-timing-function: ${EASE[ease]};\n  }`
            )
            .join("\n")}\n}`
      );
    const names = [
      ...animated.map(({ part, still }) => `  --cast-move-${part}: ${still ? "none" : `cast-move-${move}-${part}`};`),
      `  --cast-move-prop: ${propName};`
    ].join("\n");

    return [...keyframes, `.${resolveCharacterMoveClassName(move)} {\n${names}\n}`].join("\n\n");
  });

  return `${MOVES_CSS_HEADER}\n${blocks.join("\n\n")}\n`;
};
