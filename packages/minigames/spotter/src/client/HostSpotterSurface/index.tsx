import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { SpotterDirection, SpotterMinigameHostView } from "@wingnight/shared";

import { hostSpotterSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";
import { useSpotterPadSounds } from "./useSpotterPadSounds/index.js";

// A stray tap must not resolve a target, so FIRE is a deliberate hold long
// enough to be grease-proof and to give the room one beat to yell "wait".
export const FIRE_HOLD_MS = 400;

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
      hostSpotterSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostSpotterSurfaceCopy.noAssignedTeamLabel;
};

const resolvePendingPoints = (spotterHostView: SpotterMinigameHostView | null): number | null => {
  if (spotterHostView === null || spotterHostView.activeTurnTeamId === null) {
    return null;
  }

  return spotterHostView.pendingPointsByTeamId[spotterHostView.activeTurnTeamId] ?? 0;
};

const resolveShotClassName = (band: SpotterMinigameHostView["results"][number]["band"]): string => {
  if (band === "HIT") {
    return styles.statusShotHit;
  }

  if (band === "CLOSE") {
    return styles.statusShotClose;
  }

  return styles.statusShotMiss;
};

type NudgeZoneProps = {
  className: string;
  label: string;
  direction: SpotterDirection;
  disabled: boolean;
  onNudge: (direction: SpotterDirection) => void;
};

const NudgeZone = ({ className, label, direction, disabled, onNudge }: NudgeZoneProps): JSX.Element => {
  return (
    <button
      className={className}
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(): void => {
        onNudge(direction);
      }}
    >
      {label}
    </button>
  );
};

export const HostSpotterSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
}: MinigameHostRendererProps): JSX.Element => {
  const spotterHostView =
    minigameHostView?.minigame === "SPOTTER" ? minigameHostView : null;
  const { playTick, playThunk } = useSpotterPadSounds();
  const [isCharging, setIsCharging] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHold = (): void => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setIsCharging(false);
  };

  useEffect(() => {
    return (): void => {
      if (holdTimerRef.current !== null) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const pendingPoints = resolvePendingPoints(spotterHostView);
  const isDone = spotterHostView?.status === "done";
  const canAim = isPlayPhase && canDispatchAction && spotterHostView !== null && !isDone;

  const handleNudge = (direction: SpotterDirection): void => {
    if (!canAim) {
      return;
    }

    playTick();
    onDispatchAction("nudge", { direction });
  };

  const fire = (): void => {
    if (!canAim) {
      return;
    }

    playThunk();
    onDispatchAction("fire", {});
  };

  const beginHold = (): void => {
    if (!canAim || holdTimerRef.current !== null) {
      return;
    }

    setIsCharging(true);
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setIsCharging(false);
      fire();
    }, FIRE_HOLD_MS);
  };

  const handleFireKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fire();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>{hostSpotterSurfaceCopy.railTitle}</span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostSpotterSurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && pendingPoints !== null && (
          <span className={styles.railPending}>
            {hostSpotterSurfaceCopy.pendingChip(pendingPoints)}
          </span>
        )}
      </div>
      {!isPlayPhase && (
        <p className={styles.introCard}>{hostSpotterSurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && spotterHostView === null && (
        <p className={styles.introCard}>{hostSpotterSurfaceCopy.waitingLabel}</p>
      )}
      {isPlayPhase && spotterHostView !== null && (
        <>
          <div className={styles.statusRow}>
            <span className={styles.statusProgress}>
              {hostSpotterSurfaceCopy.targetProgress(
                Math.min(spotterHostView.targetIndex + 1, spotterHostView.targetsPerTurn),
                spotterHostView.targetsPerTurn
              )}
            </span>
            <span>{hostSpotterSurfaceCopy.nudgesLabel(spotterHostView.nudgesThisTarget)}</span>
            {spotterHostView.lastShot !== null && (
              <span className={resolveShotClassName(spotterHostView.lastShot.band)}>
                {hostSpotterSurfaceCopy.shotLabel(spotterHostView.lastShot)}
              </span>
            )}
          </div>
          {isDone ? (
            <p className={styles.doneCard}>{hostSpotterSurfaceCopy.doneLabel}</p>
          ) : (
            <p className={styles.padInstruction}>{hostSpotterSurfaceCopy.padInstruction}</p>
          )}
          <div className={styles.pad}>
            <NudgeZone
              className={styles.zoneUp}
              label={hostSpotterSurfaceCopy.upLabel}
              direction="U"
              disabled={!canAim}
              onNudge={handleNudge}
            />
            <NudgeZone
              className={styles.zoneLeft}
              label={hostSpotterSurfaceCopy.leftLabel}
              direction="L"
              disabled={!canAim}
              onNudge={handleNudge}
            />
            <button
              className={isCharging ? styles.zoneFireCharging : styles.zoneFire}
              type="button"
              aria-label={hostSpotterSurfaceCopy.fireLabel}
              disabled={!canAim}
              onPointerDown={beginHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              onKeyDown={handleFireKeyDown}
            >
              <span>{hostSpotterSurfaceCopy.fireLabel}</span>
              <span className={styles.fireHint}>
                {isCharging
                  ? hostSpotterSurfaceCopy.fireChargingHint
                  : hostSpotterSurfaceCopy.fireHint}
              </span>
            </button>
            <NudgeZone
              className={styles.zoneRight}
              label={hostSpotterSurfaceCopy.rightLabel}
              direction="R"
              disabled={!canAim}
              onNudge={handleNudge}
            />
            <NudgeZone
              className={styles.zoneDown}
              label={hostSpotterSurfaceCopy.downLabel}
              direction="D"
              disabled={!canAim}
              onNudge={handleNudge}
            />
          </div>
        </>
      )}
    </div>
  );
};
