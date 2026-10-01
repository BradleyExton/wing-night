import { forwardRef, useImperativeHandle, useRef } from "react";
import { CharacterFigure } from "@wingnight/cast";
import type { BrawlBlock } from "@wingnight/shared";
import { BRAWL_WORLD } from "@wingnight/shared";

import type { HenFigure } from "../../resolveHenFigure/index.js";
import type { BrawlRelay } from "../../useBrawlBlock/index.js";
import { HEN_FIGURE_TRANSFORM, resolveHenTransform } from "../henPose/index.js";
import { brawlNight } from "../palette.js";
import * as styles from "./styles.js";

/** Where the next teammate waits: a step past the chalk line, facing back at whoever is coming. */
export const NEXT_MATE_PAST_HANDOFF = 18;
/**
 * Where the teammate who brought the street here stands: behind the start line and a step back up
 * the sidewalk, a little smaller for it — watching, not in the new hen's way.
 */
export const LAST_MATE_X = BRAWL_WORLD.henStartX - 14;
const LAST_MATE_BACK = 6;
const LAST_MATE_SHRINK = 0.86;
/** The name hangs this far over the ground. */
const TAG_RISE = 27;

export type RelayMatesRefs = {
  /** The waiting teammate's figure group, which the handoff beat turns to face the street. */
  next: SVGGElement | null;
};

/** The waiting teammate's figure, turned: `-1` back at the hen coming in, `1` down the street. */
export const placeMate = (element: SVGGElement | null, x: number, facing: -1 | 1): void => {
  element?.setAttribute("transform", resolveHenTransform({ x, facing }));
};

type RelayMateProps = { figure: HenFigure; x: number; facing: -1 | 1; role: "next" | "last"; depth?: string };

const RelayMate = forwardRef<SVGGElement, RelayMateProps>(
  ({ figure, x, facing, role, depth }, ref): JSX.Element => (
    <g className={figure.fillClassName} data-brawl-relay-mate={role} transform={depth} aria-hidden="true">
      <ellipse cx={x} cy={BRAWL_WORLD.groundY + 0.4} rx={6} ry={1.2} fill={brawlNight.shadow} />
      <g ref={ref} transform={resolveHenTransform({ x, facing })}>
        <g transform={HEN_FIGURE_TRANSFORM}>
          <CharacterFigure appearance={figure.appearance} apparel={figure.apparel} silhouette={figure.silhouette} pose="idle" />
        </g>
      </g>
      <text className={styles.tag} x={x} y={BRAWL_WORLD.groundY - TAG_RISE} textAnchor="middle">
        {figure.playerName ?? ""}
      </text>
    </g>
  )
);

RelayMate.displayName = "RelayMate";

/**
 * The relay on the street: the next teammate waiting just past the chalk line, turned to face the
 * hen coming in, and the teammate who brought it here stood behind the start line — so a handoff
 * is two teammates on one spot, not a cut to an empty street (SCHLONIC's `RelayMates`).
 */
export const RelayMates = forwardRef<RelayMatesRefs, { block: BrawlBlock; relay: BrawlRelay }>(
  ({ block, relay }, ref): JSX.Element => {
    const next = useRef<SVGGElement>(null);

    useImperativeHandle(ref, () => ({ next: next.current }));

    return (
      <g data-brawl-relay-mates>
        {relay.last !== null && (
          <RelayMate
            figure={relay.last}
            x={LAST_MATE_X}
            facing={1}
            role="last"
            depth={`translate(${LAST_MATE_X} ${BRAWL_WORLD.groundY - LAST_MATE_BACK}) scale(${LAST_MATE_SHRINK}) translate(${-LAST_MATE_X} ${-BRAWL_WORLD.groundY})`}
          />
        )}
        {relay.next !== null && (
          <RelayMate
            ref={next}
            figure={relay.next}
            x={block.handoffX + NEXT_MATE_PAST_HANDOFF}
            facing={-1}
            role="next"
          />
        )}
      </g>
    );
  }
);

RelayMates.displayName = "RelayMates";
