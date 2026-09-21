import type { SchlonicMinigameRun } from "@wingnight/shared";

import { resolveRunPlayerName } from "../../resolveRunPlayerName/index.js";
import { runHistoryCopy } from "./copy.js";
import * as styles from "./styles.js";

// One row per run of the turn: who ran it and how it ended, with the run in
// hand lit. `activeRunIndex` is the run the tablet is on.
export const RunHistory = ({
  runs,
  activeRunIndex
}: {
  runs: SchlonicMinigameRun[];
  activeRunIndex: number | null;
}): JSX.Element => (
  <div className={styles.container}>
    <span className={styles.title}>{runHistoryCopy.title}</span>
    {runs.map((run) => (
      <span
        key={run.runIndex}
        className={`${styles.entry}${
          run.runIndex === activeRunIndex ? ` ${styles.entryActive}` : ""
        }`}
        data-schlonic-history={run.runIndex}
      >
        <span>{resolveRunPlayerName(run) ?? runHistoryCopy.pending}</span>
        <span>
          {run.status === "done"
            ? runHistoryCopy.outcome(run.result?.outcome ?? null, run.result?.wings ?? 0)
            : runHistoryCopy.pending}
        </span>
      </span>
    ))}
  </div>
);
