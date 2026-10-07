import { useRef } from "react";
import { isSpeakerSeat, type MinigameHostRendererProps, type MinigameSeat } from "@wingnight/minigames-core";
import type { BrawlMinigameHostView } from "@wingnight/shared";
import { resolveBrawlStartHearts } from "@wingnight/shared";
import { RunningTotals, TakeoverCanvas, useVerdictDispatch } from "@wingnight/surface";

import { HeartRow } from "../HeartRow/index.js";
import { useBrawlSounds } from "../useBrawlSounds/index.js";
import { useHeldBlock, type BlockHold } from "../useHeldBlock/index.js";
import { useSoloBeatSounds } from "../useSoloBeatSounds/index.js";
import { BlockHistory } from "./BlockHistory/index.js";
import { Street } from "./Street/index.js";
import { hostBrawlSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Before the view arrives there is no block to hold, and nothing yet to be through.
const EMPTY_BLOCK_VIEW = { blockIndex: 0, blocksPerTurn: 1, blocks: [] };

const currentPlayerName = (view: BrawlMinigameHostView): string | null => {
  return view.blocks[Math.min(view.blockIndex, view.blocksPerTurn - 1)]?.player?.name ?? null;
};

// The one line under the buttons, or nothing. A brawling hen's holder is not reading, and the
// handoff is announced by the callout over the street, so neither beat gets a sentence here.
const resolveHint = (view: BrawlMinigameHostView, canAct: boolean, hold: BlockHold | null, seat: MinigameSeat): string | null => {
  if (hold !== null) {
    return null;
  }

  // Only the host advances the phase. Solo, whoever is playing says what happens next; on a
  // contestant's phone the host is the one who moves the room on.
  if (view.phase === "finished") {
    return seat === "host" ? hostBrawlSurfaceCopy.finishedHint : null;
  }

  if (view.phase === "running") {
    return null;
  }

  return canAct ? hostBrawlSurfaceCopy.readyHint(currentPlayerName(view)) : hostBrawlSurfaceCopy.readyLockedHint;
};

// BRAWL's host surface (docs/minigames/brawl-spec.md §0.6). At play it is a `<TakeoverCanvas>`
// (docs/takeover-layout-api.md §3, §5): the street is evenly spread scenery, so a chip in one
// corner costs a corner of Barrie rather than a word. Its chrome is the slots §5 names and no
// more: the block, whose it is, the hearts, the worth down and the number to beat in `counter`;
// the escape hatches and the one hint in `actions`; and the block list and running totals in
// `readout` — only while a block's ending is on screen or once the team is through, because the
// right of the street is where goons walk in from.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with the shell's
// `<HostMiniRail />` — and it writes no z-index, no `isolate` and no dock gutter; the layout owns
// all three. The body is the street with its two thumb zones (`Street/`).
export const HostBrawlSurface = ({
  phase,
  minigameHostView,
  teamNameByTeamId,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin,
  seat
}: MinigameHostRendererProps): JSX.Element => {
  const brawlView = minigameHostView?.minigame === "BRAWL" ? minigameHostView : null;
  const canAct = canDispatchAction && brawlView !== null;
  const isLive = brawlView !== null && (brawlView.phase === "ready" || brawlView.phase === "running");
  const isFinished = brawlView?.phase === "finished";
  // The street lingers on the block just ended while its beat plays; the chrome row is already on
  // the next one, which is the block the room is asking about.
  const { shownBlockIndex, hold } = useHeldBlock(brawlView ?? EMPTY_BLOCK_VIEW);
  // On the night the TV is the speaker and the tablet — or the contestant's phone — is quiet.
  // Solo, the phone is the room, so it plays the TV's soundboard off its own run, and rings each
  // beat as the hold opens.
  const isSpeaker = isSpeakerSeat(seat);
  const { onMirrorEvent } = useBrawlSounds({ serverOrigin, isSpeaker });

  useSoloBeatSounds(hold, isSpeaker ? onMirrorEvent : undefined);
  // Written by the runner's paint loop, sixty times a second: the hearts left and the worth down.
  const heartsRef = useRef<HTMLSpanElement>(null);
  const tallyRef = useRef<HTMLSpanElement>(null);
  const hint = brawlView === null ? null : resolveHint(brawlView, canAct, hold, seat);
  const playerName = brawlView === null || isFinished ? null : currentPlayerName(brawlView);
  // One glyph per heart the street on screen starts with: four on a block bought at the handoff.
  const heartsMax = resolveBrawlStartHearts(brawlView?.blocks[shownBlockIndex]?.heartBought ?? false);
  // The block list and the round's totals come out only when there is something to read off them
  // and nothing to dodge under them.
  const showsReadout = brawlView !== null && (hold !== null || isFinished);
  const { dispatchVerdict, isSettling: isVerdictSettling } = useVerdictDispatch(onDispatchAction);

  // Every hook above runs on both beats: the intro is a panel in the host's own control deck
  // rather than a takeover — `rail` and `clock` are both null on it — so it gets the briefing.
  if (phase !== "play") {
    return (
      <div className={styles.introRoot}>
        <p className={styles.introCard}>{hostBrawlSurfaceCopy.introDescription}</p>
      </div>
    );
  }

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        brawlView === null ? null : (
          <>
            <span className={styles.counter}>
              <span>
                {hostBrawlSurfaceCopy.blockCounter(
                  Math.min(brawlView.blockIndex + 1, brawlView.blocksPerTurn),
                  brawlView.blocksPerTurn
                )}
              </span>
              {playerName !== null && (
                <span className={styles.counterName} data-brawl-block-name>
                  {playerName}
                </span>
              )}
            </span>
            {!isFinished && (
              <span className={styles.counterHearts}>
                <HeartRow max={heartsMax} rowRef={heartsRef} tone="chrome" />
                <span className={styles.heartsLabel}>{hostBrawlSurfaceCopy.heartsLabel}</span>
              </span>
            )}
            <span className={styles.counterGoons}>
              <span ref={tallyRef} className={styles.counterGoonsTally} data-brawl-goons>
                {hostBrawlSurfaceCopy.goonsTally(brawlView.goonsDown, brawlView.goonsTotal)}
              </span>
              <span className={styles.counterLabel}>{hostBrawlSurfaceCopy.goonsLabel}</span>
            </span>
            {brawlView.bestTurn !== null && (
              <span className={styles.counterBest} data-brawl-best>
                <span className={styles.counterBestGoons}>
                  {hostBrawlSurfaceCopy.bestGoons(brawlView.bestTurn.goons)}
                </span>
                <span className={styles.counterLabel}>{hostBrawlSurfaceCopy.bestLabel(brawlView.bestTurn.teamName)}</span>
              </span>
            )}
          </>
        )
      }
      actions={
        brawlView === null ? null : (
          <>
            {/* The escape hatches stay on the canvas: skipping a block and resetting the turn are
                the host's ordinary moves here (AGENTS.md §11). Solo there is nobody to skip for; a
                contestant's phone has no hatches at all — the host keeps them on the tablet. */}
            {seat === "host" && (
              <button
                className={styles.secondaryButton}
                type="button"
                // Not during the handoff: the street still shows the block just ended, and a tap
                // there would skip the NEXT player's block before they had the tablet.
                disabled={!canAct || !isLive || hold !== null || isVerdictSettling}
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
        !showsReadout ? null : (
          <>
            {isFinished && (
              <div className={styles.finishCard} data-brawl-finish="finished">
                <p className={styles.finishTitle}>{hostBrawlSurfaceCopy.finishedTitle}</p>
                <span className={styles.finishPoints}>{hostBrawlSurfaceCopy.finishPoints(brawlView.points ?? 0)}</span>
              </div>
            )}
            <BlockHistory blocks={brawlView.blocks} activeBlockIndex={brawlView.blockIndex} />
            {/* The contestant's phone is for brawling, not for reading the table. */}
            {isFinished && seat !== "contestant" && (
              <RunningTotals
                pendingPointsByTeamId={brawlView.pendingPointsByTeamId}
                activeTurnTeamId={brawlView.activeTurnTeamId}
                teamNameByTeamId={teamNameByTeamId}
                note={hostBrawlSurfaceCopy.totalLine(brawlView.goonsTotal)}
              />
            )}
          </>
        )
      }
    >
      {brawlView === null ? (
        <p className={styles.waitingNote}>{hostBrawlSurfaceCopy.waitingStreetLabel}</p>
      ) : (
        <Street
          view={brawlView}
          canAct={canAct}
          serverOrigin={serverOrigin}
          onDispatchAction={onDispatchAction}
          hold={hold}
          blockIndex={shownBlockIndex}
          heartsRef={heartsRef}
          tallyRef={tallyRef}
          onRunnerEvent={isSpeaker ? onMirrorEvent : undefined}
        />
      )}
    </TakeoverCanvas>
  );
};
