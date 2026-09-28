/**
 * The wings flying off the bird into the bank at the post: a pool of wing drawings the surface
 * mounts once, thrown one by one along an arc from wherever the runner is to wherever the
 * banked figure is, with the Web Animations API. Nothing here is React-driven: the layer is
 * rendered once and the flight is a set of animations started on it.
 */

/** No more than this many wings fly, however many were banked: past a dozen it is confetti. */
export const WING_FLIGHT_MAX = 12;
export const WING_FLIGHT_DURATION_MS = 620;
/** Each wing leaves this long after the one before it. */
export const WING_FLIGHT_STAGGER_MS = 55;

export type FlightPoint = { x: number; y: number };

/** Pure: how many wings fly for a handful this size. */
export const resolveWingFlightCount = (wings: number): number => {
  return Math.max(0, Math.min(WING_FLIGHT_MAX, Math.round(wings)));
};

/** Pure: the point in the middle of a box, in the box's own coordinate space. */
export const resolveCentre = (rect: { left: number; top: number; width: number; height: number }): FlightPoint => {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

type Animatable = Element & { animate?: Element["animate"] };

/**
 * Throws `count` of the layer's wings from `from` to `to`, staggered, each on its own arc. The
 * layer's children are positioned at its own origin, so `from` and `to` are relative to it.
 * A browser without the Web Animations API (a static render, a test) does nothing.
 */
export const flyWings = (layer: HTMLElement | null, from: FlightPoint, to: FlightPoint, count: number): void => {
  if (layer === null) {
    return;
  }

  const wings = Array.from(layer.children) as Animatable[];

  for (let index = 0; index < Math.min(count, wings.length); index += 1) {
    const wing = wings[index];

    if (wing === undefined || typeof wing.animate !== "function") {
      continue;
    }

    // A lift in the middle of the flight, scattered a little so twelve wings are a flock.
    const lift = 60 + (index % 4) * 22;
    const drift = ((index % 3) - 1) * 30;
    const midX = (from.x + to.x) / 2 + drift;
    const midY = Math.min(from.y, to.y) - lift;

    wing.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px) scale(1) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${midX}px, ${midY}px) scale(1.15) rotate(180deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${to.x}px, ${to.y}px) scale(0.4) rotate(360deg)`, opacity: 0 }
      ],
      {
        duration: WING_FLIGHT_DURATION_MS,
        delay: index * WING_FLIGHT_STAGGER_MS,
        easing: "cubic-bezier(0.3, 0, 0.7, 1)",
        fill: "backwards"
      }
    );
  }
};
