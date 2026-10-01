import { forwardRef } from "react";
import type { BrawlBlock, BrawlGoonKind } from "@wingnight/shared";

import { waveMeterCopy } from "./copy.js";
import * as styles from "./styles.js";

const PIP_BY_KIND: Record<BrawlGoonKind, string> = {
  goose: styles.pip,
  gull: styles.pip,
  raccoon: styles.pipHeavy,
  boss: styles.pipBoss
};

type WaveMeterProps = {
  block: BrawlBlock;
  /** Folded away while a block's ending plays: the beat has the room's eyes. */
  hidden: boolean;
};

// The room's count of the wave in hand: one pip per goon, lit as each goes down, and GO ▶ once
// the wave is down (`waveMeter/`). React draws every wave's pips once per block; the mirror's paint
// loop picks the current wave and lights its pips, so the strip costs no React work per frame.
export const WaveMeter = forwardRef<HTMLDivElement, WaveMeterProps>(({ block, hidden }, ref): JSX.Element => (
  <div
    ref={ref}
    className={styles.strip}
    data-brawl-wave-meter
    data-brawl-wave="0"
    data-brawl-wave-clear="false"
    data-hidden={hidden ? "true" : "false"}
    aria-hidden="true"
  >
    {block.waves.map((wave) => (
      <span key={wave.index} className={styles.group} data-brawl-wave-group={wave.index} data-current={wave.index === 0 ? "true" : "false"}>
        <span className={styles.label}>{waveMeterCopy.waveLabel(wave.index + 1, block.waves.length)}</span>
        <span className={styles.pips}>
          {wave.spawns.map((spawn) => (
            <span
              key={spawn.index}
              className={PIP_BY_KIND[spawn.kind]}
              data-brawl-wave-pip={spawn.index}
              data-brawl-goon-kind={spawn.kind}
              data-state="waiting"
              data-lit="false"
            />
          ))}
        </span>
      </span>
    ))}
    <span className={styles.go}>{waveMeterCopy.go}</span>
  </div>
));

WaveMeter.displayName = "WaveMeter";
