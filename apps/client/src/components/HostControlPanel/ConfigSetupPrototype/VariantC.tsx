// PROTOTYPE (throwaway) — Variant C: "pre-flight wizard". Full-takeover,
// step-by-step: Identity → Lineup → Clocks & Scoring → Roster → Review, with
// one big Apply at the end. Mental model: a checklist you run once before
// doors open — feels like a standalone /admin surface.
import { useState } from "react";
import { MINIGAME_DEFINITIONS, MINIGAME_TYPES } from "@wingnight/shared";

import type { ConfigDraftApi } from "./useConfigDraft";
import * as styles from "./styles";

const STEPS = ["Identity", "Lineup", "Clocks & Scoring", "Roster", "Review"] as const;

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const VariantC = (props: {
  configDraft: ConfigDraftApi;
  isLocked: boolean;
}): JSX.Element => {
  const { configDraft, isLocked } = props;
  const { draft } = configDraft;
  const [stepIndex, setStepIndex] = useState(0);
  const [nextPlayerName, setNextPlayerName] = useState("");
  const [nextTeamName, setNextTeamName] = useState("");
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <div className={styles.cRoot}>
      <div className={styles.cInner}>
        <div>
          <p className={styles.stageEyebrow}>Pre-flight</p>
          <h1 className={`${styles.stageHeadline} !text-[clamp(2.2rem,4vw,3.4rem)]`}>
            {STEPS[stepIndex]}
          </h1>
        </div>

        <nav className={styles.cStepRail} aria-label="Setup steps">
          {STEPS.map((step, index) => (
            <button
              key={step}
              type="button"
              className={`${styles.cStepChip} ${
                index === stepIndex
                  ? styles.cStepChipActive
                  : index < stepIndex
                    ? styles.cStepChipDone
                    : ""
              }`}
              onClick={(): void => {
                setStepIndex(index);
              }}
            >
              <span className={styles.cStepIndex}>{index + 1}</span> {step}
            </button>
          ))}
        </nav>

        {isLocked && <p className={styles.lockBanner}>Config locked — night in progress</p>}

        <div className={styles.cStepBody}>
          {stepIndex === 0 && (
            <div className={styles.cFieldGrid}>
              <div className="col-span-full flex flex-col gap-1.5">
                <label className={styles.fieldLabel} htmlFor="cfg-c-name">
                  Pack name
                </label>
                <input
                  id="cfg-c-name"
                  className={styles.inputBase}
                  value={draft.gameConfig.name}
                  disabled={isLocked}
                  onChange={(event): void => {
                    configDraft.setGameConfig({ name: event.target.value });
                  }}
                />
                <p className={styles.stageMeta}>
                  Shown on the TV lobby while guests arrive.
                </p>
              </div>
            </div>
          )}

          {stepIndex === 1 && (
            <>
              {draft.gameConfig.rounds.map((round, index) => (
                <article key={index} className={styles.cRoundCard}>
                  <p className={styles.deckGroupHead}>
                    Round {round.round}
                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={isLocked}
                      aria-label={`Remove round ${round.round}`}
                      onClick={(): void => {
                        configDraft.removeRound(index);
                      }}
                    >
                      ✕
                    </button>
                  </p>
                  <div className={styles.cFieldGrid}>
                    <div className="flex flex-col gap-1.5">
                      <label className={styles.fieldLabel} htmlFor={`cfg-c-label-${index}`}>
                        Label
                      </label>
                      <input
                        id={`cfg-c-label-${index}`}
                        className={styles.inputBase}
                        value={round.label}
                        disabled={isLocked}
                        onChange={(event): void => {
                          configDraft.setRound(index, { label: event.target.value });
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={styles.fieldLabel} htmlFor={`cfg-c-sauce-${index}`}>
                        Sauce
                      </label>
                      <input
                        id={`cfg-c-sauce-${index}`}
                        className={styles.inputBase}
                        value={round.sauce}
                        disabled={isLocked}
                        onChange={(event): void => {
                          configDraft.setRound(index, { sauce: event.target.value });
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className={styles.fieldLabel}>Minigame</span>
                      <span className="inline-flex gap-1.5">
                        {MINIGAME_TYPES.map((minigameType) => (
                          <button
                            key={minigameType}
                            type="button"
                            disabled={isLocked}
                            className={`${styles.deckChip} ${
                              round.minigame === minigameType ? styles.deckChipActive : ""
                            }`}
                            onClick={(): void => {
                              configDraft.setRound(index, { minigame: minigameType });
                            }}
                          >
                            {MINIGAME_DEFINITIONS[minigameType].slug}
                          </button>
                        ))}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={styles.fieldLabel} htmlFor={`cfg-c-points-${index}`}>
                        Points per wing eaten
                      </label>
                      <input
                        id={`cfg-c-points-${index}`}
                        className={styles.numberInput}
                        inputMode="numeric"
                        value={round.pointsPerPlayer}
                        disabled={isLocked}
                        onChange={(event): void => {
                          configDraft.setRound(index, {
                            pointsPerPlayer: parsePositiveInt(
                              event.target.value,
                              round.pointsPerPlayer
                            )
                          });
                        }}
                      />
                    </div>
                  </div>
                </article>
              ))}
              <button
                type="button"
                className={styles.bAddRoundRow}
                disabled={isLocked}
                onClick={configDraft.addRound}
              >
                + Add a round
              </button>
            </>
          )}

          {stepIndex === 2 && (
            <div className={styles.cFieldGrid}>
              {(
                [
                  ["eatingSeconds", "Eating timer (sec)"],
                  ["triviaSeconds", "Trivia timer (sec)"],
                  ["geoSeconds", "Geo timer (sec)"],
                  ["drawingSeconds", "Drawing timer (sec)"]
                ] as const
              ).map(([timerKey, label]) => (
                <div key={timerKey} className="flex flex-col gap-1.5">
                  <label className={styles.fieldLabel} htmlFor={`cfg-c-${timerKey}`}>
                    {label}
                  </label>
                  <input
                    id={`cfg-c-${timerKey}`}
                    className={styles.numberInput}
                    inputMode="numeric"
                    value={draft.gameConfig.timers[timerKey]}
                    disabled={isLocked}
                    onChange={(event): void => {
                      configDraft.setTimer(
                        timerKey,
                        parsePositiveInt(event.target.value, draft.gameConfig.timers[timerKey])
                      );
                    }}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className={styles.fieldLabel} htmlFor="cfg-c-default-max">
                  Minigame max points
                </label>
                <input
                  id="cfg-c-default-max"
                  className={styles.numberInput}
                  inputMode="numeric"
                  value={draft.gameConfig.minigameScoring.defaultMax}
                  disabled={isLocked}
                  onChange={(event): void => {
                    configDraft.setGameConfig({
                      minigameScoring: {
                        ...draft.gameConfig.minigameScoring,
                        defaultMax: parsePositiveInt(
                          event.target.value,
                          draft.gameConfig.minigameScoring.defaultMax
                        )
                      }
                    });
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={styles.fieldLabel} htmlFor="cfg-c-final-max">
                  Final round max points
                </label>
                <input
                  id="cfg-c-final-max"
                  className={styles.numberInput}
                  inputMode="numeric"
                  value={draft.gameConfig.minigameScoring.finalRoundMax}
                  disabled={isLocked}
                  onChange={(event): void => {
                    configDraft.setGameConfig({
                      minigameScoring: {
                        ...draft.gameConfig.minigameScoring,
                        finalRoundMax: parsePositiveInt(
                          event.target.value,
                          draft.gameConfig.minigameScoring.finalRoundMax
                        )
                      }
                    });
                  }}
                />
              </div>
            </div>
          )}

          {stepIndex === 3 && (
            <div className={styles.cFieldGrid}>
              <div className="flex flex-col">
                <p className={styles.deckGroupHead}>
                  Players <span className={styles.deckGroupCount}>{draft.playerNames.length}</span>
                </p>
                {draft.playerNames.map((name, index) => (
                  <div key={`${name}-${index}`} className={styles.deckRow}>
                    <span className={styles.deckRowName}>{name}</span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={isLocked}
                      aria-label={`Remove player ${name}`}
                      onClick={(): void => {
                        configDraft.removePlayer(index);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <form
                  className={styles.deckAddRow}
                  onSubmit={(event): void => {
                    event.preventDefault();
                    const normalized = nextPlayerName.trim();
                    if (normalized.length === 0) {
                      return;
                    }
                    configDraft.addPlayer(normalized);
                    setNextPlayerName("");
                  }}
                >
                  <label className="sr-only" htmlFor="cfg-c-add-player">
                    Add player
                  </label>
                  <input
                    id="cfg-c-add-player"
                    className={styles.deckInput}
                    placeholder="Add player…"
                    value={nextPlayerName}
                    disabled={isLocked}
                    onChange={(event): void => {
                      setNextPlayerName(event.target.value);
                    }}
                  />
                  <button type="submit" className={styles.deckAddButton} disabled={isLocked}>
                    Add
                  </button>
                </form>
              </div>
              <div className="flex flex-col">
                <p className={styles.deckGroupHead}>
                  Teams <span className={styles.deckGroupCount}>{draft.teamNames.length}</span>
                </p>
                {draft.teamNames.map((name, index) => (
                  <div key={`${name}-${index}`} className={styles.deckRow}>
                    <span className={styles.deckRowName}>{name}</span>
                    <button
                      type="button"
                      className={styles.removeButton}
                      disabled={isLocked}
                      aria-label={`Remove team ${name}`}
                      onClick={(): void => {
                        configDraft.removeTeam(index);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <form
                  className={styles.deckAddRow}
                  onSubmit={(event): void => {
                    event.preventDefault();
                    const normalized = nextTeamName.trim();
                    if (normalized.length === 0) {
                      return;
                    }
                    configDraft.addTeam(normalized);
                    setNextTeamName("");
                  }}
                >
                  <label className="sr-only" htmlFor="cfg-c-add-team">
                    Add team
                  </label>
                  <input
                    id="cfg-c-add-team"
                    className={styles.deckInput}
                    placeholder="Add team…"
                    value={nextTeamName}
                    disabled={isLocked}
                    onChange={(event): void => {
                      setNextTeamName(event.target.value);
                    }}
                  />
                  <button type="submit" className={styles.deckAddButton} disabled={isLocked}>
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}

          {stepIndex === 4 && (
            <div className="flex flex-col gap-5">
              <div className={styles.cardBase}>
                <div className={styles.cReviewRow}>
                  <span className={styles.cReviewKey}>Pack</span>
                  <span className={styles.cReviewValue}>{draft.gameConfig.name}</span>
                </div>
                <div className={styles.cReviewRow}>
                  <span className={styles.cReviewKey}>Lineup</span>
                  <span className={styles.cReviewValue}>
                    {draft.gameConfig.rounds
                      .map(
                        (round) =>
                          `${round.round}. ${round.label} (${MINIGAME_DEFINITIONS[round.minigame].slug})`
                      )
                      .join(" · ")}
                  </span>
                </div>
                <div className={styles.cReviewRow}>
                  <span className={styles.cReviewKey}>Timers</span>
                  <span className={styles.cReviewValue}>
                    eat {draft.gameConfig.timers.eatingSeconds}s · trivia{" "}
                    {draft.gameConfig.timers.triviaSeconds}s · geo{" "}
                    {draft.gameConfig.timers.geoSeconds}s · draw{" "}
                    {draft.gameConfig.timers.drawingSeconds}s
                  </span>
                </div>
                <div className={styles.cReviewRow}>
                  <span className={styles.cReviewKey}>Scoring</span>
                  <span className={styles.cReviewValue}>
                    max {draft.gameConfig.minigameScoring.defaultMax} · final{" "}
                    {draft.gameConfig.minigameScoring.finalRoundMax}
                  </span>
                </div>
                <div className={styles.cReviewRow}>
                  <span className={styles.cReviewKey}>Roster</span>
                  <span className={styles.cReviewValue}>
                    {draft.playerNames.length} players · {draft.teamNames.length} teams
                  </span>
                </div>
                <div className={styles.cReviewRow}>
                  <span className={styles.cReviewKey}>Packs</span>
                  <span className={styles.cReviewValue}>
                    trivia {draft.triviaPrompts.length} · geo {draft.geoPromptCount} · drawing{" "}
                    {draft.drawingPromptCount}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.cApplyButton}
                disabled={isLocked || !configDraft.isDirty}
                onClick={configDraft.apply}
              >
                {configDraft.isDirty
                  ? "Apply config & reload room"
                  : configDraft.lastAppliedAt === null
                    ? "Nothing to apply"
                    : `Applied ${configDraft.lastAppliedAt} ✓`}
              </button>
            </div>
          )}
        </div>

        <div className={styles.cNavRow}>
          <button
            type="button"
            className={styles.deckCtrlButton}
            disabled={stepIndex === 0}
            onClick={(): void => {
              setStepIndex((previous) => Math.max(0, previous - 1));
            }}
          >
            ← Back
          </button>
          {!isLastStep && (
            <button
              type="button"
              className={styles.deckAddButton}
              onClick={(): void => {
                setStepIndex((previous) => Math.min(STEPS.length - 1, previous + 1));
              }}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
