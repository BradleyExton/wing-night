const SHAKE_MS = 200;
const SHAKE_PX = 8;

/**
 * The whole picture flinching: a hit on the hen. Web Animations rather than a class, because a
 * class re-applied on the same element inside one frame would not restart, and two hits a second
 * apart both deserve their flinch (SCHLONIC's `shake`). A browser without the API does nothing.
 */
export const shakeElement = (element: HTMLElement | null): void => {
  if (element === null || typeof element.animate !== "function") {
    return;
  }

  element.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${-SHAKE_PX}px, ${SHAKE_PX * 0.4}px)` },
      { transform: `translate(${SHAKE_PX * 0.6}px, ${-SHAKE_PX * 0.3}px)` },
      { transform: `translate(${-SHAKE_PX * 0.3}px, ${SHAKE_PX * 0.15}px)` },
      { transform: "translate(0, 0)" }
    ],
    { duration: SHAKE_MS, easing: "ease-out" }
  );
};
