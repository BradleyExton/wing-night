import { useRef, useState, type RefObject } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { BrawlMinigameHostView } from "@wingnight/shared";

import { BrawlScene, type BrawlSceneHandle } from "../../BrawlScene/index.js";
import { resolveGoonsBanked } from "../../goonsTally/index.js";
import type { BrawlMirrorEventHandler } from "../../mirrorEvents/index.js";
import { useBrawlBlock } from "../../useBrawlBlock/index.js";
import { useBrawlRunner } from "../../useBrawlRunner/index.js";
import type { BlockHold } from "../../useHeldBlock/index.js";
import { useHenFigure } from "../../useHenFigure/index.js";
import { PeckZone } from "./PeckZone/index.js";
import { WalkPad } from "./WalkPad/index.js";
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

// The street and the loop behind it, filling the takeover's body slot edge to edge, with the two
// thumb zones over it (docs/minigames/brawl-spec.md §0.6): the left half walks, the right half
// pecks. Each zone tracks its own pointers by id, so a held walk and a tapped peck land together.
// The scene is keyed on the block it shows, so a new block's street slides in fresh.
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
  const [touchedBlock, setTouchedBlock] = useState<number | null>(null);
  const viewBlock = view.blocks[blockIndex] ?? null;
  const { block, relay } = useBrawlBlock({ view, blockIndex, serverOrigin });
  const hen = useHenFigure({ figure: viewBlock?.player ?? null, activeTurnTeamId: view.activeTurnTeamId, serverOrigin });
  const isLive = view.phase === "ready" || view.phase === "running";
  const isArmed = canAct && isLive && hold === null;
  const { walk, peck, getFacing } = useBrawlRunner({
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
  const isGlyphFaded = touchedBlock === blockIndex;

  const markTouched = (): void => {
    if (isArmed && touchedBlock !== blockIndex) {
      setTouchedBlock(blockIndex);
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
      <WalkPad isArmed={isArmed} isGlyphFaded={isGlyphFaded} walk={walk} getFacing={getFacing} onTouch={markTouched} />
      <PeckZone isArmed={isArmed} isGlyphFaded={isGlyphFaded} peck={peck} onTouch={markTouched} />
      {hold?.kind === "handoff" && <HandoffCallout nextName={view.blocks[blockIndex + 1]?.player?.name ?? null} />}
    </div>
  );
};
