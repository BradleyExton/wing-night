import type { Player, TeamTheme } from "@wingnight/shared";

import * as shellStyles from "../../PortalShell/styles";
import { PlayerBird } from "../PlayerBird";
import type { PhoneTurn } from "../resolvePhoneTurn";
import { TvHint } from "../TvHint";
import { contestantTurnCardCopy } from "./copy";
import * as styles from "./styles";

type ContestantTurnCardProps = {
  turn: Exclude<PhoneTurn, { role: "play" }>;
  player: Player;
  teamTheme: TeamTheme | null;
  // Whoever holds the leg in hand right now, by name, for "after Caitlin".
  contestantName: string | null;
  serverOrigin: string | null;
};

// A teammate's phone while the team is up but the leg is not theirs to play: the briefing's
// "grab your phone", "you're next", "watch the TV", or "grab the tablet" when the tablet holds
// their leg. The phone is still quiet and still points at the TV; it never shows the game.
export const ContestantTurnCard = ({
  turn,
  player,
  teamTheme,
  contestantName,
  serverOrigin
}: ContestantTurnCardProps): JSX.Element => {
  const lines = contestantTurnCardCopy.lines(turn, contestantName);
  const isHot = turn.role !== "watch";

  return (
    <>
      <section
        className={isHot ? `${shellStyles.card} ${styles.hot}` : shellStyles.card}
        data-contestant-phone={turn.role}
      >
        <p className={shellStyles.eyebrow}>{lines.eyebrow}</p>
        <div className={styles.stage}>
          <PlayerBird player={player} teamTheme={teamTheme} serverOrigin={serverOrigin} size="hero" />
        </div>
        <h1 className={styles.title}>{lines.title}</h1>
        <p className={shellStyles.voice}>{lines.voice}</p>
      </section>
      {lines.tv !== null && <TvHint text={lines.tv} />}
    </>
  );
};
