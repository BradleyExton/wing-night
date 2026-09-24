import type { FappyGate } from "@wingnight/shared";
import { FAPPY_WORLD } from "@wingnight/shared";
import { resolveSchlongFace } from "@wingnight/cast";

import { champCentreX, resolveChampLook, resolveChampPaint } from "../champPaint/index.js";
import { fappyPalette } from "../palette.js";

const OUTLINE_WIDTH = 0.7;

export type ChampRefs = {
  champ: SVGGElement | null;
  balls: SVGGElement | null;
  body: SVGPathElement | null;
  gloss: SVGPathElement | null;
  veins: SVGPathElement | null;
  corona: SVGPathElement | null;
  slit: SVGPathElement | null;
  face: SVGGElement | null;
  cavity: SVGCircleElement | null;
  lid: SVGGElement | null;
  lidSkin: SVGGElement | null;
  pupils: SVGGElement | null;
  spit: SVGGElement | null;
};

// One champ standing up from the sand, drawn as the cast's schlong: balls on
// the ground, a soft veined shaft bent up to a glans, a face on the head that
// watches the bird come. The loop rewrites the body each frame from
// `resolveChampPaint`; nothing here is React-driven per tick. Lit from the
// left like everything else in the desert: a gloss up the shaft, a spot on
// the head, a dark outline so it holds against the dusk at TV distance.
//
// A spitter's head is also a lid: a circle the size of the glans, hinged at
// the rim, with the face on it. Shut, it is hidden and the body's own cap
// shows; opening, it swings back over a dark cavity and the eyes go with it,
// and the glob — off-white, a couple of droplets trailing — leaves the neck.
export const Champ = ({
  gate,
  registerRefs
}: {
  gate: FappyGate;
  registerRefs: (part: keyof ChampRefs, element: SVGElement | null) => void;
}): JSX.Element => {
  const { gateWidth, floorY, spitRadius } = FAPPY_WORLD;
  const look = resolveChampLook(gate);
  const { skin } = look;
  const paint = resolveChampPaint(gate, 0, null);
  const face = resolveSchlongFace({ x: 0, y: 0 }, look.headRadius, null);
  const outline = { stroke: skin.dark, strokeWidth: OUTLINE_WIDTH };
  const balls = [gate.x + 2.3, gate.x + gateWidth - 2.3];
  const isSpitter = gate.spitPeriodTicks > 0;
  const radius = look.headRadius;

  return (
    <g
      data-fappy-champ
      data-champ-x={gate.x}
      data-champ-top={paint.top}
      data-champ-kind={gate.champKind}
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
      <g ref={(element): void => registerRefs("balls", element)} transform={paint.ballsTransform}>
        {balls.map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={floorY - look.ballRadius + 0.3} r={look.ballRadius} fill={skin.body} {...outline} />
            <circle
              cx={cx - look.ballRadius * 0.3}
              cy={floorY - look.ballRadius - look.ballRadius * 0.28}
              r={look.ballRadius * 0.3}
              fill={skin.light}
              opacity={0.75}
            />
          </g>
        ))}
      </g>
      <path
        ref={(element): void => registerRefs("body", element)}
        d={paint.body}
        fill={skin.body}
        strokeLinejoin="round"
        {...outline}
      />
      <path
        ref={(element): void => registerRefs("veins", element)}
        d={paint.veins}
        fill="none"
        stroke={skin.vein}
        strokeWidth={0.42}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      <path
        ref={(element): void => registerRefs("gloss", element)}
        d={paint.gloss}
        fill={skin.light}
        opacity={0.6}
      />
      <path
        ref={(element): void => registerRefs("corona", element)}
        d={paint.corona}
        fill="none"
        stroke={skin.dark}
        strokeWidth={0.6}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        ref={(element): void => registerRefs("slit", element)}
        d={paint.slit}
        fill="none"
        stroke={skin.dark}
        strokeWidth={0.5}
        strokeLinecap="round"
        opacity={0.75}
      />
      <g ref={(element): void => registerRefs("face", element)} transform={paint.faceTransform}>
        {isSpitter && (
          <circle
            ref={(element): void => registerRefs("cavity", element)}
            r={radius * 0.98}
            fill={fappyPalette.mouth}
            stroke={skin.dark}
            strokeWidth={OUTLINE_WIDTH * 0.8}
            display="none"
          />
        )}
        <g ref={(element): void => registerRefs("lid", element)} transform={paint.lidTransform}>
          {isSpitter && (
            <g ref={(element): void => registerRefs("lidSkin", element)} display="none">
              <circle r={radius} fill={skin.body} {...outline} />
              <circle cx={-radius * 0.34} cy={-radius * 0.5} r={radius * 0.3} fill={skin.light} opacity={0.6} />
              <path
                d={`M 0 ${-radius * 0.5} L 0 ${-radius * 0.86}`}
                fill="none"
                stroke={skin.dark}
                strokeWidth={0.5}
                strokeLinecap="round"
                opacity={0.75}
              />
            </g>
          )}
          <circle cx={face.leftEye.x} cy={face.leftEye.y} r={face.eyeRadius} fill={fappyPalette.eye} />
          <circle cx={face.rightEye.x} cy={face.rightEye.y} r={face.eyeRadius} fill={fappyPalette.eye} />
          <g ref={(element): void => registerRefs("pupils", element)} transform={paint.pupilsTransform}>
            <circle cx={face.leftEye.x} cy={face.leftEye.y} r={face.pupilRadius} fill={fappyPalette.pupil} />
            <circle cx={face.rightEye.x} cy={face.rightEye.y} r={face.pupilRadius} fill={fappyPalette.pupil} />
          </g>
          <path d={face.mouth} fill="none" stroke={skin.dark} strokeWidth={0.4} strokeLinecap="round" />
        </g>
      </g>
      {isSpitter && (
        <g ref={(element): void => registerRefs("spit", element)} data-fappy-spit={gate.index} opacity={0}>
          <circle cx={spitRadius * 1.5} cy={spitRadius * 0.7} r={spitRadius * 0.28} fill={fappyPalette.spit} />
          <circle cx={spitRadius * 0.9} cy={spitRadius * 0.35} r={spitRadius * 0.45} fill={fappyPalette.spit} />
          <ellipse
            rx={spitRadius * 1.15}
            ry={spitRadius * 0.92}
            fill={fappyPalette.spit}
            stroke={fappyPalette.spitEdge}
            strokeWidth={0.3}
          />
          <circle cx={-spitRadius * 0.35} cy={-spitRadius * 0.35} r={spitRadius * 0.3} fill="#ffffff" />
        </g>
      )}
    </g>
  );
};
