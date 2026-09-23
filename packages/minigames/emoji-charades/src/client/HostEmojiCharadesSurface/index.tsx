import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { EmojiCharadesMinigameHostView } from "@wingnight/shared";
import { TakeoverStage } from "@wingnight/surface";

import { hostEmojiCharadesSurfaceCopy } from "./copy.js";
import { EmojiPicker } from "./EmojiPicker/index.js";
import * as styles from "./styles.js";

// The subject the clue-giver is drawing in emoji. The same card on both beats:
// a panel in the host's own control deck at intro, the head of the takeover's
// deck column at play. The "N subjects left" line it used to carry is a rail-
// row chip now (§4, `counter`) — a number the host glances at, beside a name
// they read.
const renderSubjectCard = (subjectText: string | null): JSX.Element => (
  <div className={styles.subjectCard}>
    <p className={styles.subjectLabel}>
      {hostEmojiCharadesSurfaceCopy.subjectLabel}
    </p>
    <p className={styles.subjectValue}>
      {subjectText ?? hostEmojiCharadesSurfaceCopy.waitingSubjectLabel}
    </p>
  </div>
);

// EMOJI_CHARADES's host surface. At play it is a `<TakeoverStage>` with a deck
// (docs/takeover-layout-api.md §3): the body is a grid of tap targets, so
// floating chrome over it covers a button rather than a corner of scenery —
// and it is the one body of the nine that does not want more width, because
// `aspect-square` cells mean a wider grid is a grid that holds fewer emoji.
//
// It is also the one game that branches on `hostView.status` rather than on
// `phase` (§10). The layouts never branch on either: they take elements, so
// each status computes its own slots and passes nothing for a slot it has
// nothing for. `turn_complete` has no counter and no deck, and the deck
// collapsing to no width is what gives that beat the whole canvas.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is — which is why the `resolveActiveTeamName` helper that all
// nine host surfaces had copied is no longer here. `clock` is forwarded
// untouched and does draw: EMOJI_CHARADES is one of the three games with a
// play-phase timer (`emojiCharadesSeconds`), and one of the two that reserved
// nothing for it in the corner it used to land in (§6).
export const HostEmojiCharadesSurface = ({
  phase,
  minigameHostView,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const hostView: EmojiCharadesMinigameHostView | null =
    minigameHostView?.minigame === "EMOJI_CHARADES" ? minigameHostView : null;

  // The intro beat is a panel in the control deck, not a takeover, so it
  // carries no chrome — but it does show the subject, because the host is the
  // one who has to clue it and reading it cold costs the turn its first taps.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introDescription}>
          {hostEmojiCharadesSurfaceCopy.introDescription}
        </p>
        {hostView !== null &&
          hostView.status === "playing" &&
          renderSubjectCard(hostView.currentSubject?.text ?? null)}
      </div>
    );
  }

  if (hostView === null || hostView.status !== "playing") {
    return (
      <TakeoverStage rail={rail} clock={clock}>
        {hostView === null ? (
          <p className={styles.waitingNote}>
            {hostEmojiCharadesSurfaceCopy.waitingSubjectLabel}
          </p>
        ) : (
          <div className={styles.turnComplete}>
            <p className={styles.turnCompleteTitle}>
              {hostEmojiCharadesSurfaceCopy.turnCompleteTitle}
            </p>
            <p className={styles.turnCompleteHint}>
              {hostEmojiCharadesSurfaceCopy.turnCompleteHint}
            </p>
          </div>
        )}
      </TakeoverStage>
    );
  }

  const currentSubject = hostView.currentSubject;
  const hasSubject = currentSubject !== null;
  const hasSequence = hostView.emojiSequence.length > 0;
  const pendingPoints =
    hostView.activeTurnTeamId === null
      ? 0
      : (hostView.pendingPointsByTeamId[hostView.activeTurnTeamId] ?? 0);

  return (
    <TakeoverStage
      rail={rail}
      clock={clock}
      counter={
        <>
          <span className={styles.counter}>
            {hostEmojiCharadesSurfaceCopy.subjectsRemainingLabel(
              hostView.subjectsRemaining
            )}
          </span>
          {pendingPoints > 0 && (
            <span className={styles.counterPending}>
              {hostEmojiCharadesSurfaceCopy.pendingChip(pendingPoints)}
            </span>
          )}
        </>
      }
      deck={
        <>
          {renderSubjectCard(currentSubject?.text ?? null)}
          {/* Positive verdict first (§4, owner decision P7). */}
          <button
            className={styles.gotItButton}
            type="button"
            disabled={!canDispatchAction || !hasSubject}
            onClick={(): void => {
              onDispatchAction("markCorrect", {});
            }}
          >
            <span className={styles.verdictIcon} aria-hidden="true">
              {hostEmojiCharadesSurfaceCopy.gotItIconGlyph}
            </span>
            {hostEmojiCharadesSurfaceCopy.gotItButtonLabel}
            <span className={styles.verdictHint}>
              {hostEmojiCharadesSurfaceCopy.gotItButtonHint}
            </span>
          </button>
          {/* The skip escape hatch stays on the canvas rather than moving to
              the override dock: dropping a subject nobody can clue is the
              host's ordinary move here, and AGENTS.md §11 never lets it go. */}
          <button
            className={styles.skipButton}
            type="button"
            disabled={!canDispatchAction || !hasSubject}
            onClick={(): void => {
              onDispatchAction("skipSubject", {});
            }}
          >
            <span className={styles.verdictIcon} aria-hidden="true">
              {hostEmojiCharadesSurfaceCopy.skipIconGlyph}
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
              disabled={!canDispatchAction || !hasSequence}
              onClick={(): void => {
                onDispatchAction("removeEmoji", {});
              }}
            >
              {hostEmojiCharadesSurfaceCopy.backButtonLabel}
            </button>
            <button
              className={styles.utilityButton}
              type="button"
              disabled={!canDispatchAction || !hasSequence}
              onClick={(): void => {
                onDispatchAction("clearEmojis", {});
              }}
            >
              {hostEmojiCharadesSurfaceCopy.clearButtonLabel}
            </button>
          </div>
        </>
      }
    >
      <div className={styles.picker}>
        {hasSequence ? (
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
          isDisabled={!canDispatchAction}
          lockedEmojis={currentSubject?.lockedEmojis ?? null}
          lockedLabel={hostEmojiCharadesSurfaceCopy.lockedPickerLabel(
            currentSubject?.text ?? ""
          )}
          onSelectEmoji={(emoji): void => {
            onDispatchAction("appendEmoji", { emoji });
          }}
        />
      </div>
    </TakeoverStage>
  );
};
