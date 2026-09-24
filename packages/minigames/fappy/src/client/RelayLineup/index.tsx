import type { FappyMinigameLeg } from "@wingnight/shared";

import { PlayerHead } from "../PlayerHead/index.js";
import { resolveLegBird } from "../resolveLegBird/index.js";
import { relayLineupCopy } from "./copy.js";
import * as styles from "./styles.js";

// What a chip is saying. `cleared` is behind the relay, `flying` is the leg in
// hand, `next` is the tablet's next owner — the one fact nobody in the room
// could find before this strip existed — and `later` is everyone after them.
export type RelayLineupState = "cleared" | "flying" | "next" | "later";

export const resolveLineupState = (
  leg: FappyMinigameLeg,
  activeLegIndex: number | null
): RelayLineupState => {
  if (leg.status === "cleared") {
    return "cleared";
  }

  if (activeLegIndex === null) {
    return "later";
  }

  if (leg.legIndex === activeLegIndex) {
    return "flying";
  }

  return leg.legIndex === activeLegIndex + 1 ? "next" : "later";
};

const CHIP_BY_STATE: Record<RelayLineupState, string> = {
  cleared: styles.chipCleared,
  flying: styles.chipFlying,
  next: styles.chipNext,
  later: styles.chip
};

type RelayLineupProps = {
  legs: FappyMinigameLeg[];
  // The leg in hand, or null once the relay is over — then nothing is lit.
  activeLegIndex: number | null;
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
  // Which screen is holding the strip. The only difference is its size (see
  // styles.ts): the tablet's chrome row wants 40px chips, the wall wants 64px.
  surface: "tablet" | "wall";
};

// The relay in running order, one face per leg. It replaces the row of dashes
// the host used to read — "LEGS — — — —" said how many legs there were and
// nothing about who was flying them, so the only place the next player's name
// appeared was an italic hint pill nobody looked at.
//
// Each chip resolves its bird exactly the way the corridor does
// (`resolveLegBird`), so the face on a chip and the hen in the air are the
// same player's, with the same head and the same team colour, or they are both
// wrong together.
//
// The crash count keeps `data-fappy-crashes`: this strip is still the only
// place the number is said.
export const RelayLineup = ({
  legs,
  activeLegIndex,
  activeTurnTeamId,
  serverOrigin,
  surface
}: RelayLineupProps): JSX.Element => {
  return (
    <div
      className={surface === "wall" ? styles.containerWall : styles.container}
      data-fappy-lineup={surface}
    >
      <span className={styles.title}>{relayLineupCopy.title}</span>
      {legs.map((leg) => {
        const bird = resolveLegBird({ figure: leg.player, activeTurnTeamId, serverOrigin });
        const state = resolveLineupState(leg, activeLegIndex);
        const playerName = bird.playerName ?? relayLineupCopy.houseHen;

        return (
          <span
            key={leg.legIndex}
            className={`${CHIP_BY_STATE[state]} ${bird.fillClassName}`}
            data-fappy-lineup-chip={leg.legIndex}
            data-fappy-lineup-state={state}
            data-fappy-lineup-player={playerName}
            title={relayLineupCopy.chipLabel(playerName, leg.legIndex + 1)}
          >
            <span className={styles.disc}>
              <PlayerHead bird={bird} />
            </span>
            {state === "next" && <span className={styles.nextRing} />}
            {state === "cleared" && <span className={styles.tick}>{relayLineupCopy.cleared}</span>}
            {state === "next" && <span className={styles.nextTag}>{relayLineupCopy.next}</span>}
            {leg.crashes > 0 && (
              <span className={styles.crashes} data-fappy-crashes={leg.crashes}>
                {relayLineupCopy.crashes(leg.crashes)}
              </span>
            )}
            <span className={styles.name}>{relayLineupCopy.chipLabel(playerName, leg.legIndex + 1)}</span>
          </span>
        );
      })}
    </div>
  );
};
