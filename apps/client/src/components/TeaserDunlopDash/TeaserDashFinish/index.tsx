import * as styles from "./styles";

type TeaserDashFinishProps = {
  kicker: string;
  wingsLabel: string;
  bestLabel: string | null;
  newBestLabel: string | null;
  runAgainLabel: string;
  switchTeamLabel: string;
  homeLabel: string;
  homeHref: string;
  onRunAgain: () => void;
  onSwitchTeam: () => void;
};

// The end of the relay, where on the night the host would advance the room: what the team
// banked, the best this phone has seen, and the way back onto the street.
export const TeaserDashFinish = ({
  kicker,
  wingsLabel,
  bestLabel,
  newBestLabel,
  runAgainLabel,
  switchTeamLabel,
  homeLabel,
  homeHref,
  onRunAgain,
  onSwitchTeam
}: TeaserDashFinishProps): JSX.Element => (
  <div className={styles.scrim}>
    <div className={styles.card}>
      <p className={styles.kicker}>{kicker}</p>
      <p className={styles.wings}>{wingsLabel}</p>
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
