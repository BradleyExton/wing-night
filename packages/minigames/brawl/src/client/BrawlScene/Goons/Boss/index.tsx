import { GOOSE_ART_HEIGHT, GooseFigure } from "../GooseFigure/index.js";
import { resolveGoonPlacement, type GoonProps } from "../rig/index.js";
import * as styles from "./styles.js";

/**
 * The boss: the biggest goose on the waterfront, closing block three. The goose's own rig drawn
 * to the boss box (`BRAWL_WORLD.goons.boss`) with a red eye under a knitted brow, a gold chain
 * at its neck and a bigger honk — so the room knows it is not another goose before it has
 * measured it against one.
 */
export const Boss = ({ x, y, facing, state, tick, palette }: GoonProps): JSX.Element => (
  <g
    className={styles.root}
    data-brawl-goon-kind="boss"
    data-brawl-goon-state={state}
    transform={resolveGoonPlacement({ x, y, facing, kind: "boss", artHeight: GOOSE_ART_HEIGHT })}
  >
    <GooseFigure state={state} tick={tick} palette={palette} variant="boss" />
  </g>
);
