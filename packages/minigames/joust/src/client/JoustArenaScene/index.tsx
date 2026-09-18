import type {
  JoustFrame,
  JoustMinigameArena,
  JoustPlayerFigure,
  JoustVec2
} from "@wingnight/shared";
import {
  JOUST_PIN_FOOT_RADIUS,
  JOUST_PIN_HEAD_RADIUS,
  JOUST_PIN_HEIGHT,
  JOUST_SHOOTER_HEAD_INDEX,
  JOUST_WORLD,
  joustPinFootIndex,
  joustPinHeadIndex,
  readJoustFramePosition
} from "@wingnight/shared";

import { Perch } from "./Perch/index.js";

import type { JoustStandingPin } from "../../runtime/lineup/index.js";
import { ArenaHen } from "./ArenaHen/index.js";
import { Backdrop } from "./Backdrop/index.js";
import { Cactus } from "./Cactus/index.js";
import { GroundShadow } from "./GroundShadow/index.js";
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
  // Where the shooter's head has just been, oldest first: the ghost of the flight so far.
  trail: JoustVec2[];
  serverOrigin: string | null;
  // Prefix for gradient and clip ids, so two scenes on one page do not collide.
  sceneId: string;
  label: string;
};

const PRONG_SPREAD = 5;
const PRONG_RISE = 4;

// A pull shorter than this is a finger resting on the fork, not a draw: no guide for it.
const PULL_GUIDE_THRESHOLD = 0.03;

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

/**
 * The flight so far, as fading ghosts of the head: brightest and biggest where it was a frame
 * ago, gone eight frames back. It is what lets the room read the arc of a shot that crossed the
 * lane in under a second, and it collapses to nothing once the shooter has stopped moving.
 */
const ShotTrail = ({ trail }: { trail: JoustVec2[] }): JSX.Element | null => {
  if (trail.length === 0) {
    return null;
  }

  return (
    <g data-joust-trail>
      {trail.map((at, index) => {
        const recency = (index + 1) / trail.length;

        return (
          <circle
            key={index}
            cx={at.x}
            cy={at.y}
            r={0.9 + recency * 1.9}
            fill={joustPalette.shooterLight}
            opacity={0.1 + recency * 0.32}
          />
        );
      })}
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
  trail,
  serverOrigin,
  sceneId,
  label
}: JoustArenaSceneProps): JSX.Element => {
  const { anchor, floorY, width, height, pullRadius } = JOUST_WORLD;
  const tail = readJoustFramePosition(frame, 0);
  const head = readJoustFramePosition(frame, JOUST_SHOOTER_HEAD_INDEX);
  const bandTarget = isAiming ? tail : anchor;
  // How far the band is drawn, as a fraction of its reach — read off the frame rather than the
  // aim, so the guide and the shooter it rings can never disagree.
  const pull = isAiming ? Math.hypot(head.x - anchor.x, head.y - anchor.y) / pullRadius : 0;
  const worldClipId = `${sceneId}-world`;
  const bursting = new Set(burstPinIndices);
  // Which way the shot is going, off the ghost of where it just was; nothing has flown at rest.
  const lastGhost = trail[trail.length - 1];
  const shooterVelocity =
    lastGhost === undefined ? null : { x: head.x - lastGhost.x, y: head.y - lastGhost.y };

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
          {/* A shot that leaves the world must not be drawn over the letterbox. */}
          <clipPath id={worldClipId}>
            <rect x={0} y={0} width={width} height={height} />
          </clipPath>
        </defs>

        <Backdrop sceneId={sceneId} />

        <g clipPath={`url(#${worldClipId})`}>
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

          {/* The band's reach, shown only while it is being drawn: the ring is full power. */}
          {pull > PULL_GUIDE_THRESHOLD && (
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={pullRadius}
              fill="none"
              stroke={joustPalette.band}
              strokeWidth={0.5}
              strokeDasharray="1.4 1.8"
              opacity={0.25 + Math.min(1, pull) * 0.45}
              data-joust-pull-guide
            />
          )}

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
            <GroundShadow
              key={pin.playerId}
              foot={readJoustFramePosition(frame, joustPinFootIndex(pinIndex))}
            />
          ))}

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

          <ShotTrail trail={trail} />

          <Shooter frame={frame} velocity={shooterVelocity} />

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
