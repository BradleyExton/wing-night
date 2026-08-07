import { useMemo, useState } from "react";

import { LabControls, type LabSettings } from "./LabControls";
import { RunCanvas } from "./RunCanvas";
import { contraptionLabCopy } from "./copy";
import { attemptsDiffer, bestAttempt, buildLabAttempts, type LabAttempt } from "./labRun";
import { DEFAULT_PIECE_SET_ID, resolvePieceSet } from "./pieceSets";
import * as styles from "./styles";

/** WN-15's watchable target. The telemetry calls out a settle time that overruns it. */
const WATCHABLE_TARGET_SECONDS = 4;

const DEFAULT_SETTINGS: LabSettings = {
  pieceSetId: DEFAULT_PIECE_SET_ID,
  aids: "trail",
  attempts: 1,
  variation: "rebuild",
  seed: 20260807,
  durationSeconds: 4,
  keyframeHz: 30,
  playbackRate: 1
};

const outcomeBannerStyle = (attempt: LabAttempt | undefined): string => {
  if (attempt?.outcome == null) {
    return styles.outcomeBannerUngraded;
  }

  return attempt.outcome.landed ? styles.outcomeBannerLanded : styles.outcomeBannerMissed;
};

const outcomeBannerText = (attempt: LabAttempt | undefined): string => {
  if (attempt?.outcome == null) {
    return contraptionLabCopy.ungradeableNote;
  }

  return contraptionLabCopy.reasonLabel[attempt.outcome.reason];
};

const formatSettle = (attempt: LabAttempt | undefined): string => {
  const settleSeconds = attempt?.outcome?.settleSeconds;

  if (settleSeconds == null) {
    return contraptionLabCopy.neverSettledNote;
  }

  const overTarget =
    settleSeconds > WATCHABLE_TARGET_SECONDS ? ` — ${contraptionLabCopy.overTargetNote}` : "";

  return `${settleSeconds.toFixed(2)}s${overTarget}`;
};

export const ContraptionLab = (): JSX.Element => {
  const [settings, setSettings] = useState<LabSettings>(DEFAULT_SETTINGS);
  const [replayKey, setReplayKey] = useState(0);
  const [requestedAttempt, setRequestedAttempt] = useState(0);
  const attempts = useMemo(() => buildLabAttempts(settings), [settings]);
  const pieceSet = resolvePieceSet(settings.pieceSetId);
  const selectedIndex = Math.min(requestedAttempt, attempts.length - 1);
  const selected = attempts[selectedIndex];
  const best = bestAttempt(attempts);
  const differ = attemptsDiffer(attempts);

  return (
    <main className={styles.container}>
      <div className={styles.headingBlock}>
        <h1 className={styles.heading}>{contraptionLabCopy.title}</h1>
        <p className={styles.description}>{contraptionLabCopy.description}</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.stageColumn}>
          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <span className={styles.cardHeaderLabel}>{contraptionLabCopy.stageLabel}</span>
              <span className={styles.cardHeaderMeta}>
                {pieceSet.label} · {selected?.label ?? ""}
              </span>
            </header>

            <div className={`${styles.outcomeBanner} ${outcomeBannerStyle(selected)}`}>
              <span>{outcomeBannerText(selected)}</span>
              <span className={styles.attemptChipMeta}>{formatSettle(selected)}</span>
            </div>

            <div className={styles.stageViewport}>
              {selected === undefined ? null : (
                <RunCanvas
                  layout={selected.layout}
                  run={selected.run}
                  aids={settings.aids}
                  playbackRate={settings.playbackRate}
                  replayKey={replayKey}
                />
              )}
            </div>

            <div className={styles.attemptStrip}>
              {attempts.map((attempt) => (
                <button
                  key={attempt.index}
                  type="button"
                  aria-pressed={attempt.index === selectedIndex}
                  className={`${styles.attemptChip} ${
                    attempt.index === best?.index ? styles.attemptChipBest : ""
                  }`}
                  onClick={(): void => {
                    setRequestedAttempt(attempt.index);
                    setReplayKey((previous) => previous + 1);
                  }}
                >
                  <span className={styles.attemptChipLabel}>
                    {attempt.label}
                    {attempt.index === best?.index && attempts.length > 1
                      ? ` · ${contraptionLabCopy.bestAttemptLabel}`
                      : ""}
                  </span>
                  <span className={styles.attemptChipMeta}>
                    {attempt.outcome?.reason ?? "ungraded"}
                  </span>
                </button>
              ))}
            </div>

            {attempts.length > 1 ? (
              <p className={differ ? styles.varianceNote : styles.varianceNoteWarning}>
                {differ
                  ? contraptionLabCopy.divergentRunsNote
                  : contraptionLabCopy.identicalRunsWarning}
              </p>
            ) : null}
          </section>

          <section className={styles.controlsCard}>
            <span className={styles.cardHeaderLabel}>{contraptionLabCopy.telemetryLabel}</span>
            <div className={styles.telemetryGrid}>
              <span className={styles.telemetryKey}>{contraptionLabCopy.outcomeLabel}</span>
              <span>{selected?.outcome?.reason ?? "—"}</span>
              <span className={styles.telemetryKey}>{contraptionLabCopy.settleLabel}</span>
              <span>{formatSettle(selected)}</span>
              <span className={styles.telemetryKey}>{contraptionLabCopy.missLabel}</span>
              <span>{selected?.outcome?.missX.toFixed(2) ?? "—"}</span>
              <span className={styles.telemetryKey}>{contraptionLabCopy.keyframeCountLabel}</span>
              <span>{selected?.bytes.keyframeCount ?? "—"}</span>
              <span className={styles.telemetryKey}>{contraptionLabCopy.trackBytesLabel}</span>
              <span>{selected?.bytes.jsonFlatRoundedBytes ?? "—"}</span>
            </div>
          </section>
        </div>

        <aside className={styles.controlsCard}>
          <span className={styles.cardHeaderLabel}>{contraptionLabCopy.controlsLabel}</span>
          <LabControls
            settings={settings}
            onSettingsChange={(next): void => {
              setSettings(next);
              setReplayKey((previous) => previous + 1);
            }}
            onReroll={(): void => {
              setSettings((previous) => ({ ...previous, seed: previous.seed + 1 }));
              setReplayKey((previous) => previous + 1);
            }}
            onReplay={(): void => {
              setReplayKey((previous) => previous + 1);
            }}
          />
        </aside>
      </div>
    </main>
  );
};
