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

// A · Sidestage. Thrower parked on the left edge in profile, OUTSIDE the field; the throw traverses
// the full width, so the flight itself is the scene; the can is foregrounded — oversized and in
// front of the ramps — so the target reads as the thing you are aiming at rather than scenery.
const WAYPOINTS: FlightWaypoints = {
  hand: { x: 118, y: 330 },
  deflect: { x: 470, y: 360 },
  can: { x: 812, y: 402 },
  floor: { x: 700, y: 462 }
};

export const VariantSidestage = ({
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
      <rect x={0} y={0} width={960} height={540} fill="#0f172a" />
      <Floor width={960} y={474} />

      {/* The team's ramps sit low and wide across the middle of the traverse. */}
      <g transform="translate(360, 382)">
        <Ramp length={150} angleDeg={-16} />
      </g>
      <g transform="translate(560, 330)">
        <Ramp length={130} angleDeg={14} />
      </g>

      {/* Foregrounded target: large, in front, with a highlighted rim. */}
      <g transform="translate(812, 432)">
        <TrashCan scale={1.35} foregrounded />
      </g>

      <g transform="translate(118, 402)">
        <Thrower avatarSrc={avatarSrc} chewing={isEating} holding={!released} />
      </g>

      {isEating ? (
        <g transform="translate(190, 180)">
          <EatingTimer progress={position.progress} radius={54} />
        </g>
      ) : null}

      {released && !pickedUp ? (
        <g transform={`translate(${projectilePoint.x}, ${projectilePoint.y})`}>
          <ProjectileSprite kind={projectile} />
        </g>
      ) : null}

      {isMissCleanup ? (
        <g
          transform={`translate(${resolveCleanerX(position.progress, SCENE_WIDTH, WAYPOINTS.floor.x + 70)}, 402)`}
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
