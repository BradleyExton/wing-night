import type { MinigameHostRendererProps, MinigameSeat } from "@wingnight/minigames-core";
import { CrewPad, resolveCrewSlotColour } from "@wingnight/minigames-brawl/client";
import type { BordenMinigameHostView } from "@wingnight/shared";
import { TakeoverCanvas, useVerdictDispatch } from "@wingnight/surface";

import { BordenScene } from "../BordenScene/index.js";
import { resolveLiveBanked, resolveShownStretch } from "../shownStretch/index.js";
import { useBaseValue, useBordenFrame } from "../useBordenFrame/index.js";
import { useBordenSounds } from "../useBordenSounds/index.js";
import { hostBordenSurfaceCopy as copy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no base to lay out.
const NO_COURSE = { courseSeed: 0 };

const resolveHint = (view: BordenMinigameHostView, canAct: boolean, seat: MinigameSeat): string | null => {
  if (view.phase === "finished") {
    return seat === "host" ? copy.finishedHint : null;
  }

  if (view.phase === "running" || seat !== "host") {
    return null;
  }

  if (!canAct) {
    return copy.readyLockedHint;
  }

  return view.stretchIndex === 0 ? copy.waitingOnHint(view.crew.length) : copy.nextStretchHint;
};

const resolveStartLabel = (view: BordenMinigameHostView, seat: MinigameSeat): string => {
  if (seat !== "host") {
    return copy.startSoloButtonLabel;
  }

  return view.crew.length > 0 && !view.tablet ? copy.startCrewButtonLabel : copy.startTabletButtonLabel;
};

// Base Borden's host surface (docs/minigames/base-borden-spec.md §0.9). At play it is a
// `<TakeoverCanvas>` whose body is the base, drawn from the server's frame like the wall's and
// silent beside it: Start, Skip stretch, Reset turn. When the stretch is the tablet's own (nobody
// stepped out, the sandbox) the two thumbs are laid over the base and this screen plays the hen.
export const HostBordenSurface = ({
  phase,
  minigameHostView,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin,
  seat,
  handset
}: MinigameHostRendererProps): JSX.Element => {
  const view = minigameHostView?.minigame === "BORDEN" ? minigameHostView : null;
  const shown = view === null ? null : resolveShownStretch(view);
  const { base, layout } = useBordenFrame(shown, view ?? NO_COURSE);
  const drawnBanked = useBaseValue(base, (frame) => frame?.banked ?? null);
  const { dispatchVerdict, isSettling } = useVerdictDispatch(onDispatchAction);
  const canAct = canDispatchAction && view !== null;

  // The TV is the room's speaker. This screen only sounds when it is the whole game.
  useBordenSounds({ base, isSpeaker: seat === "solo", ownSlot: view?.tablet === true ? 0 : null });

  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{copy.introDescription(handset)}</p>
      </div>
    );
  }

  const inHand = view?.stretches[view.stretchIndex] ?? null;
  const isFinished = view?.phase === "finished";
  const isOnTheLine = inHand?.status === "ready";
  const isPlayingHere = canAct && inHand?.status === "running" && view.tablet;
  const hint = view === null ? null : resolveHint(view, canAct, seat);

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        view === null ? null : (
          <>
            <span className={styles.counter}>
              {copy.stretchCounter(Math.min(view.stretchIndex + 1, view.stretchesPerTurn), view.stretchesPerTurn)}
            </span>
            <span className={styles.counterTally}>
              <span className={styles.counterTallyValue} data-borden-banked>
                {copy.tally(resolveLiveBanked(view, shown, drawnBanked), view.total)}
              </span>
              <span className={styles.counterLabel}>{copy.tallyLabel}</span>
            </span>
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
                data-borden-start
                onClick={(): void => {
                  onDispatchAction("startStretch", {});
                }}
              >
                {resolveStartLabel(view, seat)}
              </button>
            )}
            {seat === "host" && (
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={!canAct || isFinished || isSettling}
                onClick={(): void => {
                  dispatchVerdict("skipStretch", {});
                }}
              >
                {copy.skipStretchButtonLabel}
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
                {seat === "solo" ? copy.restartButtonLabel : copy.resetTurnButtonLabel}
              </button>
            )}
            {hint !== null && (
              <span className={styles.hint} data-borden-hint>
                {hint}
              </span>
            )}
          </>
        )
      }
      readout={
        view === null || !isFinished ? null : (
          <div className={styles.finishCard} data-borden-finish="finished">
            <p className={styles.finishTitle}>{copy.finishedTitle}</p>
            <span className={styles.finishPoints}>{copy.finishPoints(view.points ?? 0)}</span>
          </div>
        )
      }
    >
      {view === null || shown === null || layout === null ? (
        <p className={styles.waitingNote}>{copy.waitingBaseLabel}</p>
      ) : (
        <div className={styles.base} data-borden-base-mode={isPlayingHere ? "pad" : "monitor"}>
          <BordenScene
            base={base}
            layout={layout}
            crew={view.crew}
            pair={shown.pair}
            activeTurnTeamId={view.activeTurnTeamId}
            serverOrigin={serverOrigin}
            ownSlot={view.tablet ? 0 : null}
            label={copy.sceneLabel}
          />
          {isPlayingHere && (
            <CrewPad
              colour={resolveCrewSlotColour(shown.pair[0] ?? 0)}
              isLabelled={false}
              onWalk={(dir): void => {
                onDispatchAction("stick", { dir });
              }}
              onPeck={(held): void => {
                if (held) {
                  onDispatchAction("jump", {});
                }
              }}
            />
          )}
        </div>
      )}
    </TakeoverCanvas>
  );
};
