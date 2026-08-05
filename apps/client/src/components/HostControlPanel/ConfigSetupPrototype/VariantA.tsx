// PROTOTYPE (throwaway) — Variant A: "console tabs". Config folded into the
// existing host console shape: stage summary on the left, a tabbed form deck
// on the right, explicit Save & Apply. Mental model: config is another
// surface of the console you already run the night from.
import { useState } from "react";
import { MINIGAME_DEFINITIONS, MINIGAME_TYPES } from "@wingnight/shared";

import type { ConfigDraftApi } from "./useConfigDraft";
import * as styles from "./styles";

const TABS = ["GAME", "ROUNDS", "TIMERS", "ROSTER", "PROMPTS"] as const;

type Tab = (typeof TABS)[number];

const parsePositiveInt = (raw: string, fallback: number): number => {
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const TIMER_LABELS: Record<string, string> = {
  eatingSeconds: "Eating",
  triviaSeconds: "Trivia",
  geoSeconds: "Geo",
  drawingSeconds: "Drawing"
};

export const VariantA = (props: {
  configDraft: ConfigDraftApi;
  isLocked: boolean;
}): JSX.Element => {
  const { configDraft, isLocked } = props;
  const { draft } = configDraft;
  const [activeTab, setActiveTab] = useState<Tab>("GAME");
  const [nextPlayerName, setNextPlayerName] = useState("");
  const totalSeconds = Object.values(draft.gameConfig.timers).reduce(
    (sum, seconds) => sum + seconds,
    0
  );

  return (
    <div className={styles.mainSplit}>
      <section className={styles.stageRoot}>
        <span className={`${styles.stageGlow} ${styles.stageGlowDefault}`} />
        <p className={styles.stageEyebrow}>Game Setup</p>
        <h1 className={styles.stageHeadline}>
          Tune the <span className={styles.stageHeadlineAccent}>night.</span>
        </h1>
        <p className={styles.stageMeta}>
          <span className={styles.stageMetaStrong}>{draft.gameConfig.name}</span> — edit each
          section in the deck, then save &amp; apply.
        </p>
        {isLocked && <p className={styles.lockBanner}>Config locked — night in progress</p>}

        <div className={styles.aStatTiles}>
          <div className={styles.aStatTile}>
            <p className={styles.aStatValue}>{draft.gameConfig.rounds.length}</p>
            <p className={styles.aStatLabel}>Rounds</p>
          </div>
          <div className={styles.aStatTile}>
            <p className={styles.aStatValue}>{draft.playerNames.length}</p>
            <p className={styles.aStatLabel}>Players</p>
          </div>
          <div className={styles.aStatTile}>
            <p className={styles.aStatValue}>{draft.teamNames.length}</p>
            <p className={styles.aStatLabel}>Teams</p>
          </div>
          <div className={styles.aStatTile}>
            <p className={styles.aStatValue}>
              {Math.round(totalSeconds / 60)}
              <span className="text-[0.5em] text-muted">m</span>
            </p>
            <p className={styles.aStatLabel}>Timer budget</p>
          </div>
        </div>

        <div className={styles.aPreviewStrip}>
          {draft.gameConfig.rounds.map((round) => (
            <article key={round.round} className={styles.aPreviewCard}>
              <p className={styles.aPreviewRound}>ROUND {round.round}</p>
              <p className={styles.aPreviewLabel}>{round.label}</p>
              <p className={styles.aPreviewMeta}>
                {round.sauce} · {MINIGAME_DEFINITIONS[round.minigame].slug}
              </p>
            </article>
          ))}
        </div>
      </section>

      <aside className={styles.deckRoot}>
        <div className={styles.aTabRow}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.deckChip} ${tab === activeTab ? styles.deckChipActive : ""}`}
              onClick={(): void => {
                setActiveTab(tab);
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "GAME" && (
          <div className={styles.deckGroupRoot}>
            <p className={styles.deckGroupHead}>Identity &amp; scoring</p>
            <label className={styles.fieldLabel} htmlFor="cfg-a-name">
              Pack name
            </label>
            <input
              id="cfg-a-name"
              className={styles.deckInput}
              value={draft.gameConfig.name}
              disabled={isLocked}
              onChange={(event): void => {
                configDraft.setGameConfig({ name: event.target.value });
              }}
            />
            <div className={styles.deckRow}>
              <span className={styles.deckRowName}>Minigame max</span>
              <input
                className={styles.numberInput}
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
            <div className={styles.deckRow}>
              <span className={styles.deckRowName}>Final round max</span>
              <input
                className={styles.numberInput}
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
          </div>
        )}

        {activeTab === "ROUNDS" && (
          <div className={styles.deckGroupRoot}>
            <p className={styles.deckGroupHead}>
              Rounds <span className={styles.deckGroupCount}>{draft.gameConfig.rounds.length}</span>
            </p>
            {draft.gameConfig.rounds.map((round, index) => (
              <div key={index} className={styles.deckRow}>
                <span className={styles.deckRowName}>
                  <span className={styles.deckGroupCount}>{round.round}</span>
                  <input
                    className={styles.bInlineInput}
                    value={round.label}
                    disabled={isLocked}
                    aria-label={`Round ${round.round} label`}
                    onChange={(event): void => {
                      configDraft.setRound(index, { label: event.target.value });
                    }}
                  />
                </span>
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
                      {MINIGAME_DEFINITIONS[minigameType].slug.slice(0, 4)}
                    </button>
                  ))}
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
                </span>
              </div>
            ))}
            <div className={styles.deckAddRow}>
              <button
                type="button"
                className={styles.deckAddButton}
                disabled={isLocked}
                onClick={configDraft.addRound}
              >
                Add round
              </button>
            </div>
          </div>
        )}

        {activeTab === "TIMERS" && (
          <div className={styles.deckGroupRoot}>
            <p className={styles.deckGroupHead}>Timers &amp; rules</p>
            {Object.entries(draft.gameConfig.timers).map(([timerKey, seconds]) => (
              <div key={timerKey} className={styles.deckRow}>
                <span className={styles.deckRowName}>{TIMER_LABELS[timerKey] ?? timerKey}</span>
                <span className={styles.bStepperGroup}>
                  <input
                    className={styles.numberInput}
                    inputMode="numeric"
                    value={seconds}
                    disabled={isLocked}
                    aria-label={`${TIMER_LABELS[timerKey] ?? timerKey} seconds`}
                    onChange={(event): void => {
                      configDraft.setTimer(
                        timerKey as keyof typeof draft.gameConfig.timers,
                        parsePositiveInt(event.target.value, seconds)
                      );
                    }}
                  />
                  <span className={styles.deckRowMeta}>sec</span>
                </span>
              </div>
            ))}
            <div className={styles.deckRow}>
              <span className={styles.deckRowName}>Trivia Qs / turn</span>
              <input
                className={styles.numberInput}
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
            <div className={styles.deckRow}>
              <span className={styles.deckRowName}>Geo prompts / turn</span>
              <input
                className={styles.numberInput}
                inputMode="numeric"
                value={Number(draft.gameConfig.minigameRules?.geo?.promptsPerTurn ?? 3)}
                disabled={isLocked}
                aria-label="Geo prompts per turn"
                onChange={(event): void => {
                  configDraft.setRule(
                    "geo",
                    "promptsPerTurn",
                    parsePositiveInt(event.target.value, 3)
                  );
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "ROSTER" && (
          <div className={styles.deckGroupRoot}>
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
              <label className="sr-only" htmlFor="cfg-a-add-player">
                Add player
              </label>
              <input
                id="cfg-a-add-player"
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
        )}

        {activeTab === "PROMPTS" && (
          <div className={styles.deckGroupRoot}>
            <p className={styles.deckGroupHead}>
              Trivia pack{" "}
              <span className={styles.deckGroupCount}>{draft.triviaPrompts.length}</span>
            </p>
            {draft.triviaPrompts.map((prompt, index) => (
              <div key={prompt.id} className={styles.deckRow}>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <input
                    className={styles.bInlineInput}
                    value={prompt.question}
                    placeholder="Question…"
                    disabled={isLocked}
                    aria-label={`Trivia question ${index + 1}`}
                    onChange={(event): void => {
                      configDraft.setTriviaPrompt(index, { question: event.target.value });
                    }}
                  />
                  <input
                    className={styles.bSauceInput}
                    value={prompt.answer}
                    placeholder="Answer…"
                    disabled={isLocked}
                    aria-label={`Trivia answer ${index + 1}`}
                    onChange={(event): void => {
                      configDraft.setTriviaPrompt(index, { answer: event.target.value });
                    }}
                  />
                </span>
                <button
                  type="button"
                  className={styles.removeButton}
                  disabled={isLocked}
                  aria-label={`Remove trivia prompt ${index + 1}`}
                  onClick={(): void => {
                    configDraft.removeTriviaPrompt(index);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className={styles.deckAddRow}>
              <button
                type="button"
                className={styles.deckAddButton}
                disabled={isLocked}
                onClick={configDraft.addTriviaPrompt}
              >
                Add prompt
              </button>
            </div>
            <p className={styles.deckGroupHead}>Other packs</p>
            <div className={styles.deckRow}>
              <span className={styles.deckRowName}>Geo landmarks</span>
              <span className={styles.deckRowMeta}>{draft.geoPromptCount} prompts</span>
            </div>
            <div className={styles.deckRow}>
              <span className={styles.deckRowName}>Drawing prompts</span>
              <span className={styles.deckRowMeta}>{draft.drawingPromptCount} prompts</span>
            </div>
          </div>
        )}

        <div className={styles.aSaveBar}>
          {configDraft.isDirty ? (
            <span className={styles.dirtyPill}>Unsaved changes</span>
          ) : (
            <span className={styles.applyPill}>
              {configDraft.lastAppliedAt === null
                ? "In sync"
                : `Applied ${configDraft.lastAppliedAt}`}
            </span>
          )}
          <span className={styles.deckChipRow}>
            <button
              type="button"
              className={styles.deckCtrlButton}
              disabled={!configDraft.isDirty || isLocked}
              onClick={configDraft.discard}
            >
              Discard
            </button>
            <button
              type="button"
              className={styles.deckAddButton}
              disabled={!configDraft.isDirty || isLocked}
              onClick={configDraft.apply}
            >
              Save &amp; apply
            </button>
          </span>
        </div>
      </aside>
    </div>
  );
};
