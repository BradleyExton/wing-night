import { Character } from "@wingnight/cast";

import type { LegBird } from "../resolveLegBird/index.js";
import { playerHeadCopy } from "./copy.js";
import * as styles from "./styles.js";

// The first letters of a name, as a lineup chip wears them: "Steve B" is SB,
// "Alex" is A. Two at most — a third is unreadable at 40px.
export const resolvePlayerInitials = (playerName: string): string => {
  return playerName
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();
};

// A leg's player as a face: the generated head the cast resolved for their
// bird, their initials in the team's colour when the pack has no head for
// them, or the house hen when the leg names nobody at all.
//
// It takes the SAME `LegBird` the corridor draws the bird from, so a chip and
// the hen in the air can never disagree about who is flying. The pack-relative
// `avatarSrc` was already addressed against the server origin inside
// `resolveLegBird` (via `resolvePlayerAppearance`), which is the one place
// that resolution happens — this file never touches the origin.
export const PlayerHead = ({ bird }: { bird: LegBird }): JSX.Element => {
  const avatarSrc = bird.appearance.avatarSrc;

  if (avatarSrc !== undefined && bird.playerName !== null) {
    return (
      <img
        className={styles.photo}
        src={avatarSrc}
        alt={playerHeadCopy.headAlt(bird.playerName)}
        data-fappy-head="photo"
      />
    );
  }

  if (bird.playerName !== null) {
    return (
      <svg
        className={`${styles.initials} ${bird.fillClassName}`}
        viewBox="0 0 40 40"
        data-fappy-head="initials"
        aria-hidden="true"
      >
        <text className={styles.initialsText} x={20} y={20}>
          {resolvePlayerInitials(bird.playerName)}
        </text>
      </svg>
    );
  }

  return (
    <span
      className={`${styles.hen} ${bird.fillClassName}`}
      data-fappy-head="hen"
      title={playerHeadCopy.houseHenLabel}
    >
      <Character
        appearance={bird.appearance}
        apparel={bird.apparel}
        silhouette={bird.silhouette}
        fillClassName={bird.fillClassName}
        pose="still"
      />
    </span>
  );
};
