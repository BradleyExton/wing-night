import type { JoustPlayerFigure, JoustVec2 } from "@wingnight/shared";
import { JOUST_PIN_HEIGHT, JOUST_WORLD } from "@wingnight/shared";
import { resolveCharacterGrooveClassName } from "@wingnight/cast";

import { resolveBenchOrder } from "../../../runtime/lineup/index.js";
import { useBenchWalk } from "../../useBenchWalk/index.js";
import { ArenaHen } from "../ArenaHen/index.js";
import { GroundShadow } from "../GroundShadow/index.js";

export type TeamBenchProps = {
  teammates: JoustPlayerFigure[];
  // Whose hand is on the band: they stand at the slingshot rather than in the line. Null once
  // the turn is over, when the last of them walks off like the others.
  activeShooterPlayerId: string | null;
  // Which shot of the turn this is and how many there are: what says who has already had theirs.
  shotIndex: number;
  shotsPerTurn: number;
  // Where the band is held while it is being drawn, or null while it hangs slack: the shooter
  // reaches for it and leans back with the pull.
  bandTarget: JoustVec2 | null;
  // How far the band is drawn, 0..1 of its reach.
  pull: number;
  serverOrigin: string | null;
};

// The line stands well behind the fork, so the shooter at full draw never lands among them, and
// stops short of the world's edge so the last one is whole.
const BENCH_RIGHT = JOUST_WORLD.anchor.x - 20;
const BENCH_LEFT = 3;
const BENCH_SPACING = 7;
/** Right at the post, where you would stand to pull the band. */
const AT_THE_BAND_X = JOUST_WORLD.anchor.x - 8;
/**
 * The line is two ranks deep. Seventeen units of sand behind the post is room for three birds
 * shoulder to shoulder; a five-player team stood in one rank there was a pile of heads, and the
 * room could not see whose turn was next. Every second spot steps back a rank: a little higher
 * up the beach, a little smaller, a little dimmer, and drawn behind the rank in front.
 */
const BACK_RANK_SCALE = 0.82;
const BACK_RANK_RISE = 3.2;
const BACK_RANK_OPACITY = 0.85;

/** Which rank a bench spot stands in (0 front, 1 back) and how far down the line it is. */
const resolveBenchRank = (slot: number): { rank: 0 | 1; column: number } => {
  return { rank: (slot - 1) % 2 === 0 ? 0 : 1, column: Math.floor((slot - 1) / 2) };
};

/** How far the shooter leans back at a full pull, in radians: about fifteen degrees. */
const MAX_LEAN_RAD = (15 * Math.PI) / 180;

/**
 * The shooting team, stood behind their own slingshot in the order they will shoot: whoever is
 * up walks to the post, the next in line stands nearest it, and anyone who has had their go walks
 * off to the far end and turns their back on the lane. Pure scenery — no bodies, no collisions,
 * nothing the integrator has ever heard of, and nothing that crosses the wire: the walk is the
 * client's own beat — but it is how the room knows whose turn it is without the TV needing a
 * caption for it, and how it sees the turn going round the table.
 */
export const TeamBench = ({
  teammates,
  activeShooterPlayerId,
  shotIndex,
  shotsPerTurn,
  bandTarget,
  pull,
  serverOrigin
}: TeamBenchProps): JSX.Element => {
  const places = resolveBenchOrder({ teammates, activeShooterPlayerId, shotIndex, shotsPerTurn });
  // One spot per teammate down the line, so the far end is only ever reached by walking off.
  // Two ranks share the line, the back rank half a spot behind the front, so the columns are
  // half as many as the spots.
  const columns = Math.max(1, Math.ceil((teammates.length - 1) / 2));
  const spacing = Math.min(BENCH_SPACING, (BENCH_RIGHT - BENCH_LEFT) / Math.max(1, columns - 0.5));
  const slotX = (slot: number): number => {
    if (slot === 0) {
      return AT_THE_BAND_X;
    }

    const { rank, column } = resolveBenchRank(slot);

    return BENCH_RIGHT - column * spacing - rank * (spacing / 2);
  };
  const walk = useBenchWalk(
    places.map((place) => ({ id: place.figure.playerId, x: slotX(place.slot) }))
  );
  // The foot BODY's centre would sit a radius above the sand; the bench has no bodies, so its feet
  // are placed on the floor line and the shadow is told so.
  const footY = JOUST_WORLD.floorY;
  const standing = places.map((place) => {
    const position = walk.get(place.figure.playerId);
    const x = position?.x ?? slotX(place.slot);
    const isWalking = position?.isWalking ?? false;
    const isAtThePost = place.slot === 0 && !isWalking;
    const rank = place.slot === 0 ? 0 : resolveBenchRank(place.slot).rank;
    // Parked at the post with the band in hand: lean back with the pull.
    const lean = isAtThePost && bandTarget !== null ? Math.min(1, Math.max(0, pull)) * MAX_LEAN_RAD : 0;
    const facing: 1 | -1 = isWalking ? (position?.direction ?? 1) : place.isDone ? -1 : 1;

    // The back rank stands a little up the beach; its feet are on the same sand, just further off.
    const rankFootY = footY - rank * BACK_RANK_RISE;

    return {
      place,
      x,
      rank,
      footY: rankFootY,
      isWalking,
      facing,
      wingAimAt: isAtThePost ? bandTarget : null,
      head: {
        x: x - Math.sin(lean) * JOUST_PIN_HEIGHT,
        y: rankFootY - Math.cos(lean) * JOUST_PIN_HEIGHT
      }
    };
  });
  // Back rank first, so the front rank is drawn over it.
  const drawOrder = [...standing].sort((left, right) => right.rank - left.rank);

  return (
    <g data-joust-bench>
      {drawOrder.map(({ place, x, footY: rankFootY }) => (
        <GroundShadow key={place.figure.playerId} foot={{ x, y: rankFootY - 1.6 }} />
      ))}
      {drawOrder.map(({ place, x, rank, footY: rankFootY, isWalking, facing, wingAimAt, head }) => (
        // The groove scatters the strides, so a line stepping up together does not march. The
        // slot and the walk are published for the harness, which reads them rather than the
        // transform (the SCHLONIC convention). A back-rank bird is scaled about its own feet.
        <g
          key={place.figure.playerId}
          className={resolveCharacterGrooveClassName(place.figure.name)}
          transform={
            rank === 1
              ? `translate(${x} ${rankFootY}) scale(${BACK_RANK_SCALE}) translate(${-x} ${-rankFootY})`
              : undefined
          }
          opacity={rank === 1 ? BACK_RANK_OPACITY : undefined}
          data-joust-bench-slot={place.slot}
          data-joust-bench-rank={rank}
          data-joust-walking={isWalking ? "true" : "false"}
          data-joust-facing={facing}
          data-joust-shooter-figure={place.slot === 0 ? true : undefined}
        >
          <ArenaHen
            figure={place.figure}
            foot={{ x, y: rankFootY }}
            head={head}
            serverOrigin={serverOrigin}
            facing={facing}
            pose={isWalking ? "walk" : "still"}
            wingAimAt={wingAimAt}
          />
        </g>
      ))}
    </g>
  );
};
