import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { EmojiCharadesMinigameHostView } from "@wingnight/shared";

import { hostEmojiCharadesSurfaceCopy } from "./copy.js";
import { EmojiPicker } from "./EmojiPicker/index.js";
import * as styles from "./styles.js";

const resolveActiveTeamName = ({
  minigameHostView,
  teamNameByTeamId,
  activeTeamName
}: Pick<
  MinigameHostRendererProps,
  "minigameHostView" | "teamNameByTeamId" | "activeTeamName"
>): string => {
  if (minigameHostView?.activeTurnTeamId) {
    return (
      teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
      hostEmojiCharadesSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostEmojiCharadesSurfaceCopy.noAssignedTeamLabel;
};

export const HostEmojiCharadesSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const hostView: EmojiCharadesMinigameHostView | null =
    minigameHostView?.minigame === "EMOJI_CHARADES" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const canAct = isPlayPhase && canDispatchAction;

  return (
    <div className={styles.container}>
      <div>
        <p className={styles.description}>
          {isPlayPhase
            ? hostEmojiCharadesSurfaceCopy.playDescription
            : hostEmojiCharadesSurfaceCopy.introDescription}
        </p>
        <div className={styles.meta}>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>
              {hostEmojiCharadesSurfaceCopy.activeTeamMetaLabel}
            </p>
            <p className={styles.metaValue}>{resolvedActiveTeamName}</p>
          </div>
        </div>
      </div>

      {hostView?.status === "deck_selection" && (
        <div className={styles.playArea}>
          <div className={styles.pickerColumn}>
            <p className={styles.sectionTitle}>
              {hostEmojiCharadesSurfaceCopy.deckSelectionTitle}
            </p>
            <p className={styles.sectionHint}>
              {hostEmojiCharadesSurfaceCopy.deckSelectionHint}
            </p>
            <div className={styles.deckList}>
              {hostView.availableDecks.map((deck) => (
                <button
                  key={deck.id}
                  className={
                    deck.isSelectable ? styles.deckRow : styles.deckRowDisabled
                  }
                  type="button"
                  disabled={!deck.isSelectable || !canAct}
                  onClick={(): void => {
                    onDispatchAction("selectDeck", { deckId: deck.id });
                  }}
                >
                  <span className={styles.deckRowLabel}>{deck.label}</span>
                  <span className={styles.deckRowMeta}>
                    {deck.isSelectable
                      ? hostEmojiCharadesSurfaceCopy.deckSubjectCountLabel(
                          deck.subjectCount
                        )
                      : hostEmojiCharadesSurfaceCopy.deckTooSmallLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {hostView?.status === "playing" && (
        <div className={styles.playArea}>
          <div className={styles.pickerColumn}>
            {hostView.emojiSequence.length > 0 ? (
              <p className={styles.canvas}>
                {hostView.emojiSequence.map((emoji, index) => (
                  <span key={`${emoji}-${index}`}>{emoji}</span>
                ))}
              </p>
            ) : (
              <p className={styles.canvasEmpty}>
                {hostEmojiCharadesSurfaceCopy.emptySequenceLabel}
              </p>
            )}
            <EmojiPicker
              isDisabled={!canAct}
              onSelectEmoji={(emoji): void => {
                onDispatchAction("appendEmoji", { emoji });
              }}
            />
          </div>

          <div className={styles.deckColumn}>
            <div className={styles.subjectCard}>
              <p className={styles.subjectLabel}>
                {hostEmojiCharadesSurfaceCopy.subjectLabel}
              </p>
              <p className={styles.subjectValue}>
                {hostView.currentSubject?.text ??
                  hostEmojiCharadesSurfaceCopy.waitingSubjectLabel}
              </p>
              <p className={styles.subjectMeta}>
                {hostEmojiCharadesSurfaceCopy.subjectsRemainingLabel(
                  hostView.subjectsRemaining
                )}
              </p>
            </div>
            <button
              className={styles.gotItButton}
              type="button"
              disabled={!canAct || hostView.currentSubject === null}
              onClick={(): void => {
                onDispatchAction("markCorrect", {});
              }}
            >
              <span className={styles.verdictIcon} aria-hidden="true">
                {"✓"}
              </span>
              {hostEmojiCharadesSurfaceCopy.gotItButtonLabel}
              <span className={styles.verdictHint}>
                {hostEmojiCharadesSurfaceCopy.gotItButtonHint}
              </span>
            </button>
            <button
              className={styles.skipButton}
              type="button"
              disabled={!canAct || hostView.currentSubject === null}
              onClick={(): void => {
                onDispatchAction("skipSubject", {});
              }}
            >
              <span className={styles.verdictIcon} aria-hidden="true">
                {"↷"}
              </span>
              {hostEmojiCharadesSurfaceCopy.skipButtonLabel}
              <span className={styles.verdictHint}>
                {hostEmojiCharadesSurfaceCopy.skipButtonHint}
              </span>
            </button>
            <div className={styles.utilityRow}>
              <button
                className={styles.utilityButton}
                type="button"
                disabled={!canAct || hostView.emojiSequence.length === 0}
                onClick={(): void => {
                  onDispatchAction("removeEmoji", {});
                }}
              >
                {hostEmojiCharadesSurfaceCopy.backButtonLabel}
              </button>
              <button
                className={styles.utilityButton}
                type="button"
                disabled={!canAct || hostView.emojiSequence.length === 0}
                onClick={(): void => {
                  onDispatchAction("clearEmojis", {});
                }}
              >
                {hostEmojiCharadesSurfaceCopy.clearButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {hostView?.status === "turn_complete" && (
        <div className={styles.playArea}>
          <div className={styles.pickerColumn}>
            <p className={styles.sectionTitle}>
              {hostEmojiCharadesSurfaceCopy.turnCompleteTitle}
            </p>
            <p className={styles.statusNote}>
              {hostEmojiCharadesSurfaceCopy.turnCompleteHint}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
