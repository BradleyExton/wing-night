import { Phase, type MusicPlaybackSource } from "@wingnight/shared";
import { useCallback, useMemo, useRef, useState } from "react";

import { ContentFatalState } from "../ContentFatalState";
import { AudioUnlockOverlay } from "./AudioUnlockOverlay";
import { GameLockedOverlay } from "./GameLockedOverlay";
import { GenreFontPreload } from "./GenreFontPreload";
import { NowPlayingSurface } from "./NowPlayingSurface";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import { useDisplayRoomState } from "../../context/RoomStateContext";
import { resolveMinigameRendererBundle } from "../../minigames/registry";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import { resolveTeamThemeById } from "../../utils/resolveTeamTheme";
import { useGameStartCountdown } from "./useGameStartCountdown";
import { useMusicPlaybackCue } from "./useMusicPlaybackCue";
import { useBeatClock } from "./useBeatClock";
import * as styles from "./styles";

type DisplayBoardProps = {
  // Reporting a finished track is the display's ONE outbound message, and it
  // stays optional: every harness that renders this board without a socket
  // still gets a working screen, just one whose playlist waits on the host.
  onMusicTrackEnded?: (source: MusicPlaybackSource, trackIndex: number) => void;
};

export const DisplayBoard = ({
  onMusicTrackEnded
}: DisplayBoardProps = {}): JSX.Element => {
  const roomState = useDisplayRoomState();
  const fatalError = roomState?.fatalError ?? null;
  const players = roomState?.players ?? [];
  const standings = useMemo(() => {
    if (!roomState) {
      return [];
    }

    return resolveSortedStandings(roomState.teams);
  }, [roomState]);

  // The standings footer sits beside the stage, not inside it, so it takes
  // the theme map from here; the stage bodies read the same map off
  // resolveStageViewModel. Both are the one pure resolver over the same teams.
  const teamThemeByTeamId = useMemo(
    () => resolveTeamThemeById(roomState?.teams ?? []),
    [roomState]
  );

  const phase = roomState?.phase ?? null;
  const gameStartCountdownRemainingSeconds = useGameStartCountdown({
    phase,
    currentRound: roomState?.currentRound ?? null
  });
  const shouldShowGameLockedOverlay =
    phase === Phase.INTRO || gameStartCountdownRemainingSeconds !== null;

  // Same resolution the stage surface uses (resolveStageViewModel:101).
  const activeTeamId =
    (roomState?.activeRoundTeamId ?? null) ??
    (roomState?.activeTurnTeamId ?? null);
  const activeTeamName = useMemo(() => {
    if (activeTeamId === null) {
      return null;
    }

    return roomState?.teams.find((team) => team.id === activeTeamId)?.name ?? null;
  }, [roomState, activeTeamId]);

  const displayMediaRef = useRef<HTMLAudioElement | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  // Session-scoped: once the room has been tapped, it stays unlocked, so the
  // overlay appears once a night rather than at every MINIGAME_INTRO.
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const unlockAudio = useCallback(() => {
    const media = displayMediaRef.current;

    setAudioUnlocked(true);

    if (media === null) {
      return;
    }

    // Priming, not playback: a user gesture is the only moment a browser will
    // let us touch the element, so we start and immediately stop it. Failure is
    // fine — the flag is already set and the cue effect will try again.
    //
    // The pause is SYNCHRONOUS, and that is load-bearing rather than tidy. When
    // it waited on the play promise it landed AFTER the cue effect this same
    // tap triggers, so the tap started the music and then killed it a beat
    // later — which is what the lobby playlist does on the very first tap of
    // the night. Pausing inside the handler puts the cue's play() last.
    // Rejecting the play promise does not undo the unlock: the policy check
    // happens when play() is CALLED, inside the gesture.
    try {
      void media.play().catch(() => {
        // Autoplay policy, a missing file, or our own pause below aborting it.
      });
      media.pause();
      media.currentTime = 0;
    } catch {
      // Some engines throw synchronously rather than rejecting.
    }
  }, []);

  const lobbyPlaylist = roomState?.lobbyPlaylist ?? [];
  const musicPlayback = roomState?.musicPlayback ?? null;

  // ONE cue on the one element. It renders `musicPlayback` and decides nothing:
  // which track, whether it is playing and where the playlist has got to are
  // all the server's, so a refresh, a second display and a host tap cannot
  // disagree about them.
  useMusicPlaybackCue({
    musicPlayback,
    audioUnlocked,
    mediaRef: displayMediaRef,
    onTrackEnded: onMusicTrackEnded
  });

  // The beat the lobby cast dances to, read off the same element: it flips
  // `data-beat` on the root, and the birds' parts answer it in CSS.
  useBeatClock({ mediaRef: displayMediaRef, audioUnlocked, rootRef });

  // Any source the night could ever play, which is what decides whether the
  // element exists — distinct from `musicPlayback`, which is what is playing.
  const hasAnyMusicSource =
    lobbyPlaylist.length > 0 ||
    (roomState?.teams ?? []).some((team) => (team.anthems ?? []).length > 0);

  // A game whose display surface is the room's speaker (Song Guess) needs the
  // same tap even when the active team has no anthem — otherwise the first clip
  // of the round is silently swallowed by the autoplay policy.
  const roundMinigameType = roomState?.currentRoundConfig?.minigame ?? null;
  const roundRequiresDisplayAudio =
    roundMinigameType !== null &&
    (resolveMinigameRendererBundle(roundMinigameType)?.requiresDisplayAudio ?? false);

  // Music the server is actually trying to PLAY is the condition, which covers
  // SETUP's lobby playlist and MINIGAME_INTRO's anthem in one clause — and
  // means the one tap of the night happens while people are still arriving,
  // before the autoplay policy has anything to reject. `isPlaying` matters:
  // asking a room to tap for an anthem that already finished, or for music the
  // host deliberately paused, is asking them to fix nothing.
  const shouldShowAudioUnlockOverlay =
    !audioUnlocked &&
    ((musicPlayback?.isPlaying ?? false) ||
      (phase === Phase.MINIGAME_INTRO && roundRequiresDisplayAudio));

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main ref={rootRef} className={styles.container}>
      <GenreFontPreload teams={roomState?.teams ?? []} />
      <div className={styles.displayAtmosphere} data-display-atmosphere aria-hidden />
      <NowPlayingSurface
        musicPlayback={musicPlayback}
        anthemTeamName={activeTeamName}
      />
      <section className={styles.main}>
        <div className={styles.content}>
          <div className={styles.stageShell}>
            <StageSurface showSetupPreview={shouldShowGameLockedOverlay} />
          </div>
        </div>
      </section>

      <StandingsSurface
        phase={phase}
        standings={standings}
        players={players}
        teamThemeByTeamId={teamThemeByTeamId}
      />
      {/* Mounted on whether the ROOM has music at all, not on whether any is
          playing right now, so the element survives every phase advance and the
          cue always has something to pause. The `src` is set by the cue effect,
          never here: resolving it reads `window`, which react-dom/server cannot
          do. `data-team-anthem` predates the lobby playlist and is kept because
          the e2e suite locates the element by it. */}
      {hasAnyMusicSource && (
        <audio ref={displayMediaRef} data-team-anthem preload="auto" crossOrigin="anonymous" />
      )}
      {shouldShowGameLockedOverlay && (
        <GameLockedOverlay remainingSeconds={gameStartCountdownRemainingSeconds} />
      )}
      {shouldShowAudioUnlockOverlay && <AudioUnlockOverlay onUnlock={unlockAudio} />}
    </main>
  );
};
