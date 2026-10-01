import { GOOSE_ART_HEIGHT, GooseFigure } from "../GooseFigure/index.js";
import { resolveGoonPlacement, type GoonProps } from "../rig/index.js";
import * as styles from "./styles.js";

/**
 * A goose on the street: the Canada goose off the waterfront that owns Dunlop, the same bird
 * SCHLONIC's crowd stands, now walking, honking and lunging. Stood on its foot point and scaled to
 * the sim's goose box (`BRAWL_WORLD.goons.goose`, via `GOOSE_ART_HEIGHT`), so retuning the box
 * retunes the drawing.
 */
export const Goose = ({ x, y, facing, state, tick, palette }: GoonProps): JSX.Element => (
  <g
    className={styles.root}
    data-brawl-goon-kind="goose"
    data-brawl-goon-state={state}
    transform={resolveGoonPlacement({ x, y, facing, kind: "goose", artHeight: GOOSE_ART_HEIGHT })}
  >
    <GooseFigure state={state} tick={tick} palette={palette} variant="goose" />
  </g>
);
