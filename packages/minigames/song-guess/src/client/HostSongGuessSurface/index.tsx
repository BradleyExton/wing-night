import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SongGuessMinigameHostView } from "@wingnight/shared";
import { RunningTotals, TakeoverStage } from "@wingnight/surface";

import { SongScoringPad } from "./SongScoringPad/index.js";
import { hostSongGuessSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// The answer, host-only, filling the body's left pane. The song counter that
// used to sit inside it is a rail-row chip now (§4, `counter`): it is a number
// the host glances at, and the card is the thing they read out.
const AnswerCard = ({ view }: { view: SongGuessMinigameHostView }): JSX.Element => {
  const currentSong = view.currentSong;

  if (currentSong === null) {
    return (
      <p className={styles.waitingNote}>
        {hostSongGuessSurfaceCopy.waitingSongLabel}
      </p>
    );
  }

  return (
    <div className={styles.answerCard}>
      <span className={styles.answerLabel}>
        {hostSongGuessSurfaceCopy.answerLabel}
      </span>
      <p className={styles.answerTitle}>{currentSong.correctTitle}</p>
      <p className={styles.answerArtist}>
        <span className={styles.answerArtistPrefix}>
          {hostSongGuessSurfaceCopy.artistPrefix}
        </span>
        {currentSong.correctArtist}
      </p>
      {(currentSong.difficulty !== undefined || currentSong.hint !== undefined) && (
        <div className={styles.badgeRow}>
          {currentSong.difficulty !== undefined && (
            <span className={styles.difficultyBadge}>{currentSong.difficulty}</span>
          )}
          {currentSong.hint !== undefined && (
            <p className={styles.hintText}>{currentSong.hint}</p>
          )}
        </div>
      )}
    </div>
  );
};

// SONG_GUESS's host surface. At play it is a `<TakeoverStage>` with no deck
// (docs/takeover-layout-api.md §3): the body is the answer the host reads out
// and the round so far they check it against, so a floating chip there covers
// a word rather than a corner of scenery — and the turn needs nine tap targets
// plus a totals panel, which a Canvas has nowhere to put, its two floating
// slots sharing one edge. The 330px deck that held all of them is gone; the
// controls are the foot row now, where both thumbs are on a tablet on a table.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is — which is why the `resolveActiveTeamName` helper that all
// nine host surfaces had copied is no longer here. `clock` is forwarded
// untouched and draws nothing: SONG_GUESS is `timerKey: null`, and an empty
// slot in the rail row takes no width, which is what retired this file's
// hand-typed `pr-[clamp(9rem,15vw,12rem)]` reserve (§6).
export const HostSongGuessSurface = ({
  phase,
  minigameHostView,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const songGuessView =
    minigameHostView?.minigame === "SONG_GUESS" ? minigameHostView : null;

  // The intro beat is a panel in the host's own control deck rather than a
  // takeover — `rail` and `clock` are both null on it — so it gets the
  // briefing note and no chrome.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>
          {hostSongGuessSurfaceCopy.introDescription}
        </p>
      </div>
    );
  }

  const pendingPoints =
    songGuessView === null || songGuessView.activeTurnTeamId === null
      ? null
      : (songGuessView.pendingPointsByTeamId[songGuessView.activeTurnTeamId] ?? 0);

  const songPhase = songGuessView?.phase ?? "idle";
  const canAct = canDispatchAction && songGuessView !== null;
  const isPlaying = songPhase === "clip_playing";
  const isPaused = songPhase === "clip_paused";
  const isRevealing = songPhase === "reveal";
  const isDone = songPhase === "done";

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  return (
    <TakeoverStage
      rail={rail}
      clock={clock}
      counter={
        songGuessView === null ? null : (
          <>
            <span className={styles.counter}>
              {hostSongGuessSurfaceCopy.songCounter(
                songGuessView.songCursor + 1,
                songGuessView.songsTotal
              )}
            </span>
            {pendingPoints !== null && (
              <span className={styles.counterPending}>
                {hostSongGuessSurfaceCopy.pendingChip(pendingPoints)}
              </span>
            )}
          </>
        )
      }
      actions={
        songGuessView === null ? null : (
          <div className={styles.actions}>
            <div className={styles.transport}>
              <button
                className={styles.transportPrimary}
                type="button"
                disabled={!canAct || isPlaying || isRevealing || isDone}
                onClick={(): void => {
                  dispatch("playClip");
                }}
              >
                {isPaused
                  ? hostSongGuessSurfaceCopy.resumeButtonLabel
                  : hostSongGuessSurfaceCopy.playButtonLabel}
              </button>
              <button
                className={styles.transportSecondary}
                type="button"
                disabled={!canAct || !isPlaying}
                onClick={(): void => {
                  dispatch("pauseClip");
                }}
              >
                {hostSongGuessSurfaceCopy.pauseButtonLabel}
              </button>
              <button
                className={styles.transportSecondary}
                type="button"
                disabled={!canAct || !isPaused || songGuessView.replayUsed}
                onClick={(): void => {
                  dispatch("replayClip");
                }}
              >
                {songGuessView.replayUsed
                  ? hostSongGuessSurfaceCopy.replayUsedLabel
                  : hostSongGuessSurfaceCopy.replayButtonLabel}
              </button>
              {/* The escape hatch stays on the canvas, not in the override
                  dock: dropping a song the room cannot hear is the host's
                  ordinary move here, and AGENTS.md §11 never lets it leave. */}
              <button
                className={styles.transportSecondary}
                type="button"
                disabled={!canAct || isRevealing || isDone}
                onClick={(): void => {
                  dispatch("skipSong");
                }}
              >
                {hostSongGuessSurfaceCopy.skipSongButtonLabel}
              </button>
            </div>
            <div className={styles.ruling}>
              {isDone ? (
                <p className={styles.doneNote}>{hostSongGuessSurfaceCopy.doneLabel}</p>
              ) : isRevealing ? (
                <>
                  <SongScoringPad
                    currentScore={songGuessView.currentScore}
                    canDispatchAction={canAct}
                    onMark={(actionType, correct): void => {
                      onDispatchAction(actionType, { correct });
                    }}
                  />
                  <button
                    className={styles.nextButton}
                    type="button"
                    disabled={!canAct}
                    onClick={(): void => {
                      dispatch("nextSong");
                    }}
                  >
                    {hostSongGuessSurfaceCopy.nextSongButtonLabel}
                  </button>
                </>
              ) : (
                <button
                  className={styles.revealButton}
                  type="button"
                  disabled={!canAct || !isPaused}
                  onClick={(): void => {
                    dispatch("triggerReveal");
                  }}
                >
                  {hostSongGuessSurfaceCopy.revealButtonLabel}
                </button>
              )}
            </div>
          </div>
        )
      }
    >
      {songGuessView === null ? null : (
        <div className={styles.body}>
          <div className={styles.answerPane}>
            <AnswerCard view={songGuessView} />
          </div>
          {/* Read-only, so it is body content rather than chrome: the body is
              everything the host reads (§4), and what is left of the old deck
              column is this one pane. */}
          <aside className={styles.totalsPane}>
            <RunningTotals
              pendingPointsByTeamId={songGuessView.pendingPointsByTeamId}
              activeTurnTeamId={songGuessView.activeTurnTeamId}
              teamNameByTeamId={teamNameByTeamId}
            />
          </aside>
        </div>
      )}
    </TakeoverStage>
  );
};
