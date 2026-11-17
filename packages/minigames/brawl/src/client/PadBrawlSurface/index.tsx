import type { MinigamePadRendererProps } from "@wingnight/minigames-core";

import { CrewPad } from "../CrewPad/index.js";
import { resolveCrewSlotColour } from "../CrewScene/palette.js";
import { padBrawlSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

/**
 * A crew player's phone (docs/minigames/brawl-crew-spec.md §0.6): a gamepad and nothing else,
 * because her eyes are on the TV. Before she is on the street it is one button, STEP OUT. Then it
 * is the two thumbs, under a strip of her slot's colour with her hearts on it. Down, the thumbs
 * are still there under a veil that says the one thing she can do: shout.
 */
export const PadBrawlSurface = ({ pad, status, canDispatchAction, onDispatchAction }: MinigamePadRendererProps): JSX.Element => {
  const colour = resolveCrewSlotColour(pad.slot);

  if (pad.state === "out") {
    return (
      <div className={styles.root} data-brawl-pad-state="out">
        <div className={styles.card}>
          {status === "ready" ? (
            <>
              <button
                className={styles.stepOutButton}
                type="button"
                disabled={!canDispatchAction}
                data-brawl-step-out
                onClick={(): void => {
                  onDispatchAction("stepOut", {});
                }}
              >
                {padBrawlSurfaceCopy.stepOut}
              </button>
              <p className={styles.line}>{padBrawlSurfaceCopy.stepOutHint}</p>
            </>
          ) : (
            <p className={styles.line}>{padBrawlSurfaceCopy.out}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} data-brawl-pad-state={pad.state} data-brawl-pad-slot={pad.slot ?? ""}>
      <CrewPad
        colour={colour}
        isLabelled
        onWalk={(dir): void => {
          onDispatchAction("walk", { dir });
        }}
        onPeck={(held): void => {
          onDispatchAction("peck", { held });
        }}
      />
      <svg className={styles.header} width="100%" height={40} aria-hidden>
        <rect width="100%" height={40} fill={colour} opacity={0.92} />
        <text className={styles.headerText} x={14} y={20} dominantBaseline="central">
          {pad.slot === null ? "" : padBrawlSurfaceCopy.playerTag(pad.slot)} {padBrawlSurfaceCopy.hearts(pad.hearts)}
        </text>
      </svg>
      {pad.state === "down" && (
        <div className={styles.veil}>
          <p className={styles.title}>{padBrawlSurfaceCopy.down}</p>
          <p className={styles.line}>{padBrawlSurfaceCopy.downHint}</p>
        </div>
      )}
      {pad.state === "away" && (
        <div className={styles.veil}>
          <p className={styles.line}>{padBrawlSurfaceCopy.away}</p>
        </div>
      )}
      {pad.state === "up" && status === "ready" && (
        <div className={styles.veil}>
          <p className={styles.line}>{padBrawlSurfaceCopy.waiting}</p>
        </div>
      )}
    </div>
  );
};
