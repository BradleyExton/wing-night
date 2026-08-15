import {
  Cleaner,
  EatingTimer,
  Floor,
  ProjectileSprite,
  Ramp,
  Thrower,
  TrashCan,
  type VariantSceneProps
} from "../scene";
import { hasPickedUp, isStooping, resolveCleanerX } from "../scene/cleanerWalk";
import { type FlightWaypoints, hasReleased, resolveProjectilePoint } from "../scene/flightPath";

const SCENE_WIDTH = 960;

// B · Arena. Camera pulled back: the thrower is small and sits at the bottom-centre INSIDE the
// field, the contraption arena fills most of the frame, and the throw is a short arc across a large
// space — so the field, not the flight, is what you read. The can is embedded: same scale as the
// ramps, one object among many, which makes finding it part of the challenge.
const WAYPOINTS: FlightWaypoints = {
  hand: { x: 470, y: 452 },
  deflect: { x: 604, y: 300 },
  can: { x: 726, y: 250 },
  floor: { x: 690, y: 470 }
};

export const VariantArena = ({
  position,
  outcome,
  projectile,
  avatarSrc
}: VariantSceneProps): JSX.Element => {
  const projectilePoint = resolveProjectilePoint(
    position.beat.id,
    position.progress,
    outcome,
    WAYPOINTS
  );
  const released = hasReleased(position.beat.id);
  const isEating = position.beat.id === "eating";
  const isMissCleanup = position.beat.id === "cleanup" && outcome === "missed";
  const pickedUp = isMissCleanup && hasPickedUp(position.progress);

  return (
    <svg viewBox="0 0 960 540" className="block h-full w-full" role="img">
      <rect x={0} y={0} width={960} height={540} fill="#0b1220" />
      <Floor width={960} y={502} />

      {/* A deep arena of ramps at several heights — the field is the subject here. */}
      <g transform="translate(214, 400)">
        <Ramp length={130} angleDeg={-22} />
      </g>
      <g transform="translate(392, 336)">
        <Ramp length={150} angleDeg={-12} />
      </g>
      <g transform="translate(560, 288)">
        <Ramp length={120} angleDeg={18} />
      </g>
      <g transform="translate(740, 360)">
        <Ramp length={140} angleDeg={-8} />
      </g>
      <g transform="translate(300, 250)">
        <Ramp length={110} angleDeg={10} />
      </g>

      {/* Embedded target: unhighlighted and at ramp scale, so it sits within the field. */}
      <g transform="translate(726, 288)">
        <TrashCan scale={0.78} />
      </g>

      {/* Small thrower, inside the field, bottom-centre. */}
      <g transform="translate(470, 470) scale(0.62)">
        <Thrower avatarSrc={avatarSrc} chewing={isEating} holding={!released} />
      </g>

      {isEating ? (
        <g transform="translate(480, 176)">
          <EatingTimer progress={position.progress} radius={68} />
        </g>
      ) : null}

      {released && !pickedUp ? (
        <g transform={`translate(${projectilePoint.x}, ${projectilePoint.y})`}>
          <ProjectileSprite kind={projectile} scale={0.85} />
        </g>
      ) : null}

      {isMissCleanup ? (
        <g
          transform={`translate(${resolveCleanerX(position.progress, SCENE_WIDTH, WAYPOINTS.floor.x + 60)}, 452) scale(0.62)`}
        >
          <Cleaner
            stooping={isStooping(position.progress)}
            carrying={hasPickedUp(position.progress)}
          />
        </g>
      ) : null}
    </svg>
  );
};
