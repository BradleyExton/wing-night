import type { JoustPlayerFigure } from "@wingnight/shared";
import { JOUST_PIN_HEIGHT, JOUST_WORLD } from "@wingnight/shared";

import { ArenaHen } from "../ArenaHen/index.js";
import { GroundShadow } from "../GroundShadow/index.js";

export type TeamBenchProps = {
  teammates: JoustPlayerFigure[];
  // Whose hand is on the band: they stand at the slingshot rather than on the bench.
  activeShooterPlayerId: string | null;
  serverOrigin: string | null;
};

// Far enough behind the fork that the shooter at full draw never lands among them, and stopping
// short of the world's edge so the last one is whole.
const BENCH_RIGHT = JOUST_WORLD.anchor.x - 20;
const BENCH_LEFT = 4;
const BENCH_SPACING = 7;
/** Right at the post, where you would stand to pull the band. */
const AT_THE_BAND_X = JOUST_WORLD.anchor.x - 8;

/**
 * The shooting team, stood behind their own slingshot, with whoever's shot it is stepped up to the
 * post. Pure scenery — no bodies, no collisions, nothing the integrator has ever heard of — but it
 * is how the room knows whose turn it is without the TV needing a caption for it, and how it sees
 * the turn going round the table.
 */
export const TeamBench = ({
  teammates,
  activeShooterPlayerId,
  serverOrigin
}: TeamBenchProps): JSX.Element => {
  const waiting = teammates.filter((figure) => figure.playerId !== activeShooterPlayerId);
  const shooter = teammates.find((figure) => figure.playerId === activeShooterPlayerId) ?? null;
  const span = Math.min((waiting.length - 1) * BENCH_SPACING, Math.max(0, BENCH_RIGHT - BENCH_LEFT));
  const spacing = waiting.length > 1 ? span / (waiting.length - 1) : 0;
  const left = BENCH_RIGHT - span;
  // The foot BODY's centre would sit a radius above the sand; the bench has no bodies, so its feet
  // are placed on the floor line and the shadow is told so.
  const footY = JOUST_WORLD.floorY;
  const standing = [
    ...waiting.map((figure, index) => ({ figure, x: left + index * spacing })),
    ...(shooter === null ? [] : [{ figure: shooter, x: AT_THE_BAND_X }])
  ];

  return (
    <g data-joust-bench>
      {standing.map(({ figure, x }) => (
        <GroundShadow key={figure.playerId} foot={{ x, y: footY - 1.6 }} />
      ))}
      {waiting.map((figure, index) => {
        const x = left + index * spacing;

        return (
          <ArenaHen
            key={figure.playerId}
            figure={figure}
            foot={{ x, y: footY }}
            head={{ x, y: footY - JOUST_PIN_HEIGHT }}
            serverOrigin={serverOrigin}
            facing={1}
          />
        );
      })}
      {shooter !== null && (
        <g data-joust-shooter-figure>
          <ArenaHen
            figure={shooter}
            foot={{ x: AT_THE_BAND_X, y: footY }}
            head={{ x: AT_THE_BAND_X, y: footY - JOUST_PIN_HEIGHT }}
            serverOrigin={serverOrigin}
            facing={1}
          />
        </g>
      )}
    </g>
  );
};
