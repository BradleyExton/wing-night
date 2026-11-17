import { CrewHead } from "../../CrewHead/index.js";
import { resolveCrewSlotColour } from "../../CrewScene/palette.js";
import type { HenFigure } from "../../resolveHenFigure/index.js";
import { crewStripCopy } from "./copy.js";
import * as styles from "./styles.js";

/** One hen as the strip shows her: who, how many hearts, and whether she is up. */
export type CrewStripHen = {
  slot: number;
  figure: HenFigure;
  hearts: number;
  state: "up" | "down" | "away";
  /** Whether the wave's clean bonus is still hers to lose: lit while she has not been hit in it. */
  clean: boolean;
};

type CrewStripProps = {
  hens: readonly CrewStripHen[];
  /** How many hearts a hen can have: the glyphs drawn for each. */
  heartsMax: number;
};

/**
 * The crew, in the sign (docs/minigames/brawl-crew-spec.md §0.7): each hen's head in a ring of
 * her slot's colour — the colour of her ring on the street and of her own phone — with her hearts
 * under it and the star she keeps while the wave has not touched her. A downed hen is greyed and
 * says so; one who sat out is dimmed. A player who never stepped out has no hen and is not here.
 * The frame while playing (principles §11): five people can each find their own bird from it.
 */
export const CrewStrip = ({ hens, heartsMax }: CrewStripProps): JSX.Element => (
  <span className={styles.strip} data-brawl-crew-strip={hens.length}>
    {hens.map((hen) => (
      <span key={hen.slot} className={styles.chip} data-brawl-crew-chip={hen.slot} data-state={hen.state} data-hearts={hen.hearts}>
        <span className={styles.face}>
          <span className={styles.head}>
            <CrewHead figure={hen.figure} />
          </span>
          <svg className={styles.ring} viewBox="0 0 40 40" aria-hidden="true">
            <circle cx={20} cy={20} r={18.4} fill="none" stroke={resolveCrewSlotColour(hen.slot)} strokeWidth={3.2} />
          </svg>
          <span className={styles.star} data-clean={hen.clean && hen.state === "up" ? "true" : "false"} aria-hidden="true">
            {crewStripCopy.star}
          </span>
        </span>
        <span className={styles.name}>{hen.state === "down" ? crewStripCopy.down : hen.state === "away" ? crewStripCopy.away : crewStripCopy.name(hen.figure.playerName, hen.slot)}</span>
        <span className={styles.hearts} aria-label={crewStripCopy.heartsLabel(hen.hearts)}>
          {Array.from({ length: heartsMax }, (_unused, heart) => (
            <span key={heart} className={styles.heart} data-lit={heart < hen.hearts ? "true" : "false"} aria-hidden="true">
              {crewStripCopy.heart}
            </span>
          ))}
        </span>
      </span>
    ))}
  </span>
);
