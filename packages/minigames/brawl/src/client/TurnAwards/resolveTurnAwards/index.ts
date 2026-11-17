import type { BrawlCrewHenStats, BrawlPlayerFigure } from "@wingnight/shared";

/** The three things the turn names people for (principles §11, 24): the crew's own numbers. */
export type TurnAwardKind = "geese" | "revives" | "carried";

export type TurnAward = {
  kind: TurnAwardKind;
  /** Whoever holds it, in roster order: more than one on a tie. */
  winners: BrawlPlayerFigure[];
  value: number;
};

const VALUE_OF: Record<TurnAwardKind, (stats: BrawlCrewHenStats) => number> = {
  geese: (stats) => stats.goons,
  revives: (stats) => stats.revives,
  carried: (stats) => stats.downs
};

const KINDS: readonly TurnAwardKind[] = ["geese", "revives", "carried"];

/**
 * The turn's results card, as who to name: most geese put down, most teammates got back up, and
 * most often carried (went down the most). An award nobody scored on is not given — a crew that
 * never went down has nobody to tease — and a tie names everyone in it, unless it is the whole
 * crew, which is nobody's award (a wipe carries all of them once). Only players who were on the
 * street are counted; the house hen is on no card. Pure.
 */
export const resolveTurnAwards = (
  turnStats: Readonly<Record<string, BrawlCrewHenStats>> | null,
  roster: readonly BrawlPlayerFigure[]
): TurnAward[] => {
  if (turnStats === null) {
    return [];
  }

  const played = roster.filter((figure) => turnStats[figure.playerId] !== undefined);

  return KINDS.flatMap((kind): TurnAward[] => {
    const valueOf = (figure: BrawlPlayerFigure): number => {
      const stats = turnStats[figure.playerId];

      return stats === undefined ? 0 : VALUE_OF[kind](stats);
    };
    const value = Math.max(0, ...played.map(valueOf));
    const winners = played.filter((figure) => valueOf(figure) === value);

    // Nobody scored, or the whole crew tied: there is nobody to single out.
    return value === 0 || (played.length > 1 && winners.length === played.length) ? [] : [{ kind, winners, value }];
  });
};
