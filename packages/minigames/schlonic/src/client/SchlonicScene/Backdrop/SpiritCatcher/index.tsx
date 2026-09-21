import { schlonicPalette } from "../../palette.js";

/**
 * The Spirit Catcher: Ron Baird's thunderbird, on the waterfront since 1986, and the reason the
 * joke works — the city put a giant steel bird on this shore decades before this game put a
 * small one on it. Drawn off photographs, not memory. Points below are `u` out along the span
 * and `v` up off the ground, both in HALF-spans, traced from a head-on photograph of it:
 *
 *   it is WIDER than tall (25m x 21m, so v tops out at 1.72) and bilaterally symmetric —
 *     two wings, not one, and that symmetry is most of the recognition
 *   each spar is dead straight, rises 0.52 per half-span out of a root at v = 1.20, and its
 *     TIP is the highest point of the whole sculpture
 *   the blades hang below the spar, deepest at the innermost one and then cut away to nothing,
 *     which is the deep armpit you see from the path
 *   the head is a small crescent opening UPWARD on a stem, flanked by two long quills, and it
 *     sits BELOW the wing tips — no beak, nothing that reads as a bird's head close up
 *   it stands on three legs: two splayed wide, and a central post
 *
 * Solid shapes and nothing finer. The real thing is sixteen kinetic quills over each spar with
 * sky between every blade, and at the size this sits on a TV that comb is an aerial (DESIGN.md
 * §2.11). So the blades are ONE band at their true depth rather than sixteen separate ones, and
 * the only thing left of the feathers is a tooth in the band's own edge where each blade's tip
 * falls. That is as much as a feather can say here without becoming a wire — and the band has
 * to run full depth, because a shallower one turns the thunderbird into a moth.
 */
const SPIRIT_CATCHER_HALF_SPAN = 17.5;

/** Height of the spar above the base, in half-spans, at a fraction of the way out along it. */
const sparV = (u: number): number => 1.2 + 0.52 * u;

/**
 * How far the blades hang below the spar, at fractions of the way out along it. Read straight
 * off the photograph: nothing at the tip, growing fast over the outer fifth, a long shallow ramp
 * through the middle, and deepest of all at the innermost blade before the armpit cuts it away.
 */
const BLADE_HANG: readonly (readonly [number, number])[] = [
  [0.97, 0.02],
  [0.899, 0.151],
  [0.851, 0.216],
  [0.803, 0.274],
  [0.755, 0.361],
  [0.659, 0.404],
  [0.563, 0.442],
  [0.466, 0.51],
  [0.37, 0.611]
];

/** How far each blade's own tip falls below the line its neighbours make. One tooth per blade. */
const BLADE_TOOTH = 0.06;

export const SpiritCatcher = ({ x, baseY }: { x: number; baseY: number }): JSX.Element => {
  const hs = SPIRIT_CATCHER_HALF_SPAN;
  /** A point in the reference frame: u out along the span (signed), v up off the base. */
  const p = (u: number, v: number): string => `${x + u * hs} ${baseY - v * hs}`;

  /** The spar: a straight bar off the root, tapering to the point the whole sculpture tops out at. */
  const spar = (side: number): string =>
    [
      `M ${p(0, 1.23)}`,
      `L ${p(side, 1.72)}`,
      `L ${p(side * 0.96, sparV(0.96) - 0.04)}`,
      `L ${p(0, 1.16)}`,
      "Z"
    ].join(" ");

  /** The blades hung off it: out along the spar's underside, then home along their own tips. */
  const blades = (side: number): string => {
    const path = [
      `M ${p(side * 0.22, sparV(0.22) - 0.02)}`,
      `L ${p(side * 0.97, sparV(0.97) - 0.02)}`
    ];

    BLADE_HANG.forEach(([u, hang], index) => {
      const previous = BLADE_HANG[index - 1];

      if (previous) {
        const tip = (previous[0] + u) / 2;
        const between = (sparV(previous[0]) - previous[1] + sparV(u) - hang) / 2;

        path.push(`L ${p(side * tip, between - BLADE_TOOTH)}`);
      }
      path.push(`L ${p(side * u, sparV(u) - hang)}`);
    });
    // The armpit: the innermost blade's back edge, which is nearly a straight drop.
    path.push(`C ${p(side * 0.355, 0.97)} ${p(side * 0.295, 1.08)} ${p(side * 0.22, 1.28)}`, "Z");

    return path.join(" ");
  };

  /** A leg, straight and splayed: the feet stand a third of a half-span out from the post. */
  const leg = (side: number): string =>
    [
      `M ${p(side * 0.07, 1.18)}`,
      `L ${p(side * 0.122, 1.18)}`,
      `L ${p(side * 0.354, 0)}`,
      `L ${p(side * 0.302, 0)}`,
      "Z"
    ].join(" ");

  /** One of the two long quills that stand up either side of the head. */
  const quill = (side: number): string =>
    [
      `M ${p(side * 0.192, 1.29)}`,
      `L ${p(side * 0.174, 1.29)}`,
      `L ${p(side * 0.174, 1.49)}`,
      `L ${p(side * 0.192, 1.49)}`,
      "Z"
    ].join(" ");

  return (
    <g data-schlonic-spirit-catcher>
      {/* The mound it stands on, which is why it clears everything else on that shore. */}
      <path d={`M ${p(-0.68, 0)} Q ${p(0, 0.19)} ${p(0.68, 0)} Z`} fill={schlonicPalette.turfDark} opacity={0.5} />
      <g fill={schlonicPalette.steel}>
        <path d={blades(-1)} />
        <path d={blades(1)} />
        <path d={spar(-1)} />
        <path d={spar(1)} />
        <path d={leg(-1)} />
        <path d={leg(1)} />
        <path d={quill(-1)} />
        <path d={quill(1)} />
        <path d={`M ${p(-0.024, 1.2)} L ${p(0.024, 1.2)} L ${p(0.024, 0)} L ${p(-0.024, 0)} Z`} />
        {/* The stem, and the crescent opening upward off the top of it. */}
        <path d={`M ${p(-0.024, 1.19)} L ${p(0.024, 1.19)} L ${p(0.024, 1.52)} L ${p(-0.024, 1.52)} Z`} />
        <path
          d={[
            `M ${p(-0.095, 1.67)}`,
            `C ${p(-0.095, 1.43)} ${p(0.095, 1.43)} ${p(0.095, 1.67)}`,
            `C ${p(0.045, 1.53)} ${p(-0.045, 1.53)} ${p(-0.095, 1.67)}`,
            "Z"
          ].join(" ")}
        />
      </g>
      {/* The body under the wings: the shoulders, the pointed loop and the bar across it. */}
      <g fill="none" stroke={schlonicPalette.steel} strokeWidth={0.72} strokeLinejoin="round">
        <path d={`M ${p(-0.215, sparV(0.215))} C ${p(-0.21, 1.11)} ${p(-0.09, 1.05)} ${p(0, 1.05)}`} />
        <path d={`M ${p(0.215, sparV(0.215))} C ${p(0.21, 1.11)} ${p(0.09, 1.05)} ${p(0, 1.05)}`} />
        <path
          d={[
            `M ${p(0, 1.22)}`,
            `C ${p(-0.12, 1.17)} ${p(-0.12, 0.78)} ${p(0, 0.6)}`,
            `C ${p(0.12, 0.78)} ${p(0.12, 1.17)} ${p(0, 1.22)}`,
            "Z"
          ].join(" ")}
        />
        <path d={`M ${p(-0.105, 1.06)} L ${p(0.105, 1.06)}`} />
      </g>
      {/* One seam, along the spar's underside: enough to say the blades hang off a bar. */}
      <g fill="none" stroke={schlonicPalette.steelDark} strokeWidth={0.3} opacity={0.75}>
        <path d={`M ${p(-0.24, sparV(0.24) - 0.02)} L ${p(-0.95, sparV(0.95) - 0.02)}`} />
        <path d={`M ${p(0.24, sparV(0.24) - 0.02)} L ${p(0.95, sparV(0.95) - 0.02)}`} />
      </g>
    </g>
  );
};
