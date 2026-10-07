import { useState } from "react";
import type { Player, Team, TeamTheme } from "@wingnight/shared";

import * as shellStyles from "../../PortalShell/styles";
import { PlayerBird } from "../PlayerBird";
import { TvHint } from "../TvHint";
import { playerIdleCardCopy } from "./copy";
import * as styles from "./styles";

type PlayerIdleCardProps = {
  player: Player;
  team: Team | null;
  teamTheme: TeamTheme | null;
  serverOrigin: string | null;
  onRelease: () => void;
};

// The phone between turns — which, this milestone, is always. It says who you
// are and sends your eyes to the TV; the TV is the room's view and its only
// speaker, so nothing here plays, counts down or asks for a tap. Letting go
// of the face takes a second tap: a phone in a pocket should not free it.
export const PlayerIdleCard = ({
  player,
  team,
  teamTheme,
  serverOrigin,
  onRelease
}: PlayerIdleCardProps): JSX.Element => {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <>
      <section className={shellStyles.card} data-player-idle={player.id}>
        <p className={shellStyles.eyebrow}>{playerIdleCardCopy.eyebrow}</p>
        <div className={styles.hero}>
          <div className={styles.stage}>
            <PlayerBird player={player} teamTheme={teamTheme} serverOrigin={serverOrigin} size="hero" />
          </div>
          <div className={styles.identity}>
            <p className={styles.name}>{player.name}</p>
            {team === null || teamTheme === null ? (
              <span className={styles.noTeam}>{playerIdleCardCopy.noTeam}</span>
            ) : (
              <span className={styles.team}>
                <span
                  className={`${styles.teamDot} ${teamTheme.colorVariant.dotAccentClassName}`}
                  aria-hidden
                />
                {team.name}
              </span>
            )}
          </div>
        </div>
      </section>
      <TvHint text={playerIdleCardCopy.watchTheTv} />
      <div className={styles.actions} data-player-release-confirm={isConfirming}>
        {isConfirming ? (
          <>
            <p className={styles.confirmQuestion}>{playerIdleCardCopy.confirmQuestion(player.name)}</p>
            <div className={shellStyles.buttonRow}>
              <button
                type="button"
                className={shellStyles.buttonGhost}
                onClick={(): void => {
                  setIsConfirming(false);
                }}
              >
                {playerIdleCardCopy.keepFace}
              </button>
              <button type="button" className={shellStyles.buttonPrimary} onClick={onRelease}>
                {playerIdleCardCopy.confirmRelease}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className={shellStyles.buttonGhost}
            onClick={(): void => {
              setIsConfirming(true);
            }}
          >
            {playerIdleCardCopy.notMe}
          </button>
        )}
      </div>
    </>
  );
};
