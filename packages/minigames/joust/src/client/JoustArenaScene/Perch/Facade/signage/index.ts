/**
 * Narrower than this and a sign's lettering is a smear at TV distance, so the band stays blank
 * and the building has to be known by its paint. Measured on the façade's own width — the shelf's
 * less a leg's inset either side — so a shelf authored at 30 just clears it.
 */
export const FACADE_LETTERING_MIN_WIDTH = 30;

/** The Queen's serif, the one `@wingnight/scenery` letters its sign plate in. */
export const QUEENS_SIGN_FONT = '"Playfair Display", Georgia, "Times New Roman", serif';

/** Souldiers' wordmark, the same stack the scenery's graffiti sign rides on. */
export const SOULDIERS_SIGN_FONT = 'Bangers, "Permanent Marker", Impact, sans-serif';

export const canLetter = (width: number): boolean => width >= FACADE_LETTERING_MIN_WIDTH;
