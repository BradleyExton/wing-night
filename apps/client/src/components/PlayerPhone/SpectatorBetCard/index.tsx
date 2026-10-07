import type { SpectatorBetPick } from "@wingnight/shared";

import * as shellStyles from "../../PortalShell/styles";
import type { PhoneBet } from "../resolvePhoneBet";
import { TvHint } from "../TvHint";
import { spectatorBetCardCopy } from "./copy";
import * as styles from "./styles";

type SpectatorBetCardProps = {
  bet: PhoneBet;
  // The team the bet is on, by name: "Side bet · Spice Girls".
  teamName: string | null;
  onPick: (pick: SpectatorBetPick) => void;
};

const SIDES: readonly { pick: SpectatorBetPick; label: string; glyph: string }[] = [
  { pick: "over", label: spectatorBetCardCopy.overLabel, glyph: spectatorBetCardCopy.overGlyph },
  { pick: "under", label: spectatorBetCardCopy.underLabel, glyph: spectatorBetCardCopy.underGlyph }
];

// A watcher's phone while another team takes its turn: the line and ONE choice, OVER or UNDER,
// changeable until play starts; then the locked bet and a pointer at the TV; then, on the turn's
// results, whether they called it. It never shows the game, a standing or anyone else's pick.
export const SpectatorBetCard = ({ bet, teamName, onPick }: SpectatorBetCardProps): JSX.Element => {
  const eyebrow = <p className={shellStyles.eyebrow}>{spectatorBetCardCopy.eyebrow(teamName)}</p>;

  if (bet.stage === "settled") {
    const isWon = bet.pick === bet.outcome;

    return (
      <section
        className={isWon ? `${shellStyles.card} ${styles.hot}` : shellStyles.card}
        data-spectator-bet="settled"
        data-spectator-bet-result={bet.outcome === "push" ? "push" : isWon ? "won" : "lost"}
      >
        {eyebrow}
        <p className={isWon ? styles.stampWon : styles.stampLost}>{spectatorBetCardCopy.stamp(bet.pick, bet.outcome)}</p>
        <h1 className={styles.title}>{spectatorBetCardCopy.settledTitle(bet.outcome)}</h1>
        <p className={shellStyles.voice}>{spectatorBetCardCopy.settledVoice(bet.turnPoints, bet.line)}</p>
      </section>
    );
  }

  if (bet.stage === "locked") {
    return (
      <>
        <section className={shellStyles.card} data-spectator-bet="locked" data-spectator-bet-pick={bet.pick ?? "none"}>
          {eyebrow}
          <h1 className={styles.title}>{spectatorBetCardCopy.lockedTitle(bet.pick)}</h1>
          <p className={shellStyles.voice}>{spectatorBetCardCopy.lockedVoice(bet.pick, bet.line)}</p>
        </section>
        <TvHint text={spectatorBetCardCopy.watchTheTv} />
      </>
    );
  }

  return (
    <>
      <section
        className={`${shellStyles.card} ${styles.hot}`}
        data-spectator-bet="open"
        data-spectator-bet-pick={bet.pick ?? "none"}
      >
        {eyebrow}
        <div className={styles.line}>
          <p className={styles.lineFigure}>{spectatorBetCardCopy.formatLine(bet.line)}</p>
          <span className={styles.lineUnit}>{spectatorBetCardCopy.lineUnit}</span>
        </div>
        <p className={shellStyles.voice}>{spectatorBetCardCopy.openVoice(bet.pick)}</p>
        <div className={styles.choices}>
          {SIDES.map((side) => {
            const isOn = bet.pick === side.pick;

            return (
              <button
                key={side.pick}
                type="button"
                className={isOn ? styles.choiceOn : styles.choice}
                aria-pressed={isOn}
                data-spectator-bet-choice={side.pick}
                onClick={(): void => {
                  onPick(side.pick);
                }}
              >
                <span className={isOn ? styles.glyphOn : styles.glyph} aria-hidden>
                  {side.glyph}
                </span>
                {side.label}
              </button>
            );
          })}
        </div>
      </section>
      <p className={styles.fine}>{spectatorBetCardCopy.fine}</p>
    </>
  );
};
