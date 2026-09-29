import { souldiersSkateShopCopy } from "./copy.js";

/** The brick, its darker courses, the sill, the display glass, and the sign's four paints. */
export type SouldiersSkateShopPalette = {
  brick: string;
  brickDark: string;
  trim: string;
  pane: string;
  signGreen: string;
  signGreenLight: string;
  signInk: string;
  signLetter: string;
};

/**
 * Souldiers Skate Shop, on Dunlop Street: the start line. Traced off two photographs of the
 * storefront from the sidewalk (soulders-skateshop-1 and -2). It is one storey of red-brown
 * brick with a flat parapet: a window bay of two tall panes about as wide as the wall is high,
 * and the door a pier's width to the right of it. The real wall is about twice its door's
 * height; this door is drawn taller, up to the window heads, because a hen has to come out of it. The sign is the whole identity: a green graffiti wordmark, outlined
 * in black and then in white like a sticker, tilted up to the right, riding on a black "Skate
 * Shop" plate and standing proud of the roofline.
 *
 * Solid shapes, and the sign as lettering, because at the size this stands on a TV the name IS
 * the landmark and a drawn blob with letter hints reads as a bush. Left out on purpose: every
 * poster and decal in the glass (the skater photo, the phone number, the web address), the
 * individual brick joints (a scatter of darker bricks says brick without becoming a mesh), the
 * roof clips along the parapet, the neighbouring screen-printer's bay and the salon next door.
 *
 * This one is a set piece rather than a backdrop — the hen rolls out of its door — so it is
 * drawn nearer and bigger than the waterfront, and it tells the scene where that door is.
 * `scale` sizes it: at 1 it is the width and height below, in the caller's world units.
 */
export const SOULDIERS_SKATE_SHOP = {
  width: 40,
  height: 31,
  /** The middle of the door's opening, out from `x`: where a runner stands to roll out of it. */
  doorX: 30.5,
  doorWidth: 5.8,
  doorHeight: 16.4
} as const;

/** Where the door's middle stands in the caller's world, for a shop stood at `x` and `scale`. */
export const resolveSouldiersDoorX = (x: number, scale = 1): number => x + SOULDIERS_SKATE_SHOP.doorX * scale;

const WALL_HEIGHT = 24;
const WORDMARK_FONT = 'Bangers, "Permanent Marker", Impact, sans-serif';
const PLATE_FONT = 'Fredoka, "Arial Rounded MT Bold", ui-sans-serif, sans-serif';

/**
 * A scatter of darker bricks, laid by a fixed stride through the facade rather than at random,
 * so the tablet and the TV lay the same wall.
 */
const DARK_BRICKS = Array.from({ length: 34 }, (_unused, index) => ({
  x: 0.6 + ((index * 11.3) % 37.4),
  y: -1.4 - ((index * 5.7) % 21.8)
}));

export const SouldiersSkateShop = ({
  x,
  baseY,
  palette,
  scale = 1
}: {
  x: number;
  baseY: number;
  palette: SouldiersSkateShopPalette;
  scale?: number;
}): JSX.Element => {
  const { width, doorX, doorWidth, doorHeight } = SOULDIERS_SKATE_SHOP;
  const doorLeft = doorX - doorWidth / 2;
  const { wordmark, plate } = souldiersSkateShopCopy;
  /** The wordmark's three coats — white rim, black outline, green face — share one baseline. */
  const wordmarkProps = {
    x: 14.6,
    y: -23.4,
    fontSize: 7.2,
    fontFamily: WORDMARK_FONT,
    textAnchor: "middle" as const,
    textLength: 25,
    lengthAdjust: "spacingAndGlyphs" as const
  };

  return (
    <g data-scenery-souldiers transform={`translate(${x} ${baseY}) scale(${scale})`}>
      <rect x={0} y={-WALL_HEIGHT} width={width} height={WALL_HEIGHT} fill={palette.brick} />
      <g fill={palette.brickDark} opacity={0.45}>
        {DARK_BRICKS.map((brick) => (
          <rect key={`${brick.x}-${brick.y}`} x={brick.x} y={brick.y} width={1.9} height={0.75} />
        ))}
      </g>
      {/* The parapet: a flat cap, one course proud of the wall. */}
      <rect x={-0.4} y={-WALL_HEIGHT - 0.8} width={width + 0.8} height={1.2} fill={palette.brickDark} />
      {/* The display bay: two tall panes in a dark frame, on a white stone sill. */}
      <rect x={2.6} y={-18.8} width={19.6} height={15} fill={palette.signInk} />
      <rect x={3.3} y={-18.1} width={8.75} height={13.6} fill={palette.pane} />
      <rect x={12.75} y={-18.1} width={8.75} height={13.6} fill={palette.pane} />
      <path d="M 4.6 -9 L 9.4 -17.4 L 11.2 -17.4 L 6.4 -9 Z" fill={palette.signLetter} opacity={0.14} />
      <path d="M 14.1 -9 L 18.9 -17.4 L 20.7 -17.4 L 15.9 -9 Z" fill={palette.signLetter} opacity={0.14} />
      <rect x={2} y={-4} width={20.8} height={1.4} fill={palette.trim} />
      {/* The door, set into a dark reveal, glazed nearly to its frame. */}
      <rect x={doorLeft - 0.6} y={-doorHeight - 0.6} width={doorWidth + 1.2} height={doorHeight + 0.6} fill={palette.brickDark} />
      <rect x={doorLeft} y={-doorHeight} width={doorWidth} height={doorHeight} fill={palette.signInk} />
      <rect x={doorLeft + 0.7} y={-doorHeight + 0.7} width={doorWidth - 1.4} height={doorHeight - 1.6} fill={palette.pane} />
      {/* The sign. The plate first, then the wordmark riding over its top edge. */}
      <rect x={5.6} y={-22.7} width={15.6} height={3.7} rx={0.7} fill={palette.signInk} />
      <text
        x={13.4}
        y={-19.9}
        fontSize={2.7}
        fontWeight={700}
        fontFamily={PLATE_FONT}
        textAnchor="middle"
        textLength={12.6}
        lengthAdjust="spacingAndGlyphs"
        fill={palette.signLetter}
      >
        {plate}
      </text>
      <g transform="rotate(-7 14.6 -25)">
        <text {...wordmarkProps} fill={palette.signLetter} stroke={palette.signLetter} strokeWidth={2.6} strokeLinejoin="round">
          {wordmark}
        </text>
        <text {...wordmarkProps} fill={palette.signInk} stroke={palette.signInk} strokeWidth={1.1} strokeLinejoin="round">
          {wordmark}
        </text>
        {/* A lighter face under a shifted darker one leaves a lit rim up each letter's top-left:
            the bubble's roundness, in two flat coats. */}
        <text {...wordmarkProps} fill={palette.signGreenLight}>
          {wordmark}
        </text>
        <text {...wordmarkProps} x={wordmarkProps.x + 0.22} y={wordmarkProps.y + 0.28} fill={palette.signGreen}>
          {wordmark}
        </text>
        {/* The drip off the last letter, which is how the room knows it is graffiti. */}
        <path
          d="M 25.6 -23.8 C 26.8 -22.8 26.4 -21.2 27.6 -20 C 28.2 -19.4 28.8 -20 28.4 -20.8 C 27.8 -22 28 -23.2 27.2 -24.2 Z"
          fill={palette.signGreen}
          stroke={palette.signInk}
          strokeWidth={0.45}
        />
      </g>
    </g>
  );
};
