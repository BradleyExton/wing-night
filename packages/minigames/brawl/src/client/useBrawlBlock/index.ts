import { useMemo } from "react";
import type { BrawlBlock, BrawlCourse, BrawlPlayerFigure } from "@wingnight/shared";
import { resolveBrawlBlock, resolveBrawlStartHearts } from "@wingnight/shared";

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
  blocks: readonly { player: BrawlPlayerFigure | null; heartBought: boolean }[];
};

/**
 * The course that picks block `n` of a view, as the referee reads it: the seed, the course's
 * length, the block, and the hearts it starts on — three, or four if the team bought one at the
 * handoff. The tablet's runner, the TV's mirror and the server's `endBlock` all start from it. Pure.
 */
export const resolveViewCourse = (
  view: Pick<BlockView, "courseSeed" | "blocksPerTurn">,
  blockIndex: number,
  heartBought: boolean
): Required<BrawlCourse> => {
  return {
    seed: view.courseSeed,
    blocks: view.blocksPerTurn,
    block: blockIndex,
    hearts: resolveBrawlStartHearts(heartBought)
  };
};

/** The block a view describes, laid out from its seed (`resolveViewCourse`). Pure. */
export const resolveViewBlock = (
  view: Pick<BlockView, "courseSeed" | "blocksPerTurn">,
  blockIndex: number,
  heartBought: boolean
): BrawlBlock => {
  return resolveBrawlBlock(resolveViewCourse(view, blockIndex, heartBought));
};

/**
 * The block a surface is showing, and the relay either side of it — the teammate who brought the
 * team to its start line and the one waiting at its handoff, as figures the scene stands on the
 * street. Both surfaces read it off the same view, so the tablet and the wall lay out the same
 * block and wait the same teammate at the same line. The block is memoised on the three numbers
 * that pick it, and the figures by `useHenFigure`, so the scene only changes when the block or a
 * player does. The hearts follow the view's `heartBought`, so a heart bought at the handoff
 * starts the tablet's runner and the TV's mirror on four, as the referee does.
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
  const heartBought = view.blocks[blockIndex]?.heartBought ?? false;
  const block = useMemo(() => {
    return resolveViewBlock({ courseSeed, blocksPerTurn }, blockIndex, heartBought);
  }, [courseSeed, blocksPerTurn, blockIndex, heartBought]);
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
