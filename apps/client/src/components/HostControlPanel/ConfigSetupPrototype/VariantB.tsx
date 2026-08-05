// PROTOTYPE (throwaway) — Variant B: "rundown first". The rounds lineup IS
// the page: one full-width editable show-rundown, globals as inline-editable
// tiles up top, changes live-apply (debounced) while in SETUP. Mental model:
// you're editing the running order of a show.
import { MINIGAME_DEFINITIONS, MINIGAME_TYPES } from "@wingnight/shared";

import type { ConfigDraftApi } from "./useConfigDraft";
import * as styles from "./styles";

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const GLOBAL_TIMERS: { key: "eatingSeconds" | "triviaSeconds" | "geoSeconds" | "drawingSeconds"; label: string }[] = [
  { key: "eatingSeconds", label: "Eating sec" },
  { key: "triviaSeconds", label: "Trivia sec" },
  { key: "geoSeconds", label: "Geo sec" },
  { key: "drawingSeconds", label: "Drawing sec" }
];

export const VariantB = (props: {
  configDraft: ConfigDraftApi;
  isLocked: boolean;
}): JSX.Element => {
  const { configDraft, isLocked } = props;
  const { draft } = configDraft;

  return (
    <div className={styles.bRoot}>
      <div className={styles.bTopBar}>
        <div>
          <p className={styles.stageEyebrow}>Tonight&apos;s rundown</p>
          <label className="sr-only" htmlFor="cfg-b-name">
            Pack name
          </label>
          <input
            id="cfg-b-name"
            className={styles.bNameInput}
            value={draft.gameConfig.name}
            disabled={isLocked}
            onChange={(event): void => {
              configDraft.setGameConfig({ name: event.target.value });
            }}
          />
        </div>
        {isLocked ? (
          <span className={styles.lockBanner}>Locked — night in progress</span>
        ) : configDraft.isDirty ? (
          <span className={styles.dirtyPill}>Applying…</span>
        ) : (
          <span className={styles.applyPill}>
            {configDraft.lastAppliedAt === null
              ? "Live — edits apply instantly"
              : `Applied ${configDraft.lastAppliedAt}`}
          </span>
        )}
      </div>

      <div className={styles.bGlobalsRow}>
        {GLOBAL_TIMERS.map((timer) => (
          <div key={timer.key} className={styles.bGlobalTile}>
            <span className={styles.bGlobalLabel}>{timer.label}</span>
            <input
              className={styles.bGlobalInput}
              inputMode="numeric"
              value={draft.gameConfig.timers[timer.key]}
              disabled={isLocked}
              aria-label={timer.label}
              onChange={(event): void => {
                configDraft.setTimer(
                  timer.key,
                  parsePositiveInt(event.target.value, draft.gameConfig.timers[timer.key])
                );
              }}
            />
          </div>
        ))}
        <div className={styles.bGlobalTile}>
          <span className={styles.bGlobalLabel}>Minigame max</span>
          <input
            className={styles.bGlobalInput}
            inputMode="numeric"
            value={draft.gameConfig.minigameScoring.defaultMax}
            disabled={isLocked}
            aria-label="Default minigame max points"
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
        <div className={styles.bGlobalTile}>
          <span className={styles.bGlobalLabel}>Final max</span>
          <input
            className={styles.bGlobalInput}
            inputMode="numeric"
            value={draft.gameConfig.minigameScoring.finalRoundMax}
            disabled={isLocked}
            aria-label="Final round max points"
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
        <div className={styles.bGlobalTile}>
          <span className={styles.bGlobalLabel}>Trivia Q/turn</span>
          <input
            className={styles.bGlobalInput}
            inputMode="numeric"
            value={Number(draft.gameConfig.minigameRules?.trivia?.questionsPerTurn ?? 5)}
            disabled={isLocked}
            aria-label="Trivia questions per turn"
            onChange={(event): void => {
              configDraft.setRule(
                "trivia",
                "questionsPerTurn",
                parsePositiveInt(event.target.value, 5)
              );
            }}
          />
        </div>
        <div className={styles.bGlobalTile}>
          <span className={styles.bGlobalLabel}>Geo P/turn</span>
          <input
            className={styles.bGlobalInput}
            inputMode="numeric"
            value={Number(draft.gameConfig.minigameRules?.geo?.promptsPerTurn ?? 3)}
            disabled={isLocked}
            aria-label="Geo prompts per turn"
            onChange={(event): void => {
              configDraft.setRule("geo", "promptsPerTurn", parsePositiveInt(event.target.value, 3));
            }}
          />
        </div>
      </div>

      <div className={styles.bRundown}>
        <p className={styles.deckGroupHead}>
          Running order{" "}
          <span className={styles.deckGroupCount}>{draft.gameConfig.rounds.length} rounds</span>
        </p>
        {draft.gameConfig.rounds.map((round, index) => (
          <div key={index} className={styles.bRundownRow}>
            <span className={styles.bRoundNumber}>
              {String(round.round).padStart(2, "0")}
            </span>
            <span className={styles.bReorderCol}>
              <button
                type="button"
                className={styles.stepperButton}
                disabled={isLocked || index === 0}
                aria-label={`Move round ${round.round} up`}
                onClick={(): void => {
                  configDraft.moveRound(index, -1);
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.stepperButton}
                disabled={isLocked || index === draft.gameConfig.rounds.length - 1}
                aria-label={`Move round ${round.round} down`}
                onClick={(): void => {
                  configDraft.moveRound(index, 1);
                }}
              >
                ↓
              </button>
            </span>
            <input
              className={styles.bInlineInput}
              value={round.label}
              placeholder="Round label…"
              disabled={isLocked}
              aria-label={`Round ${round.round} label`}
              onChange={(event): void => {
                configDraft.setRound(index, { label: event.target.value });
              }}
            />
            <input
              className={styles.bSauceInput}
              value={round.sauce}
              placeholder="Sauce…"
              disabled={isLocked}
              aria-label={`Round ${round.round} sauce`}
              onChange={(event): void => {
                configDraft.setRound(index, { sauce: event.target.value });
              }}
            />
            <span className={styles.deckChipRow}>
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
            <span className={styles.bStepperGroup}>
              <button
                type="button"
                className={styles.stepperButton}
                disabled={isLocked || round.pointsPerPlayer <= 1}
                aria-label={`Decrease round ${round.round} points`}
                onClick={(): void => {
                  configDraft.setRound(index, { pointsPerPlayer: round.pointsPerPlayer - 1 });
                }}
              >
                −
              </button>
              <span className={styles.numberInput.replace("w-24", "w-14") /* narrow readout */}>
                {round.pointsPerPlayer}
              </span>
              <button
                type="button"
                className={styles.stepperButton}
                disabled={isLocked}
                aria-label={`Increase round ${round.round} points`}
                onClick={(): void => {
                  configDraft.setRound(index, { pointsPerPlayer: round.pointsPerPlayer + 1 });
                }}
              >
                +
              </button>
              <span className={styles.deckRowMeta}>pts/wing</span>
            </span>
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
          </div>
        ))}
        <button
          type="button"
          className={styles.bAddRoundRow}
          disabled={isLocked}
          onClick={configDraft.addRound}
        >
          + Add a round
        </button>
      </div>

      <div className={styles.bFootNote}>
        <span>
          Roster: {draft.playerNames.length} players · {draft.teamNames.length} teams — managed in
          the Setup deck
        </span>
        <span>
          Packs: trivia {draft.triviaPrompts.length} · geo {draft.geoPromptCount} · drawing{" "}
          {draft.drawingPromptCount}
        </span>
        <span>Config locks when the night starts</span>
      </div>
    </div>
  );
};
