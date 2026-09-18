import { useEffect, useMemo, useRef } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameHostView, FappyMinigameLeg, Player, Team } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { FappyScene, type FappySceneHandle } from "../FappyScene/index.js";
import { resolveLegBird } from "../resolveLegBird/index.js";
import { useFappyRunner } from "../useFappyRunner/index.js";
import { formatRelayClock, useRelayClock } from "../useRelayClock/index.js";
import { hostFappySurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// The clock turns to heat with this much of the limit left.
const URGENT_REMAINING_MS = 15_000;

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
      hostFappySurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostFappySurfaceCopy.noAssignedTeamLabel;
};

const resolvePlayerName = (
  leg: FappyMinigameLeg | null | undefined,
  players: readonly Player[]
): string | null => {
  if (leg === null || leg === undefined || leg.playerId === null) {
    return null;
  }

  return players.find((player) => player.id === leg.playerId)?.name ?? null;
};

const isRelayOver = (view: FappyMinigameHostView): boolean => {
  return view.phase === "finished" || view.phase === "timedOut";
};

const RelayClock = ({ view, elapsedMs }: { view: FappyMinigameHostView; elapsedMs: number | null }): JSX.Element => {
  const remainingMs = view.limitSeconds * 1000 - (elapsedMs ?? 0);
  const clockClassName =
    elapsedMs !== null && remainingMs <= URGENT_REMAINING_MS
      ? styles.railClockUrgent
      : elapsedMs !== null && elapsedMs > view.parSeconds * 1000
        ? styles.railClockPastPar
        : "";

  return (
    <span className={`${styles.railClock} ${clockClassName}`} data-fappy-clock>
      {elapsedMs === null ? hostFappySurfaceCopy.clockIdle : formatRelayClock(elapsedMs)}
      <span className={styles.railClockLimit}>{hostFappySurfaceCopy.clockLimit(view.limitSeconds)}</span>
    </span>
  );
};

const FinishCard = ({ view, elapsedMs }: { view: FappyMinigameHostView; elapsedMs: number | null }): JSX.Element => {
  const isTimedOut = view.phase === "timedOut";

  return (
    <div className={styles.finishCard} data-fappy-finish={view.phase}>
      <p className={`${styles.finishTitle}${isTimedOut ? ` ${styles.finishTitleTimedOut}` : ""}`}>
        {isTimedOut ? hostFappySurfaceCopy.timedOutTitle : hostFappySurfaceCopy.finishedTitle}
      </p>
      <span className={styles.finishTime}>
        {isTimedOut
          ? hostFappySurfaceCopy.progressLine(view.totalGatesCleared, view.legsPerTurn * view.gatesPerLeg)
          : hostFappySurfaceCopy.finishTime(formatRelayClock(elapsedMs ?? 0))}
      </span>
      <span className={styles.finishPoints}>{hostFappySurfaceCopy.finishPoints(view.points ?? 0)}</span>
    </div>
  );
};

const LegHistory = ({ view }: { view: FappyMinigameHostView }): JSX.Element => {
  return (
    <div className={styles.historyRow}>
      <span className={styles.historyTitle}>{hostFappySurfaceCopy.historyTitle}</span>
      {view.legs.map((leg) => {
        const isActive = leg.legIndex === view.legIndex && !isRelayOver(view);
        const chipClassName = `${styles.historyChip}${
          leg.status === "cleared"
            ? ` ${styles.historyChipCleared}`
            : isActive
              ? ` ${styles.historyChipActive}`
              : ""
        }`;

        return (
          <span key={leg.legIndex} className={chipClassName}>
            {leg.status === "cleared" ? hostFappySurfaceCopy.historyCleared : hostFappySurfaceCopy.historyPending}
            {leg.crashes > 0 && <span>{hostFappySurfaceCopy.historyCrashes(leg.crashes)}</span>}
          </span>
        );
      })}
    </div>
  );
};

const RunningTotals = ({
  view,
  teamNameByTeamId
}: {
  view: FappyMinigameHostView;
  teamNameByTeamId: Map<string, string>;
}): JSX.Element => {
  const teamIds = Object.keys(view.pendingPointsByTeamId);

  return (
    <div className={styles.totalsCard}>
      <span className={styles.totalsTitle}>{hostFappySurfaceCopy.totalsTitle}</span>
      {teamIds.map((teamId) => (
        <div
          key={teamId}
          className={`${styles.totalsRow}${
            teamId === view.activeTurnTeamId ? ` ${styles.totalsRowActive}` : ""
          }`}
        >
          <span>{teamNameByTeamId.get(teamId) ?? teamId}</span>
          <span className={styles.totalsPoints}>
            {hostFappySurfaceCopy.totalsPoints(view.pendingPointsByTeamId[teamId] ?? 0)}
          </span>
        </div>
      ))}
      <span className={styles.totalsNote}>{hostFappySurfaceCopy.parLine(view.parSeconds)}</span>
    </div>
  );
};

type CorridorProps = {
  view: FappyMinigameHostView;
  canAct: boolean;
  players: readonly Player[];
  teams: readonly Team[];
  serverOrigin: string | null;
  onDispatchAction: MinigameHostRendererProps["onDispatchAction"];
};

// The flap surface and the loop behind it. Split from the deck so the
// runner's refs and the scene live together, keyed on the leg in hand.
const Corridor = ({
  view,
  canAct,
  players,
  teams,
  serverOrigin,
  onDispatchAction
}: CorridorProps): JSX.Element => {
  const sceneRef = useRef<FappySceneHandle>(null);
  const legIndex = Math.min(view.legIndex, view.legsPerTurn - 1);
  const leg = view.legs[legIndex] ?? null;
  const gates = useMemo(() => {
    return leg === null
      ? []
      : resolveFappyGates({ seed: leg.seed, legIndex: leg.legIndex, gatesPerLeg: view.gatesPerLeg });
  }, [leg, view.gatesPerLeg]);
  const bird = resolveLegBird({
    leg,
    activeTurnTeamId: view.activeTurnTeamId,
    players,
    teams,
    serverOrigin
  });
  // Who stands on the landing cliff: the next leg's player, or nobody on the last leg.
  const nextLeg = view.legs[legIndex + 1] ?? null;
  const waitingBird =
    nextLeg === null
      ? null
      : resolveLegBird({ leg: nextLeg, activeTurnTeamId: view.activeTurnTeamId, players, teams, serverOrigin });
  const isLive = view.phase === "ready" || view.phase === "flying";
  const { flap } = useFappyRunner({
    leg,
    gatesPerLeg: view.gatesPerLeg,
    canAct: canAct && isLive,
    sceneRef,
    onFlap: (tick): void => {
      onDispatchAction("flap", { tick });
    },
    onEndLeg: (): void => {
      onDispatchAction("endLeg", {});
    }
  });
  const isArmed = canAct && isLive;

  return (
    <div
      className={`${styles.arenaFrame} ${isArmed ? styles.arenaFrameArmed : styles.arenaFrameLocked}`}
      data-fappy-arena
      onPointerDown={(event): void => {
        event.preventDefault();
        flap();
      }}
    >
      <FappyScene
        ref={sceneRef}
        gates={gates}
        gatesPerLeg={view.gatesPerLeg}
        bird={bird}
        waitingBird={waitingBird}
        sceneId="host-fappy"
        label={hostFappySurfaceCopy.sceneLabel(bird.playerName)}
      />
    </div>
  );
};

const resolveHint = (
  view: FappyMinigameHostView,
  canAct: boolean,
  players: readonly Player[]
): string => {
  const legIndex = Math.min(view.legIndex, view.legsPerTurn - 1);
  const leg = view.legs[legIndex];
  const waitingName = resolvePlayerName(view.legs[legIndex + 1] ?? null, players);

  if (view.phase === "ready") {
    if (!canAct) {
      return hostFappySurfaceCopy.readyLockedHint;
    }

    return leg !== undefined && leg.attempt > 0
      ? hostFappySurfaceCopy.respawnHint(leg.checkpointGate)
      : hostFappySurfaceCopy.readyHint(waitingName);
  }

  if (view.phase === "flying") {
    return hostFappySurfaceCopy.flyingHint(waitingName);
  }

  return view.phase === "timedOut" ? hostFappySurfaceCopy.timedOutHint : hostFappySurfaceCopy.finishedHint;
};

export const HostFappySurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction,
  serverOrigin,
  players,
  teams
}: MinigameHostRendererProps): JSX.Element => {
  const fappyView = minigameHostView?.minigame === "FAPPY" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
  const canAct = canDispatchAction && fappyView !== null;
  const elapsedMs = useRelayClock({
    startedAtMs: fappyView?.startedAtMs ?? null,
    endedAtMs: fappyView?.timedOutAtMs ?? fappyView?.finishedAtMs ?? null
  });
  const isLive = fappyView !== null && (fappyView.phase === "ready" || fappyView.phase === "flying");
  const isPastLimit =
    fappyView !== null && elapsedMs !== null && elapsedMs >= fappyView.limitSeconds * 1000;
  const currentLeg =
    fappyView === null ? null : (fappyView.legs[Math.min(fappyView.legIndex, fappyView.legsPerTurn - 1)] ?? null);

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  // The tablet's clock says the limit has passed; tell the server, which
  // checks it against its own clock before ending the relay.
  useEffect(() => {
    if (canAct && isLive && isPastLimit) {
      onDispatchAction("timeOut", {});
    }
  }, [canAct, isLive, isPastLimit]);

  return (
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>{hostFappySurfaceCopy.railTitle}</span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostFappySurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && fappyView !== null && <RelayClock view={fappyView} elapsedMs={elapsedMs} />}
      </div>
      {!isPlayPhase && (
        <p className={styles.introCard}>{hostFappySurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && fappyView !== null && (
        <div className={styles.playArea}>
          <div className={styles.arenaColumn}>
            <Corridor
              view={fappyView}
              canAct={canAct}
              players={players}
              teams={teams}
              serverOrigin={serverOrigin}
              onDispatchAction={onDispatchAction}
            />
            <p className={styles.arenaHint}>{resolveHint(fappyView, canAct, players)}</p>
          </div>
          <aside className={styles.deck}>
            <div className={styles.legCard}>
              <span className={styles.legCounter}>
                {hostFappySurfaceCopy.legCounter(
                  Math.min(fappyView.legIndex + 1, fappyView.legsPerTurn),
                  fappyView.legsPerTurn
                )}
              </span>
              <p className={styles.flyingName}>
                {hostFappySurfaceCopy.flyingLabel(resolvePlayerName(currentLeg, players))}
              </p>
              <div className={styles.legMeta}>
                <span>
                  {hostFappySurfaceCopy.progressLine(
                    fappyView.totalGatesCleared,
                    fappyView.legsPerTurn * fappyView.gatesPerLeg
                  )}
                </span>
                {currentLeg !== null && currentLeg.crashes > 0 && (
                  <span data-fappy-crashes={currentLeg.crashes}>
                    {hostFappySurfaceCopy.crashesChip(currentLeg.crashes)}
                  </span>
                )}
              </div>
            </div>
            {isRelayOver(fappyView) && <FinishCard view={fappyView} elapsedMs={elapsedMs} />}
            <div className={styles.deckRows}>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct || !isLive}
                onClick={(): void => {
                  dispatch("skipLeg");
                }}
              >
                {hostFappySurfaceCopy.skipLegButtonLabel}
              </button>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct}
                onClick={(): void => {
                  dispatch("resetTurn");
                }}
              >
                {hostFappySurfaceCopy.resetTurnButtonLabel}
              </button>
            </div>
            <LegHistory view={fappyView} />
            <RunningTotals view={fappyView} teamNameByTeamId={teamNameByTeamId} />
          </aside>
        </div>
      )}
    </div>
  );
};
