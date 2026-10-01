import { useRef, useState, type PointerEvent, type RefObject } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { BrawlMinigameHostView } from "@wingnight/shared";

import { BrawlScene, type BrawlSceneHandle } from "../../BrawlScene/index.js";
import { resolveGoonsBanked } from "../../goonsTally/index.js";
import type { BrawlMirrorEventHandler } from "../../mirrorEvents/index.js";
import { useBrawlBlock } from "../../useBrawlBlock/index.js";
import { useBrawlRunner, type BrawlWalkDir } from "../../useBrawlRunner/index.js";
import type { BlockHold } from "../../useHeldBlock/index.js";
import { useHenFigure } from "../../useHenFigure/index.js";
import { streetCopy } from "./copy.js";
import * as styles from "./styles.js";

type StreetProps = {
  view: BrawlMinigameHostView;
  canAct: boolean;
  serverOrigin: string | null;
  onDispatchAction: MinigameHostRendererProps["onDispatchAction"];
  hold: BlockHold | null;
  /** The block to draw: the one in hand, or the one just ended while its beat plays. */
  blockIndex: number;
  /** The chrome's heart glyphs and worth-down tally, which the paint loop writes into. */
  heartsRef: RefObject<HTMLElement>;
  tallyRef: RefObject<HTMLElement>;
  /** The block's sound events, for a street that is its own speaker; absent on the night. */
  onRunnerEvent?: BrawlMirrorEventHandler;
};

const HandoffCallout = ({ nextName }: { nextName: string | null }): JSX.Element => (
  <div className={styles.handoffOverlay} data-brawl-handoff-callout="host">
    <span className={styles.handoffLead}>{streetCopy.handoffCalloutLead}</span>
    <span className={styles.handoffName}>{streetCopy.handoffCalloutName(nextName)}</span>
  </div>
);

/** Which way a thumb on the walk pad walks: the side of the pad's centre it is on. */
const resolvePadDir = (event: PointerEvent<HTMLDivElement>): BrawlWalkDir => {
  const rect = event.currentTarget.getBoundingClientRect();

  return event.clientX < rect.left + rect.width / 2 ? -1 : 1;
};

// The street and the loop behind it, filling the takeover's body slot edge to edge, with the two
// thumb zones over it (docs/minigames/brawl-spec.md §0.6). Each zone tracks its own pointer by
// id, so a held walk and a tapped peck land together. The scene is keyed on the block it shows,
// so a new block's street slides in fresh.
export const Street = ({
  view,
  canAct,
  serverOrigin,
  onDispatchAction,
  hold,
  blockIndex,
  heartsRef,
  tallyRef,
  onRunnerEvent
}: StreetProps): JSX.Element => {
  const sceneRef = useRef<BrawlSceneHandle>(null);
  const walkPointerRef = useRef<number | null>(null);
  const [touchedBlock, setTouchedBlock] = useState<number | null>(null);
  const viewBlock = view.blocks[blockIndex] ?? null;
  const { block, relay } = useBrawlBlock({ view, blockIndex, serverOrigin });
  const hen = useHenFigure({ figure: viewBlock?.player ?? null, activeTurnTeamId: view.activeTurnTeamId, serverOrigin });
  const isLive = view.phase === "ready" || view.phase === "running";
  const isArmed = canAct && isLive && hold === null;
  const { walk, peck } = useBrawlRunner({
    viewBlock,
    block,
    canAct: isArmed,
    sceneRef,
    heartsRef,
    tallyRef,
    goonsBanked: resolveGoonsBanked(view.blocks, blockIndex),
    goonsTotal: view.goonsTotal,
    onWalk: (tick, dir): void => {
      onDispatchAction("walk", { tick, dir });
    },
    onPeck: (tick): void => {
      onDispatchAction("peck", { tick });
    },
    onEndBlock: (): void => {
      onDispatchAction("endBlock", {});
    },
    onEvent: onRunnerEvent
  });
  const glyphState = touchedBlock === blockIndex ? ` ${styles.faded}` : "";

  const markTouched = (): void => {
    if (isArmed && touchedBlock !== blockIndex) {
      setTouchedBlock(blockIndex);
    }
  };

  const onWalkDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    walkPointerRef.current = event.pointerId;
    try {
      // Held across the pad's edge: the thumb keeps walking until it lifts.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser is not tracking (a synthetic one) has nothing to capture.
    }
    markTouched();
    walk(resolvePadDir(event));
  };

  const onWalkMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (walkPointerRef.current === event.pointerId) {
      walk(resolvePadDir(event));
    }
  };

  const onWalkUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (walkPointerRef.current === event.pointerId) {
      walkPointerRef.current = null;
      walk(0);
    }
  };

  return (
    <div className={`${styles.container}${isArmed ? "" : ` ${styles.containerLocked}`}`} data-brawl-arena>
      <div key={blockIndex} className={styles.blockEnter}>
        <BrawlScene
          ref={sceneRef}
          block={block}
          hen={hen}
          sceneId="host-brawl"
          label={streetCopy.sceneLabel(hen.playerName)}
          relay={relay}
        />
      </div>
      <div
        className={styles.walkPad}
        data-brawl-walk-pad
        onPointerDown={onWalkDown}
        onPointerMove={onWalkMove}
        onPointerUp={onWalkUp}
        onPointerCancel={onWalkUp}
        onPointerLeave={onWalkUp}
        onLostPointerCapture={onWalkUp}
      >
        <span className={`${styles.walkGlyph}${glyphState}`}>{streetCopy.walkLeft}</span>
        <span className={`${styles.walkGlyph}${glyphState}`}>{streetCopy.walkRight}</span>
      </div>
      <div
        className={styles.peckZone}
        data-brawl-peck-zone
        onPointerDown={(event): void => {
          event.preventDefault();
          markTouched();
          peck();
        }}
      >
        <span className={`${styles.peckRing}${glyphState}`}>{streetCopy.peck}</span>
      </div>
      {hold?.kind === "handoff" && <HandoffCallout nextName={view.blocks[blockIndex + 1]?.player?.name ?? null} />}
    </div>
  );
};
