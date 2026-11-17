import type { BrawlGoonPalette } from "../../palette.js";
import type { Point } from "../../rig/index.js";
import * as styles from "./styles.js";

/** The cage swings on the shell's front edge, by the temple. */
const HINGE: Point = { x: 1.4, y: -0.75 };

/**
 * How far the cage flips up: right back over the dome like a visor thrown open, so it reads as
 * "up" whichever way the head is turned — a hanging head with a half-lifted cage would read as
 * down again.
 */
const CAGE_UP_DEGREES = -150;

// In the goose head's own units (`../../GooseFigure`), facing right: a white shell sat over the
// crown with an ear flap down the back, its lower edge hugging the head so it reads as worn and
// not hovering; a grey vent slot along the top; and the cage — a wire frame over the whole bill
// with two bars across and two down, which is what says "hockey" from across a room.
const SHELL = "M -1.85 0.55 L -1.9 -0.6 Q -1.7 -2.05 0 -2.05 Q 1.75 -2.05 1.75 -0.6 L 1.45 -0.55 Q 0 -0.95 -1.2 -0.55 L -1.25 0.55 Z";
const VENT = "M -0.6 -1.75 L 0.5 -1.75 L 0.4 -1.5 L -0.5 -1.5 Z";
const CAGE = "M 1.3 -0.75 L 3.7 -0.3 L 3.7 1.05 L 1.05 1.1 M 1.25 0.05 L 3.7 0.2 M 1.2 0.6 L 3.7 0.65 M 2.1 -0.55 L 2 1.08 M 2.9 -0.42 L 2.85 1.07";

/**
 * A white hockey helmet with a cage, drawn about the goose head's centre so the head group that
 * turns the bill turns the helmet with it. `cage` is the mode the room reads: `down` over the
 * bill (armoured — a peck clanks off it), `up` flipped over the dome (open — the bill is bare).
 * No team marks on it: it is a goose's helmet, not anyone's.
 */
export const Shell = ({ cage, palette }: { cage: "down" | "up"; palette: BrawlGoonPalette }): JSX.Element => (
  <g data-brawl-helmet-cage={cage}>
    <path className={`${palette.plumage} ${palette.stroke} ${styles.shell}`} d={SHELL} />
    <path className={`${palette.fur} ${styles.vent}`} d={VENT} />
    <g transform={cage === "up" ? `rotate(${CAGE_UP_DEGREES} ${HINGE.x} ${HINGE.y})` : undefined}>
      <path className={`${palette.stroke} ${styles.halo}`} d={CAGE} />
      <path className={`${palette.mark} ${styles.bars}`} d={CAGE} />
    </g>
  </g>
);
