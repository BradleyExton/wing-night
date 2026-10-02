import { forwardRef } from "react";
import type { BrawlBlock, BrawlGoonKind, BrawlSide, BrawlSpawn } from "@wingnight/shared";

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

type WaveMeterProps = {
  block: BrawlBlock;
  /** Folded away while a block's ending plays: the beat has the room's eyes. */
  hidden: boolean;
};

const sideName = (side: BrawlSide): "left" | "right" => (side === -1 ? "left" : "right");

// The goons of one wave that step in from one edge, as pips, in the order they arrive. The side
// is the TV's to show and never the tablet's (docs/minigames/brawl-spec.md §3): the room can
// call "GULL, LEFT, NEXT" before the goon is on the street.
const SidePips = ({ spawns, side }: { spawns: BrawlSpawn[]; side: BrawlSide }): JSX.Element | null => {
  const own = spawns.filter((spawn) => spawn.side === side);

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
      {own.map((spawn) => (
        <span
          key={spawn.index}
          className={PIP_BY_KIND[spawn.kind]}
          data-brawl-wave-pip={spawn.index}
          data-brawl-goon-kind={spawn.kind}
          data-brawl-wave-side={name}
          data-state="waiting"
          data-lit="false"
        />
      ))}
      {side === 1 && marker}
    </span>
  );
};

// The room's count of the wave in hand: one pip per goon, lit as each goes down, grouped by the
// edge it arrives from with the wave's clean star between, and GO ▶ once the wave is down
// (`waveMeter/`). React draws every wave's pips once per block; the mirror's paint loop picks the
// current wave, lights its pips and works the star, so the strip costs no React work per frame.
export const WaveMeter = forwardRef<HTMLDivElement, WaveMeterProps>(({ block, hidden }, ref): JSX.Element => (
  <div
    ref={ref}
    className={styles.strip}
    data-brawl-wave-meter
    data-brawl-wave="0"
    data-brawl-wave-clear="false"
    data-brawl-wave-clean="true"
    data-hidden={hidden ? "true" : "false"}
    aria-hidden="true"
  >
    {block.waves.map((wave) => (
      <span key={wave.index} className={styles.group} data-brawl-wave-group={wave.index} data-current={wave.index === 0 ? "true" : "false"}>
        <SidePips spawns={wave.spawns} side={-1} />
        <span className={styles.label}>{waveMeterCopy.waveLabel(wave.index + 1, block.waves.length)}</span>
        <SidePips spawns={wave.spawns} side={1} />
      </span>
    ))}
    {/* The thing to lose in every wave: lit while she is untouched, dark the moment she is hit,
        and a flare when the wave goes down clean and the bonus banks. */}
    <span className={styles.star} data-brawl-wave-star data-clean="true" data-banked="false">
      {waveMeterCopy.star}
    </span>
    <span className={styles.go}>{waveMeterCopy.go}</span>
  </div>
));

WaveMeter.displayName = "WaveMeter";
