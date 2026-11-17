import { Character } from "@wingnight/cast";

import type { HenFigure } from "../resolveHenFigure/index.js";
import { crewHeadCopy } from "./copy.js";
import * as styles from "./styles.js";

/** The first letters of a name, as a chip wears them: "Steve B" is SB. Two at most. */
export const resolveInitials = (playerName: string): string => {
  return playerName
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
};

/**
 * A crew player as a face, sized by whoever holds it: the generated head the cast resolved for
 * her bird, her initials in the team's colour when the pack has no head for her, or the house
 * hen when nobody is behind her. It takes the SAME figure the street draws her hen from
 * (`resolveHenFigure`), so a chip and the bird on the street can never disagree about who she is.
 */
export const CrewHead = ({ figure }: { figure: HenFigure }): JSX.Element => {
  const avatarSrc = figure.appearance.avatarSrc;

  if (avatarSrc !== undefined && figure.playerName !== null) {
    return <img className={styles.photo} src={avatarSrc} alt={crewHeadCopy.headAlt(figure.playerName)} data-brawl-head="photo" />;
  }

  if (figure.playerName !== null) {
    return (
      <svg className={`${styles.initials} ${figure.fillClassName}`} viewBox="0 0 40 40" data-brawl-head="initials" aria-hidden="true">
        <text className={styles.initialsText} x={20} y={20}>
          {resolveInitials(figure.playerName)}
        </text>
      </svg>
    );
  }

  return (
    <span className={`${styles.hen} ${figure.fillClassName}`} data-brawl-head="hen" title={crewHeadCopy.houseHenLabel}>
      <Character appearance={figure.appearance} apparel={figure.apparel} silhouette={figure.silhouette} fillClassName={figure.fillClassName} pose="still" />
    </span>
  );
};
