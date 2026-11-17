import type { MinigameHostRendererProps, MinigameSeat } from "@wingnight/minigames-core";
import type { BrawlMinigameHostView } from "@wingnight/shared";
import { RunningTotals, TakeoverCanvas, useVerdictDispatch } from "@wingnight/surface";

import { CrewPad } from "../CrewPad/index.js";
import { CrewScene } from "../CrewScene/index.js";
import { resolveCrewSlotColour } from "../CrewScene/palette.js";
import { resolveLiveBanked, resolveShownBlock } from "../shownBlock/index.js";
import { useCrewFrame } from "../useCrewFrame/index.js";
import { hostBrawlSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no street to lay out.
const NO_COURSE = { courseSeed: 0, blocksPerTurn: 1 };

/** The names on the roster who have not stepped out for the block on the line. */
const resolveNotOut = (view: BrawlMinigameHostView): string[] => {
  const out = new Set((view.blocks[view.blockIndex]?.crew ?? []).map((member) => member.player?.playerId));

  return view.roster.filter((figure) => !out.has(figure.playerId)).map((figure) => figure.name);
};

// The one line under the buttons, or nothing: who the host is waiting on, or that the room is
// waiting on the host. Nobody reads a sentence in a fight.
const resolveHint = (view: BrawlMinigameHostView, canAct: boolean, seat: MinigameSeat): string | null => {
  if (view.phase === "finished") {
    return seat === "host" ? hostBrawlSurfaceCopy.finishedHint : null;
  }

  if (view.phase === "running" || seat !== "host") {
    return null;
  }

  if (!canAct) {
    return hostBrawlSurfaceCopy.readyLockedHint;
  }

  return view.blockIndex === 0 ? hostBrawlSurfaceCopy.waitingOnHint(resolveNotOut(view)) : hostBrawlSurfaceCopy.nextBlockHint;
};

const resolveStartLabel = (view: BrawlMinigameHostView, seat: MinigameSeat): string => {
  if (seat !== "host") {
    return hostBrawlSurfaceCopy.startSoloButtonLabel;
  }

  return (view.blocks[view.blockIndex]?.crew.length ?? 0) > 0
    ? hostBrawlSurfaceCopy.startCrewButtonLabel
    : hostBrawlSurfaceCopy.startTabletButtonLabel;
};

// BRAWL's host surface, INTERIM (docs/minigames/brawl-crew-spec.md §0.6, §0.7, §0.10). At play it
// is a `<TakeoverCanvas>` whose body is the crew's street, drawn from the server's frame like the
// wall's. In a crew's fight the tablet is the host's monitor and nothing else: Start, Skip block,
// Reset turn. When the block is the tablet's own — a turn locked to the tablet, nobody stepped
// out, the teaser — the two thumbs are laid over the street and this screen plays the one hen.
//
// It renders no rail and no team chip of its own, and writes no z-index and no dock gutter; the
// layout owns all of it.
export const HostBrawlSurface = ({
  phase,
  minigameHostView,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin,
  seat,
  handset
}: MinigameHostRendererProps): JSX.Element => {
  const view = minigameHostView?.minigame === "BRAWL" ? minigameHostView : null;
  const shown = view === null ? null : resolveShownBlock(view);
  const { frame, layout } = useCrewFrame(shown, view ?? NO_COURSE);
  const { dispatchVerdict, isSettling: isVerdictSettling } = useVerdictDispatch(onDispatchAction);
  const canAct = canDispatchAction && view !== null;

  // Every hook above runs on both beats: the intro is a panel in the host's own control deck.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostBrawlSurfaceCopy.introDescription(handset)}</p>
      </div>
    );
  }

  const inHand = view?.blocks[view.blockIndex] ?? null;
  const isFinished = view?.phase === "finished";
  const isOnTheLine = inHand?.status === "ready";
  // This screen is the one playing: the block in hand is running and is the tablet's own.
  const isPlayingHere = canAct && inHand?.status === "running" && inHand.tablet;
  const hint = view === null ? null : resolveHint(view, canAct, seat);

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        view === null ? null : (
          <>
            <span className={styles.counter}>
              {hostBrawlSurfaceCopy.blockCounter(Math.min(view.blockIndex + 1, view.blocksPerTurn), view.blocksPerTurn)}
            </span>
            <span className={styles.counterTally}>
              <span className={styles.counterTallyValue} data-brawl-banked>
                {hostBrawlSurfaceCopy.tally(resolveLiveBanked(view, shown, frame?.banked ?? null), view.total)}
              </span>
              <span className={styles.counterLabel}>{hostBrawlSurfaceCopy.tallyLabel}</span>
            </span>
            {isOnTheLine && seat === "host" && (
              <span className={styles.counter} data-brawl-crew-out={inHand.crew.length}>
                {hostBrawlSurfaceCopy.crewCounter(inHand.crew.length, view.roster.length)}
              </span>
            )}
            {view.bestTurn !== null && (
              <span className={styles.counterBest} data-brawl-best>
                <span className={styles.counterTallyValue}>
                  {hostBrawlSurfaceCopy.bestTally(view.bestTurn.banked, view.bestTurn.total)}
                </span>
                <span className={styles.counterLabel}>{hostBrawlSurfaceCopy.bestLabel(view.bestTurn.teamName)}</span>
              </span>
            )}
          </>
        )
      }
      actions={
        view === null ? null : (
          <>
            {isOnTheLine && seat !== "contestant" && (
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!canAct}
                data-brawl-start
                onClick={(): void => {
                  onDispatchAction("startBlock", {});
                }}
              >
                {resolveStartLabel(view, seat)}
              </button>
            )}
            {/* The escape hatches stay on the canvas (AGENTS.md §11). Solo there is nobody to
                skip for. */}
            {seat === "host" && (
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={!canAct || isFinished || isVerdictSettling}
                onClick={(): void => {
                  dispatchVerdict("skipBlock", {});
                }}
              >
                {hostBrawlSurfaceCopy.skipBlockButtonLabel}
              </button>
            )}
            {seat !== "contestant" && (
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={!canAct}
                onClick={(): void => {
                  onDispatchAction("resetTurn", {});
                }}
              >
                {seat === "solo" ? hostBrawlSurfaceCopy.restartButtonLabel : hostBrawlSurfaceCopy.resetTurnButtonLabel}
              </button>
            )}
            {hint !== null && (
              <span className={styles.hint} data-brawl-hint>
                {hint}
              </span>
            )}
          </>
        )
      }
      readout={
        view === null || !isFinished ? null : (
          <>
            <div className={styles.finishCard} data-brawl-finish="finished">
              <p className={styles.finishTitle}>{hostBrawlSurfaceCopy.finishedTitle}</p>
              <span className={styles.finishPoints}>{hostBrawlSurfaceCopy.finishPoints(view.points ?? 0)}</span>
            </div>
            {seat !== "contestant" && (
              <RunningTotals
                pendingPointsByTeamId={view.pendingPointsByTeamId}
                activeTurnTeamId={view.activeTurnTeamId}
                teamNameByTeamId={teamNameByTeamId}
                note={hostBrawlSurfaceCopy.totalLine(view.total)}
              />
            )}
          </>
        )
      }
    >
      {view === null || shown === null || frame === null || layout === null ? (
        <p className={styles.waitingNote}>{hostBrawlSurfaceCopy.waitingStreetLabel}</p>
      ) : (
        <div className={styles.street} data-brawl-street-mode={isPlayingHere ? "pad" : "monitor"}>
          <CrewScene
            frame={frame}
            layout={layout}
            crew={shown.crew}
            activeTurnTeamId={view.activeTurnTeamId}
            serverOrigin={serverOrigin}
            label={hostBrawlSurfaceCopy.sceneLabel}
            fit="contain"
          />
          {isPlayingHere && (
            <CrewPad
              colour={resolveCrewSlotColour(0)}
              isLabelled={false}
              onWalk={(dir): void => {
                onDispatchAction("walk", { dir });
              }}
              onPeck={(held): void => {
                onDispatchAction("peck", { held });
              }}
            />
          )}
        </div>
      )}
    </TakeoverCanvas>
  );
};
