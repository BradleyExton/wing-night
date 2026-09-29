import { queensHotelCopy } from "./copy.js";

/**
 * The buff brick and its shadow, the white of the shutters, railing and posts, the window glass,
 * the hotel's dark green (roof, fascia, sign plates and umbrellas), the sign's cream letters, and
 * the red of the flags on the balcony.
 */
export type QueensHotelPalette = {
  buff: string;
  buffDark: string;
  trim: string;
  pane: string;
  cornice: string;
  signLetter: string;
  flag: string;
};

/**
 * The Queen's Hotel on Dunlop Street: the finish line. Traced off a street photograph of its
 * front (queens-hotel). Three storeys of buff brick under a dark green roof, about twice as wide
 * as it is tall: a tall ground floor behind a row of white posts, then a white balcony railing
 * across the whole front at the second-floor line, hung with flags, and two rows of windows in
 * white shutters above it. What makes it the Queen's and not any old hotel is the sign: a dark
 * green vertical HOTEL blade coming down to a horizontal QUEENS plate, cream serif letters,
 * standing off-centre to the left — and the green fascia over the ground floor reading
 * RESTAURANT on one side and BAR over the patio umbrellas on the other.
 *
 * Solid shapes, and the lettering is real lettering because that is the recognition. Left out
 * on purpose: the "Established 1850" roundels at the plate's ends, the Union Jack's crosses (a
 * flag here is red and white and reads as Canada), the fretwork's pattern (it is a white band),
 * the planters and cedars, the dining room's own umbrellas on the left (they merged into its
 * arches), the street lamp and banner out front, the chalkboard line on the fascia, the glazing
 * bars in every window, and the neighbours either side.
 *
 * A set piece: the goal post stands on the patio under BAR, so the hotel tells the scene where
 * that is. `scale` sizes it: at 1 it is the width and height below, in the caller's world units.
 */
export const QUEENS_HOTEL = {
  width: 56,
  height: 31.4,
  /** The middle of the patio and of the BAR lettering over it, out from `x`. */
  barX: 43,
  /** How far apart the two patio umbrellas' poles stand, centred on `barX`. */
  patioWidth: 9.4
} as const;

/** Where the patio's middle stands in the caller's world, for a hotel stood at `x` and `scale`. */
export const resolveQueensPatioX = (x: number, scale = 1): number => x + QUEENS_HOTEL.barX * scale;

const FASCIA_TOP = 12.4;
const FASCIA_BOTTOM = 9.8;
const RAIL_TOP = 15.6;
const EAVE = 27.2;
const SIGN_X = 21;
const SIGN_FONT = '"Playfair Display", Georgia, "Times New Roman", serif';

/** The window bays across both upper floors, either side of the sign's column. */
const BAYS = [5, 12.5, 29.5, 37, 44.5, 52];
/** The white posts carrying the balcony, one either side of every opening below it. */
const POSTS = [0.3, 9.6, 18.8, 31.4, 36.4, 49.6, 55];
const FLAGS = [3.4, 10.6, 17.6, 27.4, 34.6, 41.4, 50.6];

/** One upper window: a dark pane in a white frame, between its two white shutters. */
const ShutteredWindow = ({ cx, top, palette }: { cx: number; top: number; palette: QueensHotelPalette }): JSX.Element => (
  <g>
    <rect x={cx - 1.75} y={top} width={3.5} height={4.9} fill={palette.trim} />
    <rect x={cx - 1.3} y={top + 0.45} width={2.6} height={4.1} fill={palette.pane} />
    <rect x={cx - 3.1} y={top} width={1.15} height={4.9} fill={palette.trim} />
    <rect x={cx + 1.95} y={top} width={1.15} height={4.9} fill={palette.trim} />
  </g>
);

/** A patio umbrella: a peaked green canopy with its valance, on a white pole. */
const Umbrella = ({ cx, palette }: { cx: number; palette: QueensHotelPalette }): JSX.Element => (
  <g>
    <rect x={cx - 0.2} y={-7.4} width={0.4} height={7.4} fill={palette.trim} />
    <path
      d={`M ${cx - 3.6} -5.2 Q ${cx - 1.8} -6.6 ${cx} -7.9 Q ${cx + 1.8} -6.6 ${cx + 3.6} -5.2 Z`}
      fill={palette.cornice}
    />
    <rect x={cx - 3.6} y={-5.3} width={7.2} height={0.6} fill={palette.cornice} />
  </g>
);

export const QueensHotel = ({
  x,
  baseY,
  palette,
  scale = 1
}: {
  x: number;
  baseY: number;
  palette: QueensHotelPalette;
  scale?: number;
}): JSX.Element => {
  const { width, barX, patioWidth } = QUEENS_HOTEL;
  const { name, blade, restaurant, bar } = queensHotelCopy;

  return (
    <g data-scenery-queens transform={`translate(${x} ${baseY}) scale(${scale})`}>
      {/* The green roof and its eave, overhanging the brick. */}
      <path d={`M -0.8 ${-EAVE - 1.2} L 2.4 -31.4 L ${width - 2.4} -31.4 L ${width + 0.8} ${-EAVE - 1.2} Z`} fill={palette.cornice} />
      <rect x={-1} y={-EAVE - 1.4} width={width + 2} height={1.4} fill={palette.cornice} />
      <rect x={0} y={-EAVE} width={width} height={EAVE} fill={palette.buff} />
      <rect x={0} y={-EAVE} width={width} height={0.8} fill={palette.buffDark} opacity={0.7} />
      {BAYS.map((cx) => (
        <g key={cx}>
          <ShutteredWindow cx={cx} top={-25.7} palette={palette} />
          <ShutteredWindow cx={cx} top={-19.9} palette={palette} />
        </g>
      ))}
      {/* The ground floor: dark openings behind the posts, the door up its steps, the patio's arches. */}
      <g fill={palette.pane}>
        <path d="M 2.2 0 L 2.2 -6.4 Q 5.1 -8.6 8 -6.4 L 8 0 Z" />
        <path d="M 11.4 0 L 11.4 -6.4 Q 14.2 -8.6 17 -6.4 L 17 0 Z" />
        <rect x={22.6} y={-8.2} width={5.6} height={8.2} />
        <path d="M 32.6 -1.6 L 32.6 -5.6 Q 34.2 -7.6 35.8 -5.6 L 35.8 -1.6 Z" />
        <path d="M 50.8 -1.6 L 50.8 -5.6 Q 52.4 -7.6 54 -5.6 L 54 -1.6 Z" />
      </g>
      <rect x={21.6} y={-1.2} width={7.6} height={1.2} fill={palette.trim} />
      <rect x={0} y={-FASCIA_BOTTOM} width={width} height={1} fill={palette.trim} />
      {POSTS.map((post) => (
        <rect key={post} x={post} y={-FASCIA_BOTTOM} width={0.9} height={FASCIA_BOTTOM} fill={palette.trim} />
      ))}
      <rect x={0} y={-FASCIA_TOP} width={width} height={FASCIA_TOP - FASCIA_BOTTOM} fill={palette.cornice} />
      <text x={11} y={-10.35} fontSize={1.9} fontWeight={900} fontFamily={SIGN_FONT} textAnchor="middle" fill={palette.signLetter}>
        {restaurant}
      </text>
      <text x={barX} y={-10.2} fontSize={2.3} fontWeight={900} fontFamily={SIGN_FONT} textAnchor="middle" fill={palette.signLetter}>
        {bar}
      </text>
      {/* The balcony railing across the whole front: two rails and the balusters between them. */}
      <g fill={palette.trim}>
        <rect x={0.4} y={-RAIL_TOP} width={width - 0.8} height={0.7} />
        <rect x={0.4} y={-FASCIA_TOP - 0.6} width={width - 0.8} height={0.6} />
        {Array.from({ length: 42 }, (_unused, index) => (
          <rect key={index} x={1.1 + index * 1.3} y={-RAIL_TOP} width={0.55} height={RAIL_TOP - FASCIA_TOP} />
        ))}
      </g>
      {/* The flags, each on a pole leaning out off the rail: red and white, and the room says Canada. */}
      {FLAGS.map((pole, index) => (
        <g key={pole}>
          <path d={`M ${pole} ${-RAIL_TOP} L ${pole - 1.3} -20.6`} stroke={palette.trim} strokeWidth={0.4} />
          {index % 3 === 1 ? (
            <path d={`M ${pole - 1.3} -20.6 L ${pole + 1.6} -19.8 L ${pole - 1.1} -18.9 Z`} fill={palette.flag} />
          ) : (
            <g>
              <rect x={pole - 1.3} y={-20.6} width={2.7} height={1.6} fill={palette.flag} />
              <rect x={pole - 0.45} y={-20.6} width={1} height={1.6} fill={palette.trim} />
            </g>
          )}
        </g>
      ))}
      {/* The sign: the HOTEL blade coming down off the eave onto the QUEENS plate. */}
      <path d={`M ${SIGN_X - 1.6} -19.6 L ${SIGN_X - 1.6} -27.2 L ${SIGN_X} -28.6 L ${SIGN_X + 1.6} -27.2 L ${SIGN_X + 1.6} -19.6 Z`} fill={palette.cornice} />
      {blade.map((letter, index) => (
        <text
          key={letter}
          x={SIGN_X}
          y={-25.9 + index * 1.3}
          fontSize={1.35}
          fontWeight={900}
          fontFamily={SIGN_FONT}
          textAnchor="middle"
          fill={palette.signLetter}
        >
          {letter}
        </text>
      ))}
      <path
        d={`M ${SIGN_X - 7.6} -17.9 L ${SIGN_X - 6.6} -19.9 L ${SIGN_X + 6.6} -19.9 L ${SIGN_X + 7.6} -17.9 L ${SIGN_X + 6.6} -15.9 L ${SIGN_X - 6.6} -15.9 Z`}
        fill={palette.cornice}
        stroke={palette.signLetter}
        strokeWidth={0.25}
      />
      <text
        x={SIGN_X}
        y={-16.85}
        fontSize={2.9}
        fontWeight={900}
        fontFamily={SIGN_FONT}
        textAnchor="middle"
        textLength={12}
        lengthAdjust="spacingAndGlyphs"
        fill={palette.signLetter}
      >
        {name}
      </text>
      {/* The patio: two green umbrellas under BAR, with room between them for whoever finishes. */}
      <Umbrella cx={barX - patioWidth / 2} palette={palette} />
      <Umbrella cx={barX + patioWidth / 2} palette={palette} />
    </g>
  );
};
