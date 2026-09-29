import { forwardRef, useImperativeHandle, useRef } from "react";
import { CharacterFigure } from "@wingnight/cast";

import type { RunnerFigure } from "../../resolveRunnerFigure/index.js";
import type { RiderPlacement } from "../riderPlacement/index.js";
import { Skateboard, type SkateboardHandle } from "../Skateboard/index.js";
import { Sparks, paintSparks } from "../Sparks/index.js";

export type RiderRefs = {
  /** The hen's group: where the rider is and how it is turned. The runner's carries the test seam. */
  hen: SVGGElement | null;
  /** Inside it, the figure stood on the board and tucked. */
  stance: SVGGElement | null;
  /** The board's own group — its own, because in a bail it leaves the hen behind. */
  board: SVGGElement | null;
  skateboard: SkateboardHandle | null;
  sparks: SVGGElement | null;
};

/** The hen's group, placed: where, how tucked, how solid. */
export const placeRiderHen = (refs: RiderRefs | null, hen: string, stance: string, opacity: number): void => {
  refs?.hen?.setAttribute("transform", hen);
  refs?.hen?.setAttribute("opacity", `${opacity}`);
  refs?.stance?.setAttribute("transform", stance);
};

/** The board's group, placed on its own: under the feet, loose on the street, or gone. */
export const placeRiderBoard = (refs: RiderRefs | null, board: string, roll: number, opacity: number): void => {
  refs?.board?.setAttribute("transform", board);
  refs?.board?.setAttribute("opacity", `${opacity}`);
  refs?.skateboard?.roll(roll);
};

/** One frame of the rider, as `resolveRiderPlacement` placed it. */
export const paintRider = (
  refs: RiderRefs | null,
  placement: RiderPlacement,
  opacity: { hen: number; board: number }
): void => {
  placeRiderHen(refs, placement.hen, placement.stance, opacity.hen);
  placeRiderBoard(refs, placement.board, placement.boardRoll, opacity.board);
  paintSparks(refs?.sparks ?? null, placement.sparks);
};

type RiderProps = {
  figure: RunnerFigure;
  /** The live runner carries `data-schlonic-runner`, the harness's handle on it; the ghost does not. */
  isRunner: boolean;
};

/**
 * The player's own hen on a skateboard (DESIGN.md §2.11): the cast figure in its `ride` pose and
 * the board under its feet, each in a group of its own so the board can flip under the hen and
 * leave it behind in a bail, and the grind's sparks over both. The board comes first, so the
 * hen's soles stand on the deck rather than under it. Placed every frame through the refs by
 * `paintRider`; nothing here is React-driven per frame.
 */
export const Rider = forwardRef<RiderRefs, RiderProps>(({ figure, isRunner }, ref): JSX.Element => {
  const hen = useRef<SVGGElement>(null);
  const stance = useRef<SVGGElement>(null);
  const board = useRef<SVGGElement>(null);
  const skateboard = useRef<SkateboardHandle>(null);
  const sparks = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    hen: hen.current,
    stance: stance.current,
    board: board.current,
    skateboard: skateboard.current,
    sparks: sparks.current
  }));

  return (
    <g>
      <g ref={board} className={figure.fillClassName} data-schlonic-board>
        <Skateboard ref={skateboard} />
      </g>
      <g ref={hen} className={figure.fillClassName} data-schlonic-runner={isRunner ? "" : undefined}>
        <g ref={stance}>
          <CharacterFigure
            appearance={figure.appearance}
            apparel={figure.apparel}
            silhouette={figure.silhouette}
            pose="ride"
          />
        </g>
      </g>
      <Sparks ref={sparks} />
    </g>
  );
});

Rider.displayName = "Rider";
