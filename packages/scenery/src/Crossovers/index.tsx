import { crossoversCopy } from "./copy.js";

/**
 * The brick box and its shadow course, the roof's pale coping, the steel doors, and the pole
 * sign's paint: its red, the arrow's yellow, its cream lettering, the black of its frame, poles
 * and outlines, and the white letter-board.
 */
export type CrossoversPalette = {
  brick: string;
  brickDark: string;
  trim: string;
  pane: string;
  signRed: string;
  signYellow: string;
  signLetter: string;
  signInk: string;
  signBoard: string;
};

/**
 * Crossover's, out on the highway: traced off three photographs — the building from the lot
 * (crossovers-1), the pole sign in front of it (crossovers-2) and the sign lit at night
 * (crossovers-3). The building is nothing: a low, flat-roofed brick box about four times as
 * long as it is high, a pale coping along the roof and one orange-red fascia over its steel
 * doors. The pole sign is everything. It stands taller than the building is high twice over, on
 * two black posts: a banner across its top, a red panel with the yellow U-turn arrow — an arch
 * of road whose right leg ends in an arrowhead pointing down — over the name, and a white
 * letter-board under that.
 *
 * The banner is a parody and has to stay one: HENS, three times. The lettering is real lettering,
 * big and bold, because on this one the words are the joke. Left out on purpose: "Entertainment
 * Lounge" and the licence line (too small to read and nothing to laugh at), the road's dashed
 * centre line as separate dashes on the fascia's little logo, the wall lamps, the cedars and
 * shrubs along the front, the second fascia on the far end, and the parking lot.
 *
 * `scale` sizes it: at 1 it is the width and height below, in the caller's world units, with
 * the pole sign standing in front of the box's left end.
 */
export const CROSSOVERS = {
  width: 52,
  height: 37.6
} as const;

const SIGN_FONT = 'Anton, Impact, "Arial Narrow Bold", sans-serif';
const WALL_HEIGHT = 11;
/** The sign's own middle, out from `x`. */
const SIGN_X = 10;

export const Crossovers = ({
  x,
  baseY,
  palette,
  scale = 1
}: {
  x: number;
  baseY: number;
  palette: CrossoversPalette;
  scale?: number;
}): JSX.Element => {
  const { width } = CROSSOVERS;
  const { name, banner, marquee } = crossoversCopy;
  const [marqueeTop, marqueeBottom] = marquee;

  return (
    <g data-scenery-crossovers transform={`translate(${x} ${baseY}) scale(${scale})`}>
      {/* The box: brick, a coping, a darker soldier course, and the fascia over the doors. */}
      <rect x={10} y={-WALL_HEIGHT} width={width - 10} height={WALL_HEIGHT} fill={palette.brick} />
      <rect x={9.6} y={-WALL_HEIGHT - 0.9} width={width - 9.2} height={0.9} fill={palette.trim} />
      <rect x={10} y={-8.9} width={width - 10} height={0.6} fill={palette.brickDark} opacity={0.6} />
      <g fill={palette.pane}>
        <rect x={27} y={-5.6} width={4.6} height={5.6} />
        <rect x={33.2} y={-5.6} width={4.6} height={5.6} />
        <rect x={45.4} y={-5.6} width={3.6} height={5.6} />
      </g>
      <rect x={24.6} y={-8.1} width={20.6} height={2.4} fill={palette.signInk} />
      <rect x={24.9} y={-7.85} width={20} height={1.9} fill={palette.signRed} />
      <text
        x={32.4}
        y={-6.3}
        fontSize={1.7}
        fontFamily={SIGN_FONT}
        textAnchor="middle"
        textLength={11}
        lengthAdjust="spacingAndGlyphs"
        fill={palette.signLetter}
      >
        {name}
      </text>
      {/* The fascia's own little logo: a quarter of road coming round its right end. */}
      <path d="M 44.9 -5.95 L 42.3 -5.95 A 2.6 1.9 0 0 1 44.9 -7.85 Z" fill={palette.signInk} />
      <path d="M 43.4 -5.95 A 1.5 1.1 0 0 1 44.9 -7.05" fill="none" stroke={palette.signYellow} strokeWidth={0.3} />

      {/* The pole sign: two posts, then the letter-board, the panel and the banner stacked up them. */}
      <g fill={palette.signInk}>
        <rect x={3.2} y={-14.6} width={1} height={14.6} />
        <rect x={15.8} y={-14.6} width={1} height={14.6} />
        <rect x={0.4} y={-21.2} width={19.2} height={7} />
        <rect x={0} y={-33.6} width={20} height={12.8} />
        <rect x={-0.4} y={-37.6} width={20.8} height={4.4} />
      </g>
      <rect x={1} y={-20.6} width={18} height={5.8} fill={palette.signBoard} />
      <g fontFamily={SIGN_FONT} textAnchor="middle" fill={palette.signInk}>
        <text x={SIGN_X} y={-17.9} fontSize={2.4} textLength={14.4} lengthAdjust="spacingAndGlyphs">
          {marqueeTop}
        </text>
        <text x={SIGN_X} y={-15.25} fontSize={2.4} textLength={8} lengthAdjust="spacingAndGlyphs">
          {marqueeBottom}
        </text>
      </g>
      <rect x={0.6} y={-33} width={18.8} height={11.6} fill={palette.signRed} />
      <rect x={0.2} y={-37} width={19.6} height={3.2} fill={palette.signRed} />
      <text
        x={SIGN_X}
        y={-34.3}
        fontSize={2.6}
        fontFamily={SIGN_FONT}
        textAnchor="middle"
        textLength={17.4}
        lengthAdjust="spacingAndGlyphs"
        fill={palette.signYellow}
        stroke={palette.signInk}
        strokeWidth={0.45}
        paintOrder="stroke"
      >
        {banner}
      </text>
      {/* The U-turn: an arch of road, black with its yellow centre line, the right leg an arrow down. */}
      <path d="M 8 -24.9 L 8 -28.6 A 2.9 2.9 0 0 1 13.8 -28.6 L 13.8 -26.6" fill="none" stroke={palette.signInk} strokeWidth={2.3} />
      <path
        d="M 8 -24.9 L 8 -28.6 A 2.9 2.9 0 0 1 13.8 -28.6 L 13.8 -26.6"
        fill="none"
        stroke={palette.signYellow}
        strokeWidth={0.8}
        strokeDasharray="1 0.5"
      />
      <path d="M 12 -26.9 L 15.6 -26.9 L 13.8 -24.3 Z" fill={palette.signYellow} stroke={palette.signInk} strokeWidth={0.4} strokeLinejoin="round" />
      <text
        x={SIGN_X}
        y={-22.1}
        fontSize={2.9}
        fontFamily={SIGN_FONT}
        textAnchor="middle"
        textLength={17}
        lengthAdjust="spacingAndGlyphs"
        fill={palette.signLetter}
        stroke={palette.signInk}
        strokeWidth={0.55}
        paintOrder="stroke"
      >
        {name}
      </text>
    </g>
  );
};
