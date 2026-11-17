import type { BrawlPlayerFigure } from "@wingnight/shared";

import { resolveCrewSlotColour } from "../../CrewScene/palette.js";
import { readyBeatCopy } from "./copy.js";
import * as styles from "./styles.js";

type ReadyBeatProps = {
  /** The team's players, in roster order. */
  roster: readonly BrawlPlayerFigure[];
  /** The slot of each player who has stepped out, by player id. */
  slotByPlayerId: Readonly<Record<string, number>>;
  /** Whether this turn is on phones at all: a tablet's turn has nobody to wait for. */
  onPhones: boolean;
  /** Whose block it is on the tablet: the next player in roster order. */
  tabletPlayerName: string | null;
  /** The first block is the host's to start; a later one is the first thumb's. */
  isFirstBlock: boolean;
};

/**
 * The ready beat (docs/minigames/brawl-crew-spec.md §0.3, §0.7): the room watches the team
 * assemble. Each hen that steps out walks onto the street below; this plate over the sky says
 * who is out — in her slot's colour, the colour her ring and her phone already are — and names
 * the players who are not, and nothing else moves until Start. Stepping out is the commit, in
 * public, one player at a time (principles §2).
 */
export const ReadyBeat = ({ roster, slotByPlayerId, onPhones, tabletPlayerName, isFirstBlock }: ReadyBeatProps): JSX.Element => {
  const out = roster.filter((figure) => slotByPlayerId[figure.playerId] !== undefined).length;

  if (!onPhones) {
    return (
      <div className={styles.plate} data-brawl-ready="tablet">
        <span className={styles.lead}>{readyBeatCopy.tabletLead}</span>
        <p className={styles.line}>{readyBeatCopy.tabletLine(tabletPlayerName)}</p>
      </div>
    );
  }

  return (
    <div className={styles.plate} data-brawl-ready="phones" data-brawl-ready-out={out}>
      <span className={styles.lead}>{readyBeatCopy.lead(out, roster.length)}</span>
      <ul className={styles.names}>
        {roster.map((figure) => {
          const slot = slotByPlayerId[figure.playerId];

          return (
            <li key={figure.playerId} className={styles.name} data-brawl-ready-player={figure.playerId} data-out={slot === undefined ? "false" : "true"}>
              <svg className={styles.dot} viewBox="0 0 10 10" aria-hidden="true">
                <circle cx={5} cy={5} r={3.6} fill={slot === undefined ? "none" : resolveCrewSlotColour(slot)} stroke={resolveCrewSlotColour(slot ?? null)} strokeWidth={1.4} />
              </svg>
              {figure.name}
            </li>
          );
        })}
      </ul>
      <span className={styles.hint}>{readyBeatCopy.hint(out, roster.length, isFirstBlock)}</span>
    </div>
  );
};
