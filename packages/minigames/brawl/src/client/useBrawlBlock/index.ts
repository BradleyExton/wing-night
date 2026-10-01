import { useMemo } from "react";
import type { BrawlBlock, BrawlPlayerFigure } from "@wingnight/shared";
import { resolveBrawlBlock } from "@wingnight/shared";

import type { HenFigure } from "../resolveHenFigure/index.js";
import { useHenFigure } from "../useHenFigure/index.js";

/** The teammates either side of a block in the relay: who brought it here, and who takes it on. */
export type BrawlRelay = {
  last: HenFigure | null;
  next: HenFigure | null;
};

type BlockView = {
  activeTurnTeamId: string | null;
  courseSeed: number;
  blocksPerTurn: number;
  blocks: readonly { player: BrawlPlayerFigure | null }[];
};

/** The block a view describes, laid out from its seed: block `n` of the course. Pure. */
export const resolveViewBlock = (view: Pick<BlockView, "courseSeed" | "blocksPerTurn">, blockIndex: number): BrawlBlock => {
  return resolveBrawlBlock({ seed: view.courseSeed, blocks: view.blocksPerTurn, block: blockIndex });
};

/**
 * The block a surface is showing, and the relay either side of it — the teammate who brought the
 * team to its start line and the one waiting at its handoff, as figures the scene stands on the
 * street. Both surfaces read it off the same view, so the tablet and the wall lay out the same
 * block and wait the same teammate at the same line. The block is memoised on the three numbers
 * that pick it, and the figures by `useHenFigure`, so the scene only changes when the block or a
 * player does.
 */
export const useBrawlBlock = ({
  view,
  blockIndex,
  serverOrigin
}: {
  view: BlockView;
  blockIndex: number;
  serverOrigin: string | null;
}): { block: BrawlBlock; relay: BrawlRelay } => {
  const { courseSeed, blocksPerTurn } = view;
  const block = useMemo(() => {
    return resolveViewBlock({ courseSeed, blocksPerTurn }, blockIndex);
  }, [courseSeed, blocksPerTurn, blockIndex]);
  const lastBlock = blockIndex > 0 ? (view.blocks[blockIndex - 1] ?? null) : null;
  const nextBlock = blockIndex < blocksPerTurn - 1 ? (view.blocks[blockIndex + 1] ?? null) : null;
  const last = useHenFigure({
    figure: lastBlock?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  const next = useHenFigure({
    figure: nextBlock?.player ?? null,
    activeTurnTeamId: view.activeTurnTeamId,
    serverOrigin
  });
  const hasLast = lastBlock !== null;
  const hasNext = nextBlock !== null;
  const relay = useMemo<BrawlRelay>(() => {
    return { last: hasLast ? last : null, next: hasNext ? next : null };
  }, [hasLast, last, hasNext, next]);

  return { block, relay };
};
