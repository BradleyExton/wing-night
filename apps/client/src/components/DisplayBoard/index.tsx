import { Phase } from "@wingnight/shared";
import { useCallback, useMemo, useRef, useState } from "react";

import { ContentFatalState } from "../ContentFatalState";
import { AudioUnlockOverlay } from "./AudioUnlockOverlay";
import { GameLockedOverlay } from "./GameLockedOverlay";
import { StageSurface } from "./StageSurface";
import { StandingsSurface } from "./StandingsSurface";
import { useDisplayRoomState } from "../../context/RoomStateContext";
import { resolveSortedStandings } from "../../utils/resolveSortedStandings";
import { useGameStartCountdown } from "./useGameStartCountdown";
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

  const anthemMediaRef = useRef<HTMLAudioElement | null>(null);
  // Session-scoped: once the room has been tapped, it stays unlocked, so the
  // overlay appears once a night rather than at every MINIGAME_INTRO.
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const unlockAudio = useCallback(() => {
    const media = anthemMediaRef.current;

    setAudioUnlocked(true);

    if (media === null) {
      return;
    }

    // Priming, not playback: a user gesture is the only moment a browser will
    // let us touch the element, so we start and immediately stop it. Failure is
    // fine — the flag is already set and the cue effect will try again.
    try {
      void media
        .play()
        .then(() => {
          media.pause();
        })
        .catch(() => {
          // Autoplay policy or a missing file; best-effort by design.
        });
    } catch {
      // Some engines throw synchronously rather than rejecting.
    }
  }, []);

  useTeamAnthemCue({
    phase,
    anthems: activeTeamAnthems,
    audioUnlocked,
    mediaRef: anthemMediaRef
  });

  const shouldShowAudioUnlockOverlay =
    phase === Phase.MINIGAME_INTRO &&
    activeTeamAnthems !== null &&
    !audioUnlocked;

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
      {/* Rendered on the team-has-anthems condition rather than on the phase, so
          the element survives the MINIGAME_INTRO → EATING advance and the cue
          still has something to pause. The `src` is set by the cue effect, never
          here: resolving it reads `window`, which react-dom/server cannot do. */}
      {activeTeamAnthems !== null && (
        <audio ref={anthemMediaRef} data-team-anthem preload="auto" />
      )}
      {shouldShowGameLockedOverlay && (
        <GameLockedOverlay remainingSeconds={gameStartCountdownRemainingSeconds} />
      )}
      {shouldShowAudioUnlockOverlay && <AudioUnlockOverlay onUnlock={unlockAudio} />}
    </main>
  );
};
