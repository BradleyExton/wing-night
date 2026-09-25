import type { QuickPlayStartIssue } from "@wingnight/shared";

import { quickPlayLauncherCopy } from "../copy";
import * as styles from "./styles";

type StartBarProps = {
  issues: QuickPlayStartIssue[];
  gameCount: number;
  teamCount: number;
  playerCount: number;
  canStart: boolean;
  onStart: () => void;
};

// The page's one primary action, pinned to the bottom like the host shell's
// CTA. The hint above it says why Start is dark, one reason at a time.
export const StartBar = ({
  issues,
  gameCount,
  teamCount,
  playerCount,
  canStart,
  onStart
}: StartBarProps): JSX.Element => {
  const firstIssue = issues[0];

  return (
    <div className={styles.bar}>
      <p className={`${styles.hint} ${firstIssue === undefined ? "" : styles.hintBlocked}`}>
        {firstIssue === undefined
          ? quickPlayLauncherCopy.readyHint(gameCount, teamCount, playerCount)
          : quickPlayLauncherCopy.startIssueLabel(firstIssue)}
      </p>
      <button
        type="button"
        className={styles.button}
        disabled={!canStart}
        data-quick-play-start
        onClick={onStart}
      >
        {quickPlayLauncherCopy.startButtonLabel}
      </button>
    </div>
  );
};
