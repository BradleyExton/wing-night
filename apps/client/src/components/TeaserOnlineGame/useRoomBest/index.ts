import { useEffect, useState } from "react";
import type { TeaserRoomGame } from "@wingnight/shared";

import { useTeaserGameMemory } from "../../TeaserSoloGame/useTeaserGameMemory";

/**
 * This phone's best game in a room's game, as the solo pages keep theirs: kept in the browser,
 * raised when a game ends better, and null until one has. `finishedPoints` is the game just
 * finished, or null while none is.
 */
export const useRoomBest = (game: TeaserRoomGame, finishedPoints: number | null): number | null => {
  const { load, save } = useTeaserGameMemory(`online-${game.toLowerCase()}`);
  const [best, setBest] = useState<number | null>(() => load().best);

  useEffect(() => {
    if (finishedPoints === null) {
      return;
    }

    const record = load();

    if (record.best === null || finishedPoints > record.best) {
      save({ ...record, best: finishedPoints });
    }

    setBest((held) => (held === null ? finishedPoints : Math.max(held, finishedPoints)));
  }, [finishedPoints, load, save]);

  return best;
};
