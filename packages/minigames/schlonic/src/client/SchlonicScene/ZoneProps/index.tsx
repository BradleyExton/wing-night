import { resolveSchlongFace, resolveSchlongPaths, type SchlongVec2 } from "@wingnight/cast";
import type { SchlonicProp, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../palette.js";

// Everything standing on the zone's floor, drawn once and scrolled with it. A taken ring and a
// squashed schlong are hidden by the paint loop through these refs rather than by a re-render:
// there are a couple of hundred of them and the loop runs at sixty frames a second.
export type RegisterProp = (index: number, element: SVGGElement | null) => void;

const BADNIK_HEAD_RADIUS = 2.4;
const BADNIK_SHAFT_RADIUS = 1.7;
const BADNIK_BALL_RADIUS = 1.7;
const THORN_HEAD_RADIUS = 1.5;
const THORN_SHAFT_RADIUS = 1.1;
const THORNS_PER_BED = 3;
const SPRING_HEAD_RADIUS = 2.1;
const SPRING_SHAFT_RADIUS = 1.6;
const OUTLINE_WIDTH = 0.45;

type SchlongSkin = {
  body: string;
  dark: string;
  light: string;
};

const PINK: SchlongSkin = {
  body: schlonicPalette.schlong,
  dark: schlonicPalette.schlongDark,
  light: schlonicPalette.schlongLight
};

const CRIMSON: SchlongSkin = {
  body: schlonicPalette.thorn,
  dark: schlonicPalette.thornDark,
  light: schlonicPalette.schlongLight
};

// One body along a spine, in the cast's own drawing (§2.8, `resolveSchlongPaths`): the shaft,
// the gloss down its lit side, the rim and the slit. Everything in the zone that is not a ring
// or the ground is one of these.
const SchlongBody = ({
  spine,
  shaftRadius,
  headRadius,
  skin
}: {
  spine: SchlongVec2[];
  shaftRadius: number;
  headRadius: number;
  skin: SchlongSkin;
}): JSX.Element => {
  const paths = resolveSchlongPaths(spine, { shaftRadius, headRadius });

  return (
    <g>
      <path
        d={paths.body}
        fill={skin.body}
        stroke={skin.dark}
        strokeWidth={OUTLINE_WIDTH}
        strokeLinejoin="round"
      />
      <path d={paths.gloss} fill={skin.light} opacity={0.6} />
      <path
        d={paths.corona}
        fill="none"
        stroke={skin.dark}
        strokeWidth={OUTLINE_WIDTH * 0.9}
        strokeLinecap="round"
        opacity={0.8}
      />
      <path
        d={paths.slit}
        fill="none"
        stroke={skin.dark}
        strokeWidth={OUTLINE_WIDTH * 0.8}
        strokeLinecap="round"
        opacity={0.7}
      />
    </g>
  );
};

// Two white eyes and a smile on the glans, the JOUST convention. Only the enemy gets one: a
// face is how the room tells the thing that is alive from the scenery that is not.
const SchlongFace = ({
  head,
  headRadius,
  lookAt
}: {
  head: SchlongVec2;
  headRadius: number;
  lookAt: SchlongVec2;
}): JSX.Element => {
  const face = resolveSchlongFace(head, headRadius, lookAt);

  return (
    <g>
      <circle cx={face.leftEye.x} cy={face.leftEye.y} r={face.eyeRadius} fill={schlonicPalette.eye} />
      <circle cx={face.rightEye.x} cy={face.rightEye.y} r={face.eyeRadius} fill={schlonicPalette.eye} />
      <circle
        cx={face.leftEye.x + face.pupilOffset.x}
        cy={face.leftEye.y + face.pupilOffset.y}
        r={face.pupilRadius}
        fill={schlonicPalette.pupil}
      />
      <circle
        cx={face.rightEye.x + face.pupilOffset.x}
        cy={face.rightEye.y + face.pupilOffset.y}
        r={face.pupilRadius}
        fill={schlonicPalette.pupil}
      />
      <path
        d={face.mouth}
        fill="none"
        stroke={schlonicPalette.schlongDark}
        strokeWidth={0.35}
        strokeLinecap="round"
      />
    </g>
  );
};

const GroundShadow = ({ x, y, radius }: { x: number; y: number; radius: number }): JSX.Element => (
  <ellipse cx={x} cy={y + 0.5} rx={radius} ry={1.1} fill={schlonicPalette.shadow} opacity={0.3} />
);

const Ring = ({ prop }: { prop: SchlonicProp }): JSX.Element => (
  <g data-schlonic-ring={prop.index}>
    <circle
      cx={prop.x}
      cy={prop.y}
      r={SCHLONIC_WORLD.ringRadius}
      fill="none"
      stroke={schlonicPalette.ring}
      strokeWidth={1.3}
    />
    <circle
      cx={prop.x - 0.7}
      cy={prop.y - 0.7}
      r={SCHLONIC_WORLD.ringRadius * 0.4}
      fill={schlonicPalette.ringCore}
      opacity={0.8}
    />
  </g>
);

/**
 * The enemy: a schlong standing up out of the turf on its own balls, leaning back a little, with
 * a face on the glans that watches the runner come. Squashed by anything that lands on it — which
 * is to say by a bird in a ball, which is the whole reason for jumping on one.
 */
const Badnik = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const top = prop.y - SCHLONIC_WORLD.badnikHeight;
  const head: SchlongVec2 = { x: prop.x - 0.5, y: top + BADNIK_HEAD_RADIUS };
  const base: SchlongVec2 = { x: prop.x + 0.6, y: prop.y - 0.4 };
  const height = base.y - head.y;
  const spine: SchlongVec2[] = [
    base,
    { x: prop.x + 0.9, y: base.y - height * 0.35 },
    { x: prop.x + 0.4, y: base.y - height * 0.7 },
    head
  ];

  return (
    <g data-schlonic-badnik={prop.index}>
      <GroundShadow x={prop.x} y={prop.y} radius={SCHLONIC_WORLD.badnikWidth * 0.62} />
      {[prop.x - 1.9, prop.x + 2.1].map((ballX) => (
        <circle
          key={ballX}
          cx={ballX}
          cy={prop.y - BADNIK_BALL_RADIUS + 0.2}
          r={BADNIK_BALL_RADIUS}
          fill={schlonicPalette.schlong}
          stroke={schlonicPalette.schlongDark}
          strokeWidth={OUTLINE_WIDTH}
        />
      ))}
      <SchlongBody
        spine={spine}
        shaftRadius={BADNIK_SHAFT_RADIUS}
        headRadius={BADNIK_HEAD_RADIUS}
        skin={PINK}
      />
      {/* It is looking back down the zone, at whatever is coming. */}
      <SchlongFace head={head} headRadius={BADNIK_HEAD_RADIUS} lookAt={{ x: head.x - 30, y: head.y }} />
    </g>
  );
};

/**
 * The thorn bed: the same creature, stubbier and crimson, several of them splayed out of the
 * turf with no face on any of them. It is scenery, not an enemy — there is no squashing it, and
 * it costs you half the handful however you arrive.
 */
const Thorns = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { spikeWidth, spikeHeight } = SCHLONIC_WORLD;
  const left = prop.x - spikeWidth / 2;
  const step = spikeWidth / THORNS_PER_BED;

  return (
    <g data-schlonic-spike={prop.index}>
      <GroundShadow x={prop.x} y={prop.y} radius={spikeWidth * 0.5} />
      {Array.from({ length: THORNS_PER_BED }, (_unused, index) => {
        const rootX = left + step * (index + 0.5);
        // They splay: the outer two lean away from the middle, so the bed reads as a bed.
        const lean = (index - (THORNS_PER_BED - 1) / 2) * 2.8;
        const head: SchlongVec2 = { x: rootX + lean, y: prop.y - spikeHeight + THORN_HEAD_RADIUS };
        const base: SchlongVec2 = { x: rootX, y: prop.y - 0.2 };

        return (
          <SchlongBody
            key={index}
            spine={[base, { x: rootX + lean * 0.5, y: (base.y + head.y) / 2 }, head]}
            shaftRadius={THORN_SHAFT_RADIUS}
            headRadius={THORN_HEAD_RADIUS}
            skin={CRIMSON}
          />
        );
      })}
    </g>
  );
};

/**
 * The springboard: a schlong arched back out of the turf with a red-and-white pad strapped over
 * the glans. The pad is the whole signal — the body is the same pink as the enemy, so the stripe
 * is what tells the room that this one is on their side.
 */
const Springboard = ({ prop }: { prop: SchlonicProp }): JSX.Element => {
  const { springWidth, springHeight } = SCHLONIC_WORLD;
  const head: SchlongVec2 = { x: prop.x + 2.4, y: prop.y - springHeight + SPRING_HEAD_RADIUS };
  const base: SchlongVec2 = { x: prop.x - springWidth / 2, y: prop.y - 0.4 };
  const padHalf = SPRING_HEAD_RADIUS * 1.25;

  return (
    <g data-schlonic-spring={prop.index}>
      <GroundShadow x={prop.x} y={prop.y} radius={springWidth * 0.55} />
      <SchlongBody
        spine={[
          base,
          { x: prop.x - 2.4, y: prop.y - springHeight * 0.45 },
          { x: prop.x - 0.4, y: prop.y - springHeight * 0.8 },
          head
        ]}
        shaftRadius={SPRING_SHAFT_RADIUS}
        headRadius={SPRING_HEAD_RADIUS}
        skin={PINK}
      />
      <rect
        x={head.x - padHalf}
        y={head.y - SPRING_HEAD_RADIUS - 1.2}
        width={padHalf * 2}
        height={1.9}
        rx={0.5}
        fill={schlonicPalette.pad}
        stroke={schlonicPalette.padDark}
        strokeWidth={OUTLINE_WIDTH}
      />
      <rect
        x={head.x - padHalf * 0.45}
        y={head.y - SPRING_HEAD_RADIUS - 1}
        width={padHalf * 0.9}
        height={1.5}
        fill={schlonicPalette.padStripe}
      />
    </g>
  );
};

const GoalPost = ({ goalX, groundY }: { goalX: number; groundY: number }): JSX.Element => (
  <g data-schlonic-goal>
    <rect x={goalX - 0.9} y={groundY - 30} width={1.8} height={30} fill={schlonicPalette.postPole} />
    <circle cx={goalX} cy={groundY - 31} r={3.4} fill={schlonicPalette.post} />
    <path
      d={`M ${goalX + 1} ${groundY - 28} L ${goalX + 14} ${groundY - 25} L ${goalX + 1} ${groundY - 22} Z`}
      fill={schlonicPalette.pad}
      stroke={schlonicPalette.padDark}
      strokeWidth={0.4}
    />
  </g>
);

type ZonePropsProps = {
  zone: SchlonicZone;
  registerProp: RegisterProp;
  goalGroundY: number;
};

const drawProp = (prop: SchlonicProp): JSX.Element => {
  if (prop.kind === "ring") {
    return <Ring prop={prop} />;
  }

  if (prop.kind === "spike") {
    return <Thorns prop={prop} />;
  }

  if (prop.kind === "spring") {
    return <Springboard prop={prop} />;
  }

  return <Badnik prop={prop} />;
};

export const ZoneProps = ({ zone, registerProp, goalGroundY }: ZonePropsProps): JSX.Element => (
  <g data-schlonic-props>
    {zone.props.map((prop) => (
      <g
        key={prop.index}
        ref={(element): void => {
          registerProp(prop.index, element);
        }}
      >
        {drawProp(prop)}
      </g>
    ))}
    <GoalPost goalX={zone.goalX} groundY={goalGroundY} />
  </g>
);
