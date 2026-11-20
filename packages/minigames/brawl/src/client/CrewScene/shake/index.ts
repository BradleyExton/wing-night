const SHAKE_MS = 200;

/** How far the picture is thrown, in pixels: a heart lost is a flinch, a hen going down is a jolt. */
export const SHAKE_PX = { hit: 5, down: 11 } as const;

/**
 * The whole picture flinching. The fight never stops for a hit — the server's clock is the only
 * clock — so the old hit-pause is this instead: the picture is thrown and settles while the sim
 * keeps going under it. Web Animations rather than a class, because a class re-applied on the
 * same element inside one frame would not restart, and two hits a moment apart both deserve
 * their flinch. A browser without the API does nothing.
 */
export const shakeElement = (element: Element | null, px: number): void => {
  if (element === null || typeof element.animate !== "function") {
    return;
  }

  element.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: `translate(${-px}px, ${px * 0.4}px)` },
      { transform: `translate(${px * 0.6}px, ${-px * 0.3}px)` },
      { transform: `translate(${-px * 0.3}px, ${px * 0.15}px)` },
      { transform: "translate(0, 0)" }
    ],
    { duration: SHAKE_MS, easing: "ease-out" }
  );
};
