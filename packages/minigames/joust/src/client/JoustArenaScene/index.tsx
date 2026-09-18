import type { JoustFrame, JoustMinigameArena, JoustPlayerFigure } from "@wingnight/shared";
import {
  JOUST_PIN_FOOT_RADIUS,
  JOUST_PIN_HEAD_RADIUS,
  JOUST_PIN_HEIGHT,
  JOUST_WORLD,
  joustPinFootIndex,
  joustPinHeadIndex,
  readJoustFramePosition
} from "@wingnight/shared";

import { Perch } from "./Perch/index.js";

import type { JoustStandingPin } from "../../runtime/lineup/index.js";
import { ArenaHen } from "./ArenaHen/index.js";
import { Cactus } from "./Cactus/index.js";
import { Shooter } from "./Shooter/index.js";
import { TeamBench } from "./TeamBench/index.js";
import { joustPalette } from "./palette.js";
import * as styles from "./styles.js";

export type JoustArenaSceneProps = {
  arena: JoustMinigameArena;
  // Every body's centre, flat, in resolveJoustBodies order — a rest pose or a track frame.
  frame: JoustFrame;
  // The players the frame's pin bodies belong to, in frame order.
  pins: JoustStandingPin[];
  // Players felled earlier in the turn: no bodies in the track, laid out on their own columns.
  fallen: JoustStandingPin[];
  // The shooting team, stood behind the slingshot.
  teammates: JoustPlayerFigure[];
  // Whose shot it is: they step up to the post while the rest wait on the bench.
  activeShooterPlayerId: string | null;
  // Draws the bands stretched to the shooter's tail rather than hanging slack.
  isAiming: boolean;
  // Pins to punch an impact burst on this frame.
  burstPinIndices: number[];
  serverOrigin: string | null;
  // Prefix for gradient and clip ids, so two scenes on one page do not collide.
  sceneId: string;
  label: string;
};

const PRONG_SPREAD = 5;
const PRONG_RISE = 4;

const ImpactBurst = ({ at }: { at: { x: number; y: number } }): JSX.Element => {
  const points: string[] = [];
  const spikes = 8;

  // Alternating outer/inner radii around the struck body. Screen-side only, so
  // the trig here never touches the deterministic track.
  for (let index = 0; index < spikes * 2; index += 1) {
    const angle = (Math.PI * index) / spikes;
    const radius = index % 2 === 0 ? 7 : 3.2;
    points.push(`${at.x + Math.cos(angle) * radius},${at.y + Math.sin(angle) * radius}`);
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
  pins,
  fallen,
  teammates,
  activeShooterPlayerId,
  isAiming,
  burstPinIndices,
  serverOrigin,
  sceneId,
  label
}: JoustArenaSceneProps): JSX.Element => {
  const { anchor, floorY, width, height } = JOUST_WORLD;
  const tail = readJoustFramePosition(frame, 0);
  const bandTarget = isAiming ? tail : anchor;
  const skyGradientId = `${sceneId}-sky`;
  const sandGradientId = `${sceneId}-sand`;
  const worldClipId = `${sceneId}-world`;
  const bursting = new Set(burstPinIndices);

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

          {arena.perches.map((perch, index) => (
            <Perch key={index} perch={perch} />
          ))}

          <TeamBench
            teammates={teammates}
            activeShooterPlayerId={activeShooterPlayerId}
            serverOrigin={serverOrigin}
          />

          {fallen.map((pin) => (
            <ArenaHen
              key={pin.playerId}
              figure={pin}
              foot={{ x: pin.x, y: pin.y }}
              head={{ x: pin.x + JOUST_PIN_HEIGHT, y: pin.y + JOUST_PIN_FOOT_RADIUS - JOUST_PIN_HEAD_RADIUS }}
              serverOrigin={serverOrigin}
              facing={-1}
              isDown
            />
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

          {pins.map((pin, pinIndex) => (
            <ArenaHen
              key={pin.playerId}
              figure={pin}
              foot={readJoustFramePosition(frame, joustPinFootIndex(pinIndex))}
              head={readJoustFramePosition(frame, joustPinHeadIndex(pinIndex))}
              serverOrigin={serverOrigin}
              facing={-1}
            />
          ))}

          <Shooter frame={frame} />

          <line
            x1={anchor.x + PRONG_SPREAD}
            y1={anchor.y - PRONG_RISE}
            x2={bandTarget.x}
            y2={bandTarget.y}
            stroke={joustPalette.band}
            strokeWidth={1.3}
            strokeLinecap="round"
          />

          {pins.map((pin, pinIndex) =>
            bursting.has(pinIndex) ? (
              <ImpactBurst
                key={pin.playerId}
                at={readJoustFramePosition(frame, joustPinHeadIndex(pinIndex))}
              />
            ) : null
          )}
        </g>
      </svg>
    </div>
  );
};
