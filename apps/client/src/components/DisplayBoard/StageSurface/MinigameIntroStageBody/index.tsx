import type { MinigameType, Player, TeamTheme } from "@wingnight/shared";

import { TeamAmbient } from "../../../TeamAmbient";
import { TeamEmblem } from "../../../TeamEmblem";
import { TeamLineup } from "../../../TeamLineup";
import { TeamWordmark } from "../../../TeamWordmark";
import { minigameIntroStageCopy } from "./copy";
import * as styles from "./styles";

type MinigameIntroStageBodyProps = {
  activeTeamName: string | null;
  activeTeamGenre: string | null;
  activeTeamTheme: TeamTheme | null;
  activeTeamPlayers: Player[];
  minigameType: MinigameType | null;
};

// The team spotlight (docs/team-identity.md, "TV MINIGAME_INTRO"): the genre's
// texture behind, its crest in the eyebrow, the name as a wordmark that arrives
// on the genre's own beat, and the roster as birds in formation instead of a
// line of names — the cast is the roster on the TV (DESIGN.md §2.8). With no
// active team it renders the placeholders it always did.
export const MinigameIntroStageBody = ({
  activeTeamName,
  activeTeamGenre,
  activeTeamTheme,
  activeTeamPlayers,
  minigameType
}: MinigameIntroStageBodyProps): JSX.Element => {
  const resolvedTeamName = activeTeamName ?? minigameIntroStageCopy.fallbackTeamName;
  const resolvedMinigameLabel =
    minigameType === null
      ? minigameIntroStageCopy.fallbackMinigameLabel
      : minigameIntroStageCopy.minigameName(minigameType);
  const eyebrowClassName = [
    styles.beatBase,
    styles.beatDelay1,
    styles.eyebrow,
    activeTeamTheme?.colorVariant.tintClassName ?? ""
  ].join(" ");

  return (
    /* Stable hook for the e2e count-in capture, which has to prove this screen
       is NOT up while the room is being counted in. */
    <div className={styles.container} data-team-briefing>
      <span className={styles.ambient} aria-hidden />
      {activeTeamTheme !== null && <TeamAmbient theme={activeTeamTheme} />}
      {/* The genre rides the eyebrow rather than taking a line of its own: it is
          the label for the anthem already playing under this screen, not a
          headline. A team with no genre renders exactly what it did before. */}
      <span className={eyebrowClassName}>
        {activeTeamTheme !== null && (
          <TeamEmblem theme={activeTeamTheme} sizeClassName={styles.crest} />
        )}
        {minigameIntroStageCopy.eyebrow}
        {activeTeamGenre !== null && (
          <>
            <span className={styles.eyebrowSeparator} aria-hidden>
              {minigameIntroStageCopy.rosterSeparator}
            </span>
            <span className={styles.genre}>{activeTeamGenre}</span>
          </>
        )}
      </span>
      {activeTeamTheme !== null ? (
        <p className={styles.headlineRow}>
          <TeamWordmark
            name={resolvedTeamName}
            theme={activeTeamTheme}
            sizeClassName={
              activeTeamTheme.wordmark === "plain" ? styles.headlinePlain : styles.headline
            }
            entrance
          />
        </p>
      ) : (
        <p className={`${styles.beatBase} ${styles.beatDelay2} ${styles.teamName}`}>
          {resolvedTeamName}
        </p>
      )}
      {activeTeamTheme !== null && activeTeamPlayers.length > 0 && (
        <div className={`${styles.beatBase} ${styles.beatDelay3}`}>
          <TeamLineup
            players={activeTeamPlayers}
            theme={activeTeamTheme}
            sizeClassName={styles.lineup}
          />
        </div>
      )}
      <p className={`${styles.beatBase} ${styles.beatDelay4} ${styles.post}`}>
        <span className={styles.postLabel}>{minigameIntroStageCopy.playingLabel}</span>
        {resolvedMinigameLabel}
      </p>
    </div>
  );
};
