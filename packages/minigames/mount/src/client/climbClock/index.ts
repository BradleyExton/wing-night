import { MOUNT_WORLD } from "@wingnight/shared";

/** Under this many seconds the clock gets the house last-ten treatment (principles §11, 1). */
export const LAST_TEN_SECONDS = 10;

/** Ticks left as the room reads them: whole seconds, rounded up, as `m:ss`. */
export const formatClimbClock = (ticksLeft: number): string => {
  const seconds = Math.ceil(Math.max(0, ticksLeft) / MOUNT_WORLD.tickHz);

  return `${Math.floor(seconds / 60)}:${`${seconds % 60}`.padStart(2, "0")}`;
};

/** Whether a clock this low is in its last ten seconds, and still running. */
export const isLastTen = (ticksLeft: number): boolean => {
  return ticksLeft > 0 && ticksLeft <= LAST_TEN_SECONDS * MOUNT_WORLD.tickHz;
};

/**
 * Writes the climb's clock into a chrome element, from a paint loop sixty times a second: the
 * ticks left for a harness (`data-mount-clock`), the last-ten flag the styles key off, and the
 * digits. Touches the DOM only when something changed.
 */
export const paintClimbClock = (element: HTMLElement | null, ticksLeft: number): void => {
  if (element === null) {
    return;
  }

  const ticks = `${Math.max(0, ticksLeft)}`;

  if (element.getAttribute("data-mount-clock") === ticks) {
    return;
  }

  element.setAttribute("data-mount-clock", ticks);
  element.setAttribute("data-last-ten", isLastTen(ticksLeft) ? "true" : "false");

  const text = formatClimbClock(ticksLeft);

  if (element.textContent !== text) {
    element.textContent = text;
  }
};
