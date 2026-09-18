import { useMemo, useRef } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { FappyMinigameHostView, FappyMinigameLeg, Player, Team } from "@wingnight/shared";
import { resolveFappyGates } from "@wingnight/shared";

import { FappyScene, type FappySceneHandle } from "../FappyScene/index.js";
import { resolveLegBird } from "../resolveLegBird/index.js";
import { useFappyRunner } from "../useFappyRunner/index.js";
import { hostFappySurfaceCopy } from "./copy.js";
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

const OutcomeCard = ({ leg }: { leg: FappyMinigameLeg }): JSX.Element | null => {
  if (leg.outcome === null) {
    return null;
  }

  return (
    <div className={styles.outcomeCard} data-fappy-outcome={leg.outcome}>
      <p
        className={`${styles.outcomeTitle}${leg.outcome === "cleared" ? ` ${styles.outcomeTitleCleared}` : ""}`}
      >
        {hostFappySurfaceCopy.outcomeTitle(leg.outcome)}
      </p>
      <span className={styles.outcomeGates}>
        {hostFappySurfaceCopy.outcomeGates(leg.gatesCleared)}
      </span>
    </div>
  );
};

const LegHistory = ({ view }: { view: FappyMinigameHostView }): JSX.Element => {
  return (
    <div className={styles.historyRow}>
      <span className={styles.historyTitle}>{hostFappySurfaceCopy.historyTitle}</span>
      {view.legs.map((leg) => {
        const isActive = leg.legIndex === view.legIndex && view.phase !== "done";
        const chipClassName = `${styles.historyChip}${
          leg.outcome === "cleared"
            ? ` ${styles.historyChipCleared}`
            : isActive
              ? ` ${styles.historyChipActive}`
              : ""
        }`;

        return (
          <span key={leg.legIndex} className={chipClassName}>
            {leg.status === "landed"
              ? hostFappySurfaceCopy.historyGates(leg.gatesCleared)
              : hostFappySurfaceCopy.historyPending}
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
      <span className={styles.totalsGates}>
        {hostFappySurfaceCopy.gatesTotal(view.totalGatesCleared)}
      </span>
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
  const leg = view.legs[view.legIndex] ?? null;
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
  const { flap } = useFappyRunner({
    leg,
    gatesPerLeg: view.gatesPerLeg,
    canAct: canAct && view.phase !== "done",
    sceneRef,
    onFlap: (tick): void => {
      onDispatchAction("flap", { tick });
    },
    onEndLeg: (): void => {
      onDispatchAction("endLeg", {});
    }
  });
  const isArmed = canAct && (view.phase === "ready" || view.phase === "flying");

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
        bird={bird}
        sceneId="host-fappy"
        label={hostFappySurfaceCopy.sceneLabel(bird.playerName)}
      />
    </div>
  );
};

const resolveHint = (view: FappyMinigameHostView, canAct: boolean): string => {
  if (view.phase === "ready") {
    return canAct ? hostFappySurfaceCopy.readyHint : hostFappySurfaceCopy.readyLockedHint;
  }

  if (view.phase === "flying") {
    return hostFappySurfaceCopy.flyingHint;
  }

  if (view.phase === "landed") {
    const leg = view.legs[view.legIndex];

    return leg?.outcome === null || leg === undefined
      ? hostFappySurfaceCopy.settlingHint
      : hostFappySurfaceCopy.outcomeTitle(leg.outcome);
  }

  return hostFappySurfaceCopy.doneHint;
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
  const pendingPoints =
    fappyView === null || fappyView.activeTurnTeamId === null
      ? null
      : (fappyView.pendingPointsByTeamId[fappyView.activeTurnTeamId] ?? 0);
  const canAct = canDispatchAction && fappyView !== null;
  const currentLeg = fappyView?.legs[fappyView.legIndex] ?? null;
  const nextLeg = fappyView?.legs[fappyView.legIndex + 1] ?? null;
  const isLanded = fappyView?.phase === "landed";
  const isDone = fappyView?.phase === "done";
  const isLastLeg = fappyView !== null && fappyView.legIndex === fappyView.legsPerTurn - 1;

  const dispatch = (actionType: string): void => {
    onDispatchAction(actionType, {});
  };

  return (
    <div className={styles.container}>
      <div className={styles.rail}>
        <span className={styles.railTitle}>{hostFappySurfaceCopy.railTitle}</span>
        <span className={styles.railTeam}>
          <span className={styles.railTeamDot} aria-hidden="true" />
          {hostFappySurfaceCopy.teamPrefix} {resolvedActiveTeamName}
        </span>
        {isPlayPhase && pendingPoints !== null && (
          <span className={styles.railPending}>
            {hostFappySurfaceCopy.pendingChip(pendingPoints)}
          </span>
        )}
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
            <p className={styles.arenaHint}>{resolveHint(fappyView, canAct)}</p>
          </div>
          <aside className={styles.deck}>
            <div className={styles.legCard}>
              <span className={styles.legCounter}>
                {hostFappySurfaceCopy.legCounter(
                  Math.min(fappyView.legIndex + 1, fappyView.legsPerTurn),
                  fappyView.legsPerTurn
                )}
              </span>
              {!isDone && (
                <p className={styles.flyingName}>
                  {hostFappySurfaceCopy.flyingLabel(resolvePlayerName(currentLeg, players))}
                </p>
              )}
            </div>
            {currentLeg !== null && isLanded && <OutcomeCard leg={currentLeg} />}
            {isDone ? (
              <p className={styles.doneNote}>{hostFappySurfaceCopy.turnOverLabel}</p>
            ) : (
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!canAct || !isLanded}
                onClick={(): void => {
                  dispatch("nextLeg");
                }}
              >
                {isLastLeg
                  ? hostFappySurfaceCopy.finishButtonLabel
                  : hostFappySurfaceCopy.passButtonLabel(resolvePlayerName(nextLeg, players))}
              </button>
            )}
            <div className={styles.deckRows}>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct || isLanded || isDone}
                onClick={(): void => {
                  dispatch("skipLeg");
                }}
              >
                {hostFappySurfaceCopy.skipLegButtonLabel}
              </button>
              <button
                className={styles.deckRowButton}
                type="button"
                disabled={!canAct || (fappyView.phase === "ready" && fappyView.legIndex === 0)}
                onClick={(): void => {
                  dispatch("redoLeg");
                }}
              >
                {hostFappySurfaceCopy.redoLegButtonLabel}
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
