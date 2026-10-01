import { joustPalette } from "../../../palette.js";
import { facadeCopy } from "../copy.js";
import type { FacadeBox } from "../index.js";
import { QUEENS_SIGN_FONT, canLetter } from "../signage/index.js";

/** The dark green fascia across the top of the wall, between a fifth and a sixth of its height. */
const resolveFasciaHeight = (height: number): number => Math.min(4.2, Math.max(2.6, height * 0.16));

/** The white posts carrying the balcony stand about nine units apart, one hard against each end. */
const POST_SPACING = 9;
const POST_WIDTH = 0.9;

/**
 * The Queen's Hotel's ground floor, under the balcony the shelf has become: buff brick behind a
 * row of white posts, a dark green fascia along the top with QUEENS on it in the hotel's cream
 * serif, and arched openings between the posts holding the evening's light. Traced in spirit off
 * `@wingnight/scenery`'s QueensHotel — the fascia, the posts and the arches are its — flattened to
 * the one storey a shelf has room for. The lettering sits on the wall, under the plank, so it is
 * never behind a bird standing on the balcony.
 */
export const QueensFacade = ({ width, height }: FacadeBox): JSX.Element => {
  const fascia = resolveFasciaHeight(height);
  const postCount = Math.max(2, Math.round(width / POST_SPACING) + 1);
  const postStep = (width - POST_WIDTH) / (postCount - 1);
  const posts = Array.from({ length: postCount }, (_unused, index) => index * postStep);
  const openingTop = fascia + 0.6 + Math.max(1.4, (height - fascia) * 0.14);
  const openingBottom = height;

  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill={joustPalette.queensBuff} />
      {/* The arched openings between the posts, lit from inside for the evening. */}
      <g fill={joustPalette.glass} opacity={0.72}>
        {posts.slice(0, -1).map((post, index) => {
          const left = post + POST_WIDTH + 1.1;
          const right = (posts[index + 1] ?? width) - 1.1;
          const arch = Math.min((right - left) / 2, 2.6);

          if (right - left < 2) {
            return null;
          }

          return (
            <path
              key={post}
              d={`M ${left} ${openingBottom} L ${left} ${openingTop + arch} Q ${(left + right) / 2} ${openingTop - arch * 0.6} ${right} ${openingTop + arch} L ${right} ${openingBottom} Z`}
            />
          );
        })}
      </g>
      <g fill={joustPalette.lifeguard}>
        {posts.map((post) => (
          <rect key={post} x={post} y={fascia} width={POST_WIDTH} height={height - fascia} />
        ))}
        <rect x={0} y={fascia} width={width} height={0.7} />
      </g>
      {/* The fascia: the hotel's dark green, carrying the name when the span can hold it. */}
      <rect x={0} y={0} width={width} height={fascia} fill={joustPalette.queensGreen} />
      <rect x={0} y={fascia - 0.35} width={width} height={0.35} fill={joustPalette.queensBuffDark} opacity={0.6} />
      {canLetter(width) && (
        <text
          x={width / 2}
          y={fascia * 0.76}
          fontSize={fascia * 0.68}
          fontWeight={900}
          fontFamily={QUEENS_SIGN_FONT}
          textAnchor="middle"
          fill={joustPalette.queensCream}
        >
          {facadeCopy.queens}
        </text>
      )}
    </g>
  );
};
