// An item paints with the wardrobe's one style table; this sibling exists
// because a component entry imports its styles from next door.
export * from "../../styles.js";

// The cloud's outline is painted under its fill, so the lobe roots stay white.
export const pomEdge = "stroke-bg [stroke-width:2.6] [stroke-linejoin:round] [paint-order:stroke]";

export const stick = "fill-none stroke-bg [stroke-width:2.4] [stroke-linecap:round]";

// Outside the body: the box with the body cut out of it.
export const outside = "[clip-rule:evenodd]";

// The far pom, solid in the harness's `dimmed(white)`: white 0.7 over ink, the
// far leg's dimming without the tail showing through. Mixed from the two
// tokens, since no token is that grey.
export const farPom = "[fill:color-mix(in_srgb,theme(colors.text)_70%,theme(colors.bg))]";
