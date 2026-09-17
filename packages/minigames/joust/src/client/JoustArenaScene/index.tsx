import type { JoustFrame, JoustMinigameArena, JoustObstacle } from "@wingnight/shared";
import {
  JOUST_BODIES,
  JOUST_CHAMP_BALL_INDICES,
  JOUST_CHAMP_BASE_INDEX,
  JOUST_CHAMP_HEAD_INDEX,
  JOUST_SHOOTER_BALL_INDICES,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_WORLD,
  readJoustFramePosition
} from "@wingnight/shared";

import { joustPalette } from "./palette.js";
import * as styles from "./styles.js";

export type JoustArenaSceneProps = {
  arena: JoustMinigameArena;
  // Every body's centre, flat, in JOUST_BODIES order — a rest pose or a track frame.
  frame: JoustFrame;
  // Draws the bands stretched to the shooter's tail rather than hanging slack.
  isAiming: boolean;
  // The champ body being struck, for the impact burst; null between hits.
  impactBodyIndex: number | null;
  // Prefix for gradient ids, so two scenes on one page do not collide.
  sceneId: string;
  label: string;
};

const PRONG_SPREAD = 5;
const PRONG_RISE = 4;

const toPolyline = (frame: JoustFrame, fromIndex: number, toIndex: number): string => {
  const parts: string[] = [];

  for (let index = fromIndex; index <= toIndex; index += 1) {
    const position = readJoustFramePosition(frame, index);
    parts.push(`${index === fromIndex ? "M" : "L"}${position.x} ${position.y}`);
  }

  return parts.join(" ");
};

const Cactus = ({ obstacle }: { obstacle: JoustObstacle }): JSX.Element => {
  const radius = Math.min(obstacle.width / 2, 4);
  const hasArms = obstacle.height >= 16;
  const armY = obstacle.y + obstacle.height * 0.42;
  const armWidth = Math.max(2.4, obstacle.width * 0.55);

  return (
    <g>
      <rect
        x={obstacle.x}
        y={obstacle.y}
        width={obstacle.width}
        height={obstacle.height}
        rx={radius}
        fill={joustPalette.cactus}
        stroke={joustPalette.cactusDark}
        strokeWidth={0.8}
      />
      {hasArms && (
        <>
          <rect
            x={obstacle.x - armWidth - 0.6}
            y={armY}
            width={armWidth + 1.2}
            height={armWidth}
            rx={armWidth / 2}
            fill={joustPalette.cactus}
            stroke={joustPalette.cactusDark}
            strokeWidth={0.8}
          />
          <rect
            x={obstacle.x - armWidth - 0.6}
            y={armY - obstacle.height * 0.22}
            width={armWidth}
            height={obstacle.height * 0.22 + armWidth}
            rx={armWidth / 2}
            fill={joustPalette.cactus}
            stroke={joustPalette.cactusDark}
            strokeWidth={0.8}
          />
        </>
      )}
      <line
        x1={obstacle.x + obstacle.width * 0.5}
        y1={obstacle.y + radius}
        x2={obstacle.x + obstacle.width * 0.5}
        y2={obstacle.y + obstacle.height - 1}
        stroke={joustPalette.cactusLight}
        strokeWidth={0.7}
        strokeDasharray="1.2 1.6"
        opacity={0.7}
      />
    </g>
  );
};

const Combatant = ({
  frame,
  shaftFrom,
  shaftTo,
  ballIndices,
  fill,
  dark,
  light,
  facing
}: {
  frame: JoustFrame;
  shaftFrom: number;
  shaftTo: number;
  ballIndices: readonly [number, number];
  fill: string;
  dark: string;
  light: string;
  facing: 1 | -1;
}): JSX.Element => {
  const shaftRadius = JOUST_BODIES[shaftFrom]?.radius ?? 2;
  const head = readJoustFramePosition(frame, shaftTo);
  const headRadius = JOUST_BODIES[shaftTo]?.radius ?? 3;

  return (
    <g>
      {ballIndices.map((ballIndex) => {
        const ball = readJoustFramePosition(frame, ballIndex);
        const radius = JOUST_BODIES[ballIndex]?.radius ?? 2;

        return (
          <circle
            key={ballIndex}
            cx={ball.x}
            cy={ball.y}
            r={radius}
            fill={fill}
            stroke={dark}
            strokeWidth={0.8}
          />
        );
      })}
      <path
        d={toPolyline(frame, shaftFrom, shaftTo)}
        fill="none"
        stroke={dark}
        strokeWidth={shaftRadius * 2 + 1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={toPolyline(frame, shaftFrom, shaftTo)}
        fill="none"
        stroke={fill}
        strokeWidth={shaftRadius * 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={head.x} cy={head.y} r={headRadius} fill={fill} stroke={dark} strokeWidth={0.8} />
      <circle
        cx={head.x - facing * 0.8}
        cy={head.y - 1}
        r={headRadius * 0.45}
        fill={light}
        opacity={0.55}
      />
      <circle cx={head.x + facing * 1.1} cy={head.y - 0.7} r={0.95} fill={joustPalette.eye} />
      <circle cx={head.x - facing * 0.9} cy={head.y - 0.7} r={0.95} fill={joustPalette.eye} />
      <circle cx={head.x + facing * 1.35} cy={head.y - 0.6} r={0.45} fill={joustPalette.pupil} />
      <circle cx={head.x - facing * 0.65} cy={head.y - 0.6} r={0.45} fill={joustPalette.pupil} />
    </g>
  );
};

const ImpactBurst = ({ frame, bodyIndex }: { frame: JoustFrame; bodyIndex: number }): JSX.Element => {
  const centre = readJoustFramePosition(frame, bodyIndex);
  const points: string[] = [];
  const spikes = 8;

  // Alternating outer/inner radii around the struck body. Screen-side only, so
  // the trig here never touches the deterministic track.
  for (let index = 0; index < spikes * 2; index += 1) {
    const angle = (Math.PI * index) / spikes;
    const radius = index % 2 === 0 ? 8 : 3.6;
    points.push(`${centre.x + Math.cos(angle) * radius},${centre.y + Math.sin(angle) * radius}`);
  }

  return (
    <g className={styles.burst} data-joust-impact>
      <polygon
        points={points.join(" ")}
        fill={joustPalette.burst}
        stroke={joustPalette.burstCore}
        strokeWidth={0.8}
        strokeLinejoin="round"
        opacity={0.92}
      />
    </g>
  );
};

export const JoustArenaScene = ({
  arena,
  frame,
  isAiming,
  impactBodyIndex,
  sceneId,
  label
}: JoustArenaSceneProps): JSX.Element => {
  const { anchor, floorY, width, height } = JOUST_WORLD;
  const tail = readJoustFramePosition(frame, 0);
  const bandTarget = isAiming ? tail : anchor;
  const skyGradientId = `${sceneId}-sky`;
  const sandGradientId = `${sceneId}-sand`;
  const worldClipId = `${sceneId}-world`;

  return (
    <div className={styles.frame}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label}
        data-joust-scene
      >
        <defs>
          <linearGradient id={skyGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={joustPalette.skyTop} />
            <stop offset="62%" stopColor={joustPalette.skyMid} />
            <stop offset="100%" stopColor={joustPalette.horizon} />
          </linearGradient>
          <linearGradient id={sandGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={joustPalette.sand} />
            <stop offset="100%" stopColor={joustPalette.sandDark} />
          </linearGradient>
          {/* A shot that leaves the world must not be drawn over the letterbox. */}
          <clipPath id={worldClipId}>
            <rect x={0} y={0} width={width} height={height} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${worldClipId})`}>
        <rect x={0} y={0} width={width} height={floorY} fill={`url(#${skyGradientId})`} />
        <circle cx={width - 26} cy={22} r={7} fill={joustPalette.sun} opacity={0.9} />
        <ellipse cx={34} cy={floorY} rx={46} ry={8} fill={joustPalette.duneFar} />
        <ellipse cx={116} cy={floorY + 1} rx={58} ry={10} fill={joustPalette.duneNear} />
        <rect
          x={0}
          y={floorY}
          width={width}
          height={height - floorY}
          fill={`url(#${sandGradientId})`}
        />
        <line
          x1={0}
          y1={floorY}
          x2={width}
          y2={floorY}
          stroke={joustPalette.sandLine}
          strokeWidth={0.8}
        />

        {arena.obstacles.map((obstacle, index) => (
          <Cactus key={index} obstacle={obstacle} />
        ))}

        <g>
          <rect
            x={anchor.x - 1.6}
            y={anchor.y + 1}
            width={3.2}
            height={floorY - anchor.y - 1}
            rx={1.2}
            fill={joustPalette.post}
            stroke={joustPalette.postDark}
            strokeWidth={0.6}
          />
          <path
            d={`M${anchor.x} ${anchor.y + 2} L${anchor.x - PRONG_SPREAD} ${anchor.y - PRONG_RISE}`}
            stroke={joustPalette.post}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <path
            d={`M${anchor.x} ${anchor.y + 2} L${anchor.x + PRONG_SPREAD} ${anchor.y - PRONG_RISE}`}
            stroke={joustPalette.post}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <line
            x1={anchor.x - PRONG_SPREAD}
            y1={anchor.y - PRONG_RISE}
            x2={bandTarget.x}
            y2={bandTarget.y}
            stroke={joustPalette.band}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </g>

        <Combatant
          frame={frame}
          shaftFrom={JOUST_CHAMP_BASE_INDEX}
          shaftTo={JOUST_CHAMP_HEAD_INDEX}
          ballIndices={JOUST_CHAMP_BALL_INDICES}
          fill={joustPalette.champ}
          dark={joustPalette.champDark}
          light={joustPalette.champLight}
          facing={-1}
        />
        <Combatant
          frame={frame}
          shaftFrom={0}
          shaftTo={JOUST_SHOOTER_HEAD_INDEX}
          ballIndices={JOUST_SHOOTER_BALL_INDICES}
          fill={joustPalette.shooter}
          dark={joustPalette.shooterDark}
          light={joustPalette.shooterLight}
          facing={1}
        />

        <line
          x1={anchor.x + PRONG_SPREAD}
          y1={anchor.y - PRONG_RISE}
          x2={bandTarget.x}
          y2={bandTarget.y}
          stroke={joustPalette.band}
          strokeWidth={1.3}
          strokeLinecap="round"
        />

        {impactBodyIndex !== null && <ImpactBurst frame={frame} bodyIndex={impactBodyIndex} />}
        </g>
      </svg>
    </div>
  );
};
