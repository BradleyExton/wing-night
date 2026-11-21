import { useMemo } from "react";
import { resolveCrewSlotColour, resolveHenFigure, type HenFigure } from "@wingnight/minigames-brawl/client";
import { BORDEN_STRETCHES, type BordenCrewMember, type BordenFoe, type BordenFrame, type BordenStretch } from "@wingnight/shared";

import { useBaseFrame, type BordenBase } from "../useBordenFrame/index.js";
import { BORDEN_FAR_PARALLAX, BordenFar, BordenNear } from "./Backdrop/index.js";
import { bordenSceneCopy as copy } from "./copy.js";
import { Foe } from "./Foes/index.js";
import { BORDEN_VIEW, round2 } from "./frameGeometry.js";
import { Hen } from "./Hen/index.js";
import { BottleDrop, Gate, Puddles, Sauce, Shots } from "./Kit/index.js";
import * as styles from "./styles.js";

export type BordenSceneProps = {
  base: BordenBase;
  layout: BordenStretch;
  /** The room's crew in seat order, and who runs this stretch: `pair[slot]` is hen `slot`'s seat. */
  crew: BordenCrewMember[];
  pair: number[];
  activeTurnTeamId: string | null;
  serverOrigin: string | null;
  /** This phone's own hen, as her slot in the frame, or null on a screen that only watches. */
  ownSlot: number | null;
  label: string;
};

/** Which way each shooter's barrel points: at the nearest hen still up, or back the way they came. */
const resolveAim = (frame: BordenFrame, foe: BordenFoe): -1 | 1 => {
  let nearest: number | null = null;

  for (const hen of frame.hens) {
    if (hen.state === "up" && (nearest === null || Math.abs(hen.x - foe.x) < Math.abs(nearest - foe.x))) {
      nearest = hen.x;
    }
  }

  return nearest !== null && nearest > foe.x ? 1 : -1;
};

/**
 * The base, one stretch of it, as every screen draws it (docs/minigames/base-borden-spec.md §0.6):
 * the skyline slid at its parallax, the stretch's own kit and ground, the gate at the far end, and
 * on them the bottle, the foes, the hens, the sauce and the shots, all off the frame this screen is
 * stepping. The camera is the sim's: it follows the lead hen and never goes back.
 */
export const BordenScene = ({ base, layout, crew, pair, activeTurnTeamId, serverOrigin, ownSlot, label }: BordenSceneProps): JSX.Element => {
  const frame = useBaseFrame(base);
  const figures = useMemo<HenFigure[]>(
    () => pair.map((seat) => resolveHenFigure({ figure: crew[seat]?.player ?? null, activeTurnTeamId, serverOrigin })),
    [crew, pair, activeTurnTeamId, serverOrigin]
  );
  const cameraX = round2(frame?.cameraX ?? 0);
  const flashing = frame?.telegraph?.foeId ?? null;

  return (
    <div className={styles.frame} data-borden-scene={layout.name} data-borden-tick={frame?.tick ?? 0} data-borden-camera={cameraX}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${BORDEN_VIEW.width} ${BORDEN_VIEW.height}`}
        preserveAspectRatio="xMidYMax meet"
        role="img"
        aria-label={label}
      >
        <g transform={`translate(${round2(-cameraX * BORDEN_FAR_PARALLAX)} 0)`}>
          <BordenFar length={layout.length} />
        </g>
        <g transform={`translate(${-cameraX} 0)`}>
          <BordenNear length={layout.length} name={layout.name} />
          <Gate x={layout.gateX} label={layout.index === BORDEN_STRETCHES - 1 ? copy.finalGate : copy.gate} className={styles.gateSign} />
          {frame !== null && (
            <>
              <Puddles frame={frame} />
              {frame.bottle !== null && <BottleDrop drop={frame.bottle} tick={frame.tick} />}
              {frame.foes.map((foe) => (
                <Foe key={foe.id} foe={foe} tick={frame.tick} isFlashing={flashing === foe.id} aim={resolveAim(frame, foe)} alarmClassName={styles.alarm} />
              ))}
              {frame.hens.map((hen) => {
                const figure = figures[hen.slot];
                const seat = pair[hen.slot] ?? hen.slot;

                return figure === undefined ? null : (
                  <Hen
                    key={hen.slot}
                    hen={hen}
                    tick={frame.tick}
                    figure={figure}
                    colour={resolveCrewSlotColour(seat)}
                    tag={figure.playerName ?? copy.playerTag(seat)}
                    tagClassName={styles.henTag}
                    isOwn={ownSlot === hen.slot}
                  />
                );
              })}
              <Sauce frame={frame} />
              <Shots shots={frame.shots} />
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
