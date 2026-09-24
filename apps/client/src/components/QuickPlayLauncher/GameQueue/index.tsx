import {
  MINIGAME_TYPES,
  type GameConfigFile,
  type MinigameType
} from "@wingnight/shared";

import { resolveMinigameBriefingContent } from "../../../copy/minigameBriefings";
import { quickPlayLauncherCopy } from "../copy";
import type { QuickPlayDraft } from "../quickPlayDraft";
import { GameSettings } from "./GameSettings";
import * as styles from "./styles";

type GameQueueProps = {
  gameConfig: GameConfigFile | null;
  draft: QuickPlayDraft;
  onToggleGame: (minigame: MinigameType) => void;
  onMoveGame: (minigame: MinigameType, direction: -1 | 1) => void;
  onSetRule: (minigame: MinigameType, ruleKey: string, value: number | boolean) => void;
  onSetTimer: (minigame: MinigameType, timerSeconds: number) => void;
};

// Every registered game, in registry order, each a tap away from the queue.
// Derived from MINIGAME_TYPES the way the dev launcher is, so a new game
// shows up here without touching this component.
export const GameQueue = ({
  gameConfig,
  draft,
  onToggleGame,
  onMoveGame,
  onSetRule,
  onSetTimer
}: GameQueueProps): JSX.Element => {
  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{quickPlayLauncherCopy.gamesSectionTitle}</span>
        <span className={styles.groupCount}>{draft.queue.length}</span>
      </div>
      <p className={styles.hint}>{quickPlayLauncherCopy.gamesHint}</p>
      <div className={styles.list}>
        {MINIGAME_TYPES.map((minigameType) => {
          const briefing = resolveMinigameBriefingContent(minigameType, gameConfig);
          const gameName = briefing?.displayName ?? minigameType;
          const queueIndex = draft.queue.findIndex((entry) => entry.minigame === minigameType);
          const entry = queueIndex === -1 ? null : draft.queue[queueIndex];
          const isQueued = entry !== null && entry !== undefined;

          return (
            <div
              key={minigameType}
              className={`${styles.card} ${isQueued ? styles.cardQueued : ""}`}
              data-quick-play-game={minigameType}
            >
              <button
                type="button"
                className={styles.cardToggle}
                aria-pressed={isQueued}
                aria-label={
                  isQueued
                    ? quickPlayLauncherCopy.unqueueGameAriaLabel(gameName)
                    : quickPlayLauncherCopy.queueGameAriaLabel(gameName)
                }
                onClick={(): void => {
                  onToggleGame(minigameType);
                }}
              >
                <span className={`${styles.position} ${isQueued ? styles.positionQueued : ""}`}>
                  {isQueued ? quickPlayLauncherCopy.queuePositionLabel(queueIndex + 1) : ""}
                </span>
                {briefing !== null && (
                  <img
                    className={styles.thumb}
                    src={briefing.illustrationPath}
                    alt={briefing.illustrationAlt}
                  />
                )}
                <span className={styles.cardBody}>
                  <span className={styles.cardName}>{gameName}</span>
                  <span className={styles.cardDetail}>{briefing?.summary ?? ""}</span>
                </span>
              </button>
              {isQueued && (
                <div className={styles.cardControls}>
                  <button
                    type="button"
                    className={styles.moveButton}
                    aria-label={quickPlayLauncherCopy.moveEarlierAriaLabel(gameName)}
                    disabled={queueIndex === 0}
                    onClick={(): void => {
                      onMoveGame(minigameType, -1);
                    }}
                  >
                    {quickPlayLauncherCopy.moveEarlierGlyph}
                  </button>
                  <button
                    type="button"
                    className={styles.moveButton}
                    aria-label={quickPlayLauncherCopy.moveLaterAriaLabel(gameName)}
                    disabled={queueIndex === draft.queue.length - 1}
                    onClick={(): void => {
                      onMoveGame(minigameType, 1);
                    }}
                  >
                    {quickPlayLauncherCopy.moveLaterGlyph}
                  </button>
                </div>
              )}
              {isQueued && (
                <GameSettings
                  entry={entry}
                  onSetRule={(ruleKey, value): void => {
                    onSetRule(minigameType, ruleKey, value);
                  }}
                  onSetTimer={(timerSeconds): void => {
                    onSetTimer(minigameType, timerSeconds);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
