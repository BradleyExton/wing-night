import * as styles from "./styles";

type TeaserSoloFinishProps = {
  kicker: string;
  headline: string;
  bestLabel: string | null;
  newBestLabel: string | null;
  runAgainLabel: string;
  switchTeamLabel: string;
  homeLabel: string;
  homeHref: string;
  onRunAgain: () => void;
  onSwitchTeam: () => void;
};

// The end of a solo turn, where on the night the host would advance the room: how the team did,
// the best this phone has seen, and the way back in.
export const TeaserSoloFinish = ({
  kicker,
  headline,
  bestLabel,
  newBestLabel,
  runAgainLabel,
  switchTeamLabel,
  homeLabel,
  homeHref,
  onRunAgain,
  onSwitchTeam
}: TeaserSoloFinishProps): JSX.Element => (
  <div className={styles.scrim}>
    <div className={styles.card}>
      <p className={styles.kicker}>{kicker}</p>
      <p className={styles.headline}>{headline}</p>
      {newBestLabel !== null && <p className={styles.newBest}>{newBestLabel}</p>}
      {bestLabel !== null && <p className={styles.best}>{bestLabel}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={onRunAgain}>
          {runAgainLabel}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onSwitchTeam}>
          {switchTeamLabel}
        </button>
        <a className={styles.secondaryButton} href={homeHref}>
          {homeLabel}
        </a>
      </div>
    </div>
  </div>
);
