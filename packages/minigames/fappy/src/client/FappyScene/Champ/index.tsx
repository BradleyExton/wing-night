import type { FappyGate } from "@wingnight/shared";
import { FAPPY_WORLD, resolveFappyChampTop } from "@wingnight/shared";
import { resolveSchlongFace, resolveSchlongPaths, type SchlongVec2 } from "@wingnight/cast";

import { fappyPalette } from "../palette.js";

export const CHAMP_HEAD_RADIUS = 3.5;
export const CHAMP_SHAFT_RADIUS = 2.7;
const BALL_RADIUS = 2.9;
const OUTLINE_WIDTH = 0.7;
// The wiggle: the tip sways this far each way on a slow wave, and the middle
// of the shaft follows it a beat behind, so it whips rather than tilts.
const SWAY_PERIOD_TICKS = 53;
const SWAY_TIP_UNITS = 2.1;
const SWAY_MID_UNITS = 1.1;
const SWAY_LAG_RADIANS = 0.7;
// At full stretch the shaft thins by this much: it is being pulled, not grown.
const STRETCH_THIN = 0.12;
// A champ looks at the bird once it is this close, then watches it past.
const LOOK_RANGE_UNITS = 70;

export type ChampRefs = {
  champ: SVGGElement | null;
  body: SVGPathElement | null;
  gloss: SVGPathElement | null;
  corona: SVGPathElement | null;
  slit: SVGPathElement | null;
  face: SVGGElement | null;
  pupils: SVGGElement | null;
};

export type ChampPaint = {
  body: string;
  gloss: string;
  corona: string;
  slit: string;
  faceTransform: string;
  pupilsTransform: string;
  /** Where the top of the head is this tick — the sim's `champTop`, for the room to read. */
  top: number;
};

const champCentreX = (gate: FappyGate): number => gate.x + FAPPY_WORLD.gateWidth / 2;

/**
 * Where everything on a champ is at one tick. The head's centre is one radius under the
 * sim's `champTop`, so the glans the bird sees is the line the bird dies on; the shaft is a
 * bend from the sand up to it, swaying at the tip and lagging in the middle. `lookAt` is the
 * bird in the gate layer's own coordinates; the pupils follow it once it is close.
 */
export const resolveChampPaint = (gate: FappyGate, tick: number, lookAt: SchlongVec2 | null): ChampPaint => {
  const { floorY } = FAPPY_WORLD;
  const centreX = champCentreX(gate);
  const top = resolveFappyChampTop(gate, tick);
  const phase = ((tick + gate.champPhaseTicks) / SWAY_PERIOD_TICKS) * Math.PI * 2;
  const swayMid = Math.sin(phase) * SWAY_MID_UNITS;
  const swayTip = Math.sin(phase - SWAY_LAG_RADIANS) * SWAY_TIP_UNITS;
  const stretch = gate.champBob > 0 ? (gate.champTop - top) / gate.champBob : 0;
  const base: SchlongVec2 = { x: centreX, y: floorY - 0.5 };
  const head: SchlongVec2 = { x: centreX + swayTip, y: top + CHAMP_HEAD_RADIUS };
  const height = base.y - head.y;
  const spine: SchlongVec2[] = [
    base,
    { x: centreX + swayMid * 0.35, y: base.y - height * 0.3 },
    { x: centreX + swayMid, y: base.y - height * 0.58 },
    { x: centreX + (swayMid + swayTip) / 2, y: base.y - height * 0.82 },
    head
  ];
  const paths = resolveSchlongPaths(spine, {
    shaftRadius: CHAMP_SHAFT_RADIUS * (1 - STRETCH_THIN * stretch),
    headRadius: CHAMP_HEAD_RADIUS
  });
  const isLooking =
    lookAt !== null && Math.abs(lookAt.x - paths.head.x) < LOOK_RANGE_UNITS;
  const face = resolveSchlongFace({ x: 0, y: 0 }, CHAMP_HEAD_RADIUS, isLooking && lookAt !== null
    ? { x: lookAt.x - paths.head.x, y: lookAt.y - paths.head.y }
    : null);

  return {
    body: paths.body,
    gloss: paths.gloss,
    corona: paths.corona,
    slit: paths.slit,
    faceTransform: `translate(${paths.head.x} ${paths.head.y})`,
    pupilsTransform: `translate(${face.pupilOffset.x} ${face.pupilOffset.y})`,
    top
  };
};

// The face at the origin; the loop moves the whole group onto the head.
const FACE = resolveSchlongFace({ x: 0, y: 0 }, CHAMP_HEAD_RADIUS, null);

// One champ standing up from the sand, drawn as the cast's schlong: balls on
// the ground, a soft shaft bent up to a glans, a face on the head that
// watches the bird come. The loop rewrites the body each frame from
// `resolveChampPaint`; nothing here is React-driven per tick. Lit from the
// left like everything else in the desert: a gloss up the shaft, a spot on
// the head, a dark outline so it holds against the dusk at TV distance.
export const Champ = ({
  gate,
  registerRefs
}: {
  gate: FappyGate;
  registerRefs: (part: keyof ChampRefs, element: SVGElement | null) => void;
}): JSX.Element => {
  const { gateWidth, floorY } = FAPPY_WORLD;
  const paint = resolveChampPaint(gate, 0, null);
  const outline = { stroke: fappyPalette.champDark, strokeWidth: OUTLINE_WIDTH };
  const balls = [gate.x + 2.3, gate.x + gateWidth - 2.3];

  return (
    <g
      data-fappy-champ
      data-champ-x={gate.x}
      data-champ-top={paint.top}
      ref={(element): void => registerRefs("champ", element)}
    >
      <ellipse
        cx={champCentreX(gate)}
        cy={floorY + 0.6}
        rx={gateWidth * 0.62}
        ry={1.3}
        fill={fappyPalette.shadow}
        opacity={0.28}
      />
      {balls.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={floorY - BALL_RADIUS + 0.3} r={BALL_RADIUS} fill={fappyPalette.champ} {...outline} />
          <circle
            cx={cx - BALL_RADIUS * 0.3}
            cy={floorY - BALL_RADIUS - BALL_RADIUS * 0.28}
            r={BALL_RADIUS * 0.3}
            fill={fappyPalette.champLight}
            opacity={0.75}
          />
        </g>
      ))}
      <path
        ref={(element): void => registerRefs("body", element)}
        d={paint.body}
        fill={fappyPalette.champ}
        strokeLinejoin="round"
        {...outline}
      />
      <path
        ref={(element): void => registerRefs("gloss", element)}
        d={paint.gloss}
        fill={fappyPalette.champLight}
        opacity={0.6}
      />
      <path
        ref={(element): void => registerRefs("corona", element)}
        d={paint.corona}
        fill="none"
        stroke={fappyPalette.champDark}
        strokeWidth={0.6}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        ref={(element): void => registerRefs("slit", element)}
        d={paint.slit}
        fill="none"
        stroke={fappyPalette.champDark}
        strokeWidth={0.5}
        strokeLinecap="round"
        opacity={0.75}
      />
      <g ref={(element): void => registerRefs("face", element)} transform={paint.faceTransform}>
        <circle cx={FACE.leftEye.x} cy={FACE.leftEye.y} r={FACE.eyeRadius} fill={fappyPalette.eye} />
        <circle cx={FACE.rightEye.x} cy={FACE.rightEye.y} r={FACE.eyeRadius} fill={fappyPalette.eye} />
        <g ref={(element): void => registerRefs("pupils", element)} transform={paint.pupilsTransform}>
          <circle cx={FACE.leftEye.x} cy={FACE.leftEye.y} r={FACE.pupilRadius} fill={fappyPalette.pupil} />
          <circle cx={FACE.rightEye.x} cy={FACE.rightEye.y} r={FACE.pupilRadius} fill={fappyPalette.pupil} />
        </g>
        <path d={FACE.mouth} fill="none" stroke={fappyPalette.champDark} strokeWidth={0.4} strokeLinecap="round" />
      </g>
    </g>
  );
};
