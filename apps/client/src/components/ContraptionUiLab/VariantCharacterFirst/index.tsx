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
import { type FlightWaypoints, hasReleased, resolveProjectilePoint } from "../scene/flightPath";

// C · Character-first. The eat is the hero: the thrower fills a large foreground panel on the left,
// and the contraption is demoted to a narrow backdrop strip along the top-right. The throw occupies
// a small share of the scene — it reads as an exit from the character's panel rather than as the
// event. The can is embedded at the far end of the strip, small and unhighlighted.
const WAYPOINTS: FlightWaypoints = {
  hand: { x: 356, y: 224 },
  deflect: { x: 610, y: 184 },
  can: { x: 852, y: 202 },
  floor: { x: 792, y: 270 }
};

export const VariantCharacterFirst = ({
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
  const isCleanup = position.beat.id === "cleanup";

  return (
    <svg viewBox="0 0 960 540" className="block h-full w-full" role="img">
      <rect x={0} y={0} width={960} height={540} fill="#111827" />

      {/* The character's foreground panel — the dominant surface. */}
      <rect x={0} y={0} width={330} height={540} fill="#1f2937" />
      <rect x={326} y={0} width={4} height={540} fill="#374151" />

      {/* The contraption, demoted to a backdrop strip. */}
      <rect x={330} y={110} width={630} height={180} fill="#0b1220" />
      <Floor width={960} y={282} />

      <g transform="translate(560, 242)">
        <Ramp length={96} angleDeg={-18} />
      </g>
      <g transform="translate(700, 210)">
        <Ramp length={84} angleDeg={12} />
      </g>

      {/* Embedded, small, at the far end of the strip. */}
      <g transform="translate(852, 248)">
        <TrashCan scale={0.55} />
      </g>

      {/* Large foreground thrower — the eat is the hero beat. */}
      <g transform="translate(180, 350) scale(2.1)">
        <Thrower avatarSrc={avatarSrc} chewing={isEating} holding={!released} />
      </g>

      {isEating ? (
        <g transform="translate(180, 110)">
          <EatingTimer progress={position.progress} radius={62} />
        </g>
      ) : null}

      {released ? (
        <g transform={`translate(${projectilePoint.x}, ${projectilePoint.y})`}>
          <ProjectileSprite kind={projectile} scale={0.66} />
        </g>
      ) : null}

      {isCleanup && outcome === "missed" ? (
        <g
          transform={`translate(${960 - (960 - WAYPOINTS.floor.x - 44) * Math.min(1, position.progress / 0.45)}, 248) scale(0.5)`}
        >
          <Cleaner progress={position.progress} />
        </g>
      ) : null}
    </svg>
  );
};
