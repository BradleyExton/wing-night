import type {
  JoustFrame,
  JoustMinigameArena,
  JoustPlayerFigure,
  JoustShooterView,
  JoustShotGhost,
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

import type { JoustStandingPin } from "../../runtime/lineup/index.js";
import type { JoustSceneLeg } from "../resolveJoustScene/index.js";
import { ArenaHen } from "./ArenaHen/index.js";
import { Backdrop } from "./Backdrop/index.js";
import { CollapseDust, ImpactBurst, ShotTrail } from "./FlightEffects/index.js";
import { GroundShadow } from "./GroundShadow/index.js";
import { Perch } from "./Perch/index.js";
import { Prop } from "./Prop/index.js";
import { Shooter } from "./Shooter/index.js";
import { ShotGhost } from "./ShotGhost/index.js";
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
  // Every tower leg with a body in the frame, so a slab is drawn where its legs actually are.
  legs: JoustSceneLeg[];
  // Towers already down before this frame's shot, drawn flat.
  rubblePerchIndices: number[];
  // Towers folding on this frame: dust.
  collapsingPerchIndices: number[];
  // The shooting team, stood behind the slingshot.
  teammates: JoustPlayerFigure[];
  // Whose shot it is: they step up to the post while the rest wait on the bench.
  activeShooterPlayerId: string | null;
  // Which shot of the turn this is and how many there are, so the bench knows who has already
  // had theirs and walks them off. Optional: a surface that does not pass them gets the bench
  // assuming one shot a head, which is right under the default rules and only misorders the
  // walk-off under `shotsPerPlayer` > 1.
  shotIndex?: number;
  shotsPerTurn?: number;
  // Draws the bands stretched to the shooter's tail rather than hanging slack.
  isAiming: boolean;
  // Pins to punch an impact burst on this frame.
  burstPinIndices: number[];
  // Where the shooter's head has just been, oldest first: the ghost of the flight so far.
  trail: JoustVec2[];
  // The previous shot's arc and pull, for the next teammate to aim off. Only drawn while aiming.
  ghost: JoustShotGhost | null;
  // The kind on the band or in the air: its proportions and inks. Null draws the Standard.
  shooter?: JoustShooterView | null;
  // The turn's loadout, so the ghost can be drawn in the ink of the kind that flew it.
  shooters?: readonly JoustShooterView[];
  serverOrigin: string | null;
  // Prefix for gradient and clip ids, so two scenes on one page do not collide.
  sceneId: string;
  label: string;
};

const PRONG_SPREAD = 5;
const PRONG_RISE = 4;

// A pull shorter than this is a finger resting on the fork, not a draw: no guide for it.
const PULL_GUIDE_THRESHOLD = 0.03;

/**
 * The shortest pull that can fold a tower. Below it a leg hit springs back at EVERY angle —
 * sweeping the aim space against the four shipped lanes put the floor at about 0.65, with zero
 * collapses under it and a wide band of them above. So this is where a standing tower's legs
 * start announcing themselves as the target they are: the shot is near-deterministic once it is
 * pointed at a leg, and the whole difficulty was never knowing there was anything to point at.
 */
const LEG_TARGET_PULL = 0.65;

export const JoustArenaScene = ({
  arena,
  frame,
  pins,
  fallen,
  legs,
  rubblePerchIndices,
  collapsingPerchIndices,
  teammates,
  activeShooterPlayerId,
  shotIndex,
  shotsPerTurn,
  isAiming,
  burstPinIndices,
  trail,
  ghost,
  shooter = null,
  shooters = [],
  serverOrigin,
  sceneId,
  label
}: JoustArenaSceneProps): JSX.Element => {
  const { anchor, floorY, width, height, pullRadius } = JOUST_WORLD;
  const ghostInk =
    ghost === null
      ? null
      : (shooters.find((kind) => kind.id === ghost.shooterId)?.color.light ?? null);
  const tail = readJoustFramePosition(frame, 0);
  const head = readJoustFramePosition(frame, JOUST_SHOOTER_HEAD_INDEX);
  const bandTarget = isAiming ? tail : anchor;
  // How far the band is drawn, as a fraction of its reach — read off the frame rather than the
  // aim, so the guide and the shooter it rings can never disagree.
  const pull = isAiming ? Math.hypot(head.x - anchor.x, head.y - anchor.y) / pullRadius : 0;
  const worldClipId = `${sceneId}-world`;
  const bursting = new Set(burstPinIndices);
  const rubble = new Set(rubblePerchIndices);
  const collapsing = new Set(collapsingPerchIndices);
  // Which way the shot is going, off the ghost of where it just was; nothing has flown at rest.
  const lastGhost = trail[trail.length - 1];
  const shooterVelocity =
    lastGhost === undefined ? null : { x: head.x - lastGhost.x, y: head.y - lastGhost.y };
  // What the bench needs to know who has shot. Without the shot count from the view, assume one
  // shot a head: the shooter's place in the roster is the shot index, and once the turn is over
  // it was the last shot that ended it.
  const shooterIndex = teammates.findIndex((figure) => figure.playerId === activeShooterPlayerId);
  const benchShotIndex =
    shotIndex ?? (activeShooterPlayerId === null ? teammates.length - 1 : Math.max(0, shooterIndex));
  const benchShotsPerTurn = shotsPerTurn ?? teammates.length;

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
            <Prop key={index} obstacle={obstacle} />
          ))}

          {arena.perches.map((perch, perchIndex) => (
            <Perch
              key={perchIndex}
              perch={perch}
              legs={legs.filter((leg) => leg.perchIndex === perchIndex)}
              isRubble={rubble.has(perchIndex)}
              isAimTarget={pull >= LEG_TARGET_PULL && !rubble.has(perchIndex)}
            />
          ))}

          <TeamBench
            teammates={teammates}
            activeShooterPlayerId={activeShooterPlayerId}
            shotIndex={benchShotIndex}
            shotsPerTurn={benchShotsPerTurn}
            bandTarget={pull > PULL_GUIDE_THRESHOLD ? tail : null}
            pull={pull}
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

          {isAiming && ghost !== null && <ShotGhost ghost={ghost} ink={ghostInk} />}

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

          <Shooter frame={frame} velocity={shooterVelocity} kind={shooter} />

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

          {arena.perches.map((perch, perchIndex) => {
            if (!collapsing.has(perchIndex)) {
              return null;
            }

            const [near, far] = legs.filter((leg) => leg.perchIndex === perchIndex);
            const from = near?.top ?? { x: perch.x, y: perch.y };
            const to = far?.top ?? { x: perch.x + perch.width, y: perch.y };

            return <CollapseDust key={perchIndex} from={from} to={to} />;
          })}
        </g>
      </svg>
    </div>
  );
};
