import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SongGuessMinigameHostView } from "@wingnight/shared";

import { SongScoringDeck } from "./SongScoringDeck/index.js";
import { hostSongGuessSurfaceCopy } from "./copy.js";
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
      hostSongGuessSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostSongGuessSurfaceCopy.noAssignedTeamLabel;
};

const SongCard = ({ view }: { view: SongGuessMinigameHostView }): JSX.Element => {
  const currentSong = view.currentSong;

  if (currentSong === null) {
    return (
      <p className={styles.waitingNote}>
        {hostSongGuessSurfaceCopy.waitingSongLabel}
      </p>
    );
  }

  return (
    <div className={styles.songCard}>
      <span className={styles.songCounter}>
        {hostSongGuessSurfaceCopy.songCounter(view.songCursor + 1, view.songsTotal)}
      </span>
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

const RunningTotals = ({
  view,
  teamNameByTeamId
}: {
  view: SongGuessMinigameHostView;
  teamNameByTeamId: Map<string, string>;
}): JSX.Element => {
  const teamIds = Object.keys(view.pendingPointsByTeamId);

  return (
    <div className={styles.totalsCard}>
      <span className={styles.totalsTitle}>
        {hostSongGuessSurfaceCopy.totalsTitle}
      </span>
      {teamIds.map((teamId) => (
        <div
          key={teamId}
          className={`${styles.totalsRow}${
            teamId === view.activeTurnTeamId ? ` ${styles.totalsRowActive}` : ""
          }`}
        >
          <span>{teamNameByTeamId.get(teamId) ?? teamId}</span>
          <span className={styles.totalsPoints}>
            {hostSongGuessSurfaceCopy.totalsPoints(
              view.pendingPointsByTeamId[teamId] ?? 0
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

export const HostSongGuessSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const songGuessView =
    minigameHostView?.minigame === "SONG_GUESS" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
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
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>
          {hostSongGuessSurfaceCopy.railTitle}
        </span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostSongGuessSurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && pendingPoints !== null && (
          <span className={styles.railPending}>
            {hostSongGuessSurfaceCopy.pendingChip(pendingPoints)}
          </span>
        )}
      </div>
      {!isPlayPhase && (
        <p className={styles.introCard}>
          {hostSongGuessSurfaceCopy.introDescription}
        </p>
      )}
      {isPlayPhase && songGuessView !== null && (
        <div className={styles.playArea}>
          <div className={styles.stageColumn}>
            <SongCard view={songGuessView} />
            {isDone && (
              <p className={styles.doneNote}>{hostSongGuessSurfaceCopy.doneLabel}</p>
            )}
          </div>
          <aside className={styles.deck}>
            <div className={styles.transportRow}>
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
            </div>
            <div className={styles.transportRow}>
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
            {isRevealing ? (
              <>
                <SongScoringDeck
                  currentScore={songGuessView.currentScore}
                  canDispatchAction={canAct}
                  onMark={(actionType, correct): void => {
                    onDispatchAction(actionType, { correct });
                  }}
                />
                <button
                  className={styles.revealButton}
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
            <RunningTotals view={songGuessView} teamNameByTeamId={teamNameByTeamId} />
          </aside>
        </div>
      )}
    </div>
  );
};
