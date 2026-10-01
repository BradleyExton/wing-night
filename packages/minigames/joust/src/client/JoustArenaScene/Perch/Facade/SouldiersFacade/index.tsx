import { joustPalette } from "../../../palette.js";
import { facadeCopy } from "../copy.js";
import type { FacadeBox } from "../index.js";
import { SOULDIERS_SIGN_FONT, canLetter } from "../signage/index.js";

/**
 * A scatter of darker bricks laid by a fixed stride through the wall rather than at random, so the
 * tablet and the TV lay the same wall — the scenery's trick, thinned out for a wall this size.
 */
const resolveDarkBricks = (width: number, height: number): { x: number; y: number }[] => {
  const count = Math.max(0, Math.floor((width * height) / 70));

  return Array.from({ length: count }, (_unused, index) => ({
    x: 0.8 + ((index * 11.3) % Math.max(1, width - 2.8)),
    y: 1.2 + ((index * 5.7) % Math.max(1, height - 2.4))
  }));
};

/**
 * Souldiers Skate Shop's front, under the roofline the shelf has become: red brick with its scatter
 * of darker courses, the green sign band with SOULDIERS across it in the wordmark's bold, the big
 * display window on a white sill and the glazed door down at the sand. Traced in spirit off
 * `@wingnight/scenery`'s SouldiersSkateShop and squared up to the box the legs give it. The
 * lettering is on the band under the plank, below where a bird stands.
 */
export const SouldiersFacade = ({ width, height }: FacadeBox): JSX.Element => {
  const band = Math.min(4.6, Math.max(2.8, height * 0.18));
  const bandTop = Math.max(0.8, height * 0.05);
  const windowTop = bandTop + band + Math.max(1, height * 0.06);
  const sill = height - Math.max(2.2, height * 0.14);
  const doorWidth = Math.min(6, Math.max(3.2, width * 0.15));
  const doorLeft = width - doorWidth - Math.max(1.2, width * 0.05);
  const windowLeft = Math.max(1.2, width * 0.05);
  const windowRight = doorLeft - Math.max(1.4, width * 0.05);
  const windowWidth = Math.max(0, windowRight - windowLeft);
  const doorTop = Math.max(windowTop, height - Math.min(height - windowTop, 14));

  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill={joustPalette.souldiersBrick} />
      <g fill={joustPalette.souldiersBrickDark} opacity={0.42}>
        {resolveDarkBricks(width, height).map((brick) => (
          <rect key={`${brick.x}-${brick.y}`} x={brick.x} y={brick.y} width={1.9} height={0.75} />
        ))}
      </g>
      {/* The display bay: two tall panes in a dark frame, lit, on a white stone sill. */}
      {windowWidth > 3 && (
        <g>
          <rect x={windowLeft} y={windowTop} width={windowWidth} height={sill - windowTop} fill={joustPalette.signInk} />
          <rect x={windowLeft + 0.6} y={windowTop + 0.6} width={windowWidth / 2 - 0.9} height={sill - windowTop - 1.2} fill={joustPalette.glass} opacity={0.78} />
          <rect x={windowLeft + windowWidth / 2 + 0.3} y={windowTop + 0.6} width={windowWidth / 2 - 0.9} height={sill - windowTop - 1.2} fill={joustPalette.glass} opacity={0.78} />
          <rect x={windowLeft - 0.5} y={sill} width={windowWidth + 1} height={1.2} fill={joustPalette.lifeguard} />
        </g>
      )}
      {/* The door, set into a dark reveal and glazed nearly to its frame. */}
      <rect x={doorLeft - 0.5} y={doorTop - 0.5} width={doorWidth + 1} height={height - doorTop + 0.5} fill={joustPalette.souldiersBrickDark} />
      <rect x={doorLeft} y={doorTop} width={doorWidth} height={height - doorTop} fill={joustPalette.signInk} />
      <rect x={doorLeft + 0.6} y={doorTop + 0.6} width={doorWidth - 1.2} height={height - doorTop - 1.4} fill={joustPalette.glass} opacity={0.7} />
      {/* The sign band: the shop's green, with the wordmark across it when the span can hold it. */}
      <rect x={0} y={bandTop} width={width} height={band} fill={joustPalette.souldiersGreen} />
      {canLetter(width) && (
        <text
          x={width / 2}
          y={bandTop + band * 0.8}
          fontSize={band * 0.82}
          fontWeight={700}
          fontFamily={SOULDIERS_SIGN_FONT}
          textAnchor="middle"
          fill={joustPalette.signLetter}
          stroke={joustPalette.signInk}
          strokeWidth={0.22}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {facadeCopy.souldiers}
        </text>
      )}
    </g>
  );
};
