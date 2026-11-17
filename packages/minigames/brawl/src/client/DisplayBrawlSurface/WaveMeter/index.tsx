import type { BrawlGoonKind, BrawlSide } from "@wingnight/shared";

import type { BrawlWaveMeter, BrawlWavePip } from "../../waveMeter/index.js";
import { waveMeterCopy } from "./copy.js";
import * as styles from "./styles.js";

// A pip is sized by the goon's worth: one, two (the raccoon, the swan, the helmet goose) or the boss's four.
const PIP_BY_KIND: Record<BrawlGoonKind, string> = {
  goose: styles.pip,
  gull: styles.pip,
  raccoon: styles.pipHeavy,
  swan: styles.pipHeavy,
  helmet: styles.pipHeavy,
  boss: styles.pipBoss
};

/** Past this many goons a wave's pips are drawn small: a crew of five's wave is seventeen of them. */
const DENSE_PIPS = 10;

const sideName = (side: BrawlSide): "left" | "right" => (side === -1 ? "left" : "right");

// The goons of the wave that step in from one edge, as pips, in the order they arrive: the room
// can call "GULL, LEFT, NEXT" before the goon is on the street.
const SidePips = ({ pips, side }: { pips: readonly BrawlWavePip[]; side: BrawlSide }): JSX.Element | null => {
  const own = pips.filter((pip) => pip.side === side);

  if (own.length === 0) {
    return null;
  }

  const name = sideName(side);
  const marker = (
    <span className={styles.sideMarker} data-brawl-wave-side-marker={name}>
      {side === -1 ? waveMeterCopy.sideLeft : waveMeterCopy.sideRight}
    </span>
  );

  return (
    <span className={styles.pips} data-brawl-wave-side-group={name}>
      {side === -1 && marker}
      {own.map((pip) => (
        <span
          key={pip.spawnIndex}
          className={PIP_BY_KIND[pip.kind]}
          data-brawl-wave-pip={pip.spawnIndex}
          data-brawl-goon-kind={pip.kind}
          data-brawl-wave-side={name}
          data-state={pip.state}
        />
      ))}
      {side === 1 && marker}
    </span>
  );
};

type WaveMeterProps = {
  meter: BrawlWaveMeter;
  /** Folded away while a block's ending plays: the beat has the room's eyes. */
  hidden: boolean;
};

/**
 * The room's count of the wave in hand: one pip per goon, lit as each goes down, grouped by the
 * edge it arrives from, and GO ▶ once the wave is down (`waveMeter/`). The surface re-renders it
 * only when the count moves (`resolveWaveMeterSignature`), so the strip costs nothing per frame.
 * The kit is furnished for the crew that stepped out, and the count is right here: no hidden
 * modifier (principles §5).
 */
export const WaveMeter = ({ meter, hidden }: WaveMeterProps): JSX.Element => (
  <div
    className={styles.strip}
    data-brawl-wave-meter
    data-brawl-wave={meter.waveIndex}
    data-brawl-wave-clear={meter.clear ? "true" : "false"}
    data-brawl-wave-down={meter.pips.filter((pip) => pip.state === "down").length}
    data-brawl-wave-size={meter.pips.length}
    data-dense={meter.pips.length > DENSE_PIPS ? "true" : "false"}
    data-hidden={hidden ? "true" : "false"}
    aria-hidden="true"
  >
    <SidePips pips={meter.pips} side={-1} />
    <span className={styles.label}>{waveMeterCopy.waveLabel(meter.waveIndex + 1, meter.waveCount)}</span>
    <SidePips pips={meter.pips} side={1} />
    <span className={styles.go}>{waveMeterCopy.go}</span>
  </div>
);
