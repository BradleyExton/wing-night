// The disco kit's shared geometry, ported from the harness's disco-kit.js.
// Every item is drawn on the preener, so the paths are the harness's own,
// written out; only the Boots move, about the leg's ankle (one unit behind
// its hip).

// Everything visible of the chest: the body below y 37 and in front of the
// wing's front edge, so a Top fills the body up to the wing without painting
// over it. Its wearer clips it to the body; the neck, painted after, covers
// it above the line (45,33)–(60,40), the Top's real upper edge at the throat.
export const CHEST = "M 47 37 L 70 37 L 70 60 L 20 60 L 23 54 C 28 48 33 43 40 41 C 46 40 49.5 38.5 48 37 Z";

// The flare sleeve's bell, flaring back along the wing's axis past its back
// tip; the cuff band laid along the bell's joint; the hem inside its mouth.
export const BELL =
  "M 27 34 C 24 39 25 45 29 49 L 21.6 55 C 17 56.2 12.6 53 10.8 48.7 L 16.8 46 C 16.6 44.5 16.9 43.5 17.4 42.6 C 19 38 22.5 35 27 34 Z";

export const BELL_CUFF = "M 27 34 C 24 39 25 45 29 49";

export const BELL_HEM = "M 20.2 52.9 L 13.2 48.6";

// A roller skate's base (the harness's `skateBase`): the ink plate under the
// foot, the truck block between the wheels, and the two wheels' centres.
export const skatePlate = (x: number): string =>
  `M ${x - 8} 66.4 L ${x + 8} 66.4 L ${x + 8} 70.4 L ${x - 8} 70.4 Z`;

export const skateTruck = (x: number): string => `M ${x - 2} 69 L ${x + 3} 69 L ${x + 2.6} 72.6 L ${x - 1.6} 72.6 Z`;

export const SKATE_WHEEL = { r: 3, cy: 69.7, back: -4.8, front: 5 };
