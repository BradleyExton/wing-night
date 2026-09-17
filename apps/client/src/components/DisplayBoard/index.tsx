import { Phase } from "@wingnight/shared";
import { useCallback, useMemo, useRef, useState } from "react";

import { ContentFatalState } from "../ContentFatalState";
import { AudioUnlockOverlay } from "./AudioUnlockOverlay";
import { GameLockedOverlay } from "./GameLockedOverlay";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import { useDisplayRoomState } from "../../context/RoomStateContext";
import { resolveMinigameRendererBundle } from "../../minigames/registry";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import { useGameStartCountdown } from "./useGameStartCountdown";
import { useLobbyPlaylistCue } from "./useLobbyPlaylistCue";
import { useTeamAnthemCue } from "./useTeamAnthemCue";
import * as styles from "./styles";

export const DisplayBoard = (): JSX.Element => {
  const roomState = useDisplayRoomState();
  const fatalError = roomState?.fatalError ?? null;
  const players = roomState?.players ?? [];
  const standings = useMemo(() => {
    if (!roomState) {
      return [];
    }

    return resolveSortedStandings(roomState.teams);
  }, [roomState]);

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
  const activeTeamAnthems = useMemo(() => {
    if (activeTeamId === null) {
      return null;
    }

    const activeTeam = roomState?.teams.find((team) => team.id === activeTeamId);
    const anthems = activeTeam?.anthems ?? [];

    return anthems.length > 0 ? anthems : null;
  }, [roomState, activeTeamId]);

  const displayMediaRef = useRef<HTMLAudioElement | null>(null);
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

  useTeamAnthemCue({
    phase,
    anthems: activeTeamAnthems,
    currentRound: roomState?.currentRound ?? null,
    audioUnlocked,
    mediaRef: displayMediaRef
  });
  // Both cues drive the ONE element above. They never overlap: the lobby
  // playlist owns SETUP, the anthem owns MINIGAME_INTRO, and each only stops
  // audio it started.
  useLobbyPlaylistCue({
    phase,
    lobbyPlaylist,
    audioUnlocked,
    mediaRef: displayMediaRef
  });

  // A game whose display surface is the room's speaker (Song Guess) needs the
  // same tap even when the active team has no anthem — otherwise the first clip
  // of the round is silently swallowed by the autoplay policy.
  const roundMinigameType = roomState?.currentRoundConfig?.minigame ?? null;
  const roundRequiresDisplayAudio =
    roundMinigameType !== null &&
    (resolveMinigameRendererBundle(roundMinigameType)?.requiresDisplayAudio ?? false);

  // SETUP is included so the one tap of the night happens while people are
  // still arriving — before it, the autoplay policy rejects the lobby playlist
  // exactly as it rejects an anthem.
  const shouldShowAudioUnlockOverlay =
    !audioUnlocked &&
    ((phase === Phase.MINIGAME_INTRO &&
      (activeTeamAnthems !== null || roundRequiresDisplayAudio)) ||
      (phase === Phase.SETUP && lobbyPlaylist.length > 0));

  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  return (
    <main className={styles.container}>
      <div className={styles.displayAtmosphere} data-display-atmosphere aria-hidden />
      <section className={styles.main}>
        <div className={styles.content}>
          <div className={styles.stageShell}>
            <StageSurface showSetupPreview={shouldShowGameLockedOverlay} />
          </div>
        </div>
      </section>

      <StandingsSurface phase={phase} standings={standings} players={players} />
      {/* Rendered on the has-audio condition rather than on the phase, so the
          element survives the MINIGAME_INTRO → EATING advance and the cue still
          has something to pause. The `src` is set by the cue effects, never
          here: resolving it reads `window`, which react-dom/server cannot do.
          One element, shared: see the cue calls above. */}
      {(activeTeamAnthems !== null || lobbyPlaylist.length > 0) && (
        <audio ref={displayMediaRef} data-team-anthem preload="auto" />
      )}
      {shouldShowGameLockedOverlay && (
        <GameLockedOverlay remainingSeconds={gameStartCountdownRemainingSeconds} />
      )}
      {shouldShowAudioUnlockOverlay && <AudioUnlockOverlay onUnlock={unlockAudio} />}
    </main>
  );
};
