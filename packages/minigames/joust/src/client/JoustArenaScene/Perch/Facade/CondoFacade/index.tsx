import { joustPalette } from "../../../palette.js";
import type { FacadeBox } from "../index.js";

/** A storey of the condo is about four and a half units; the slab count follows the height. */
const FLOOR_HEIGHT = 4.5;
/** Three glass stacks fit across a wide shelf; a narrow one keeps the two at its corners. */
const THREE_STACK_MIN_WIDTH = 36;

/**
 * One of the waterfront condos, the storeys under a balcony the shelf has become: a cream wall
 * with blue-glass balcony stacks running its full height — two at the corners, a third down the
 * middle when the span is wide enough — each crossed by a cream slab per floor so the glass reads
 * as balconies and not a stripe, and a darker podium at the sand with the lobby lit. Traced in
 * spirit off `@wingnight/scenery`'s WaterfrontCondos, which is how the room already knows the
 * pair: cream towers with blue edges.
 */
export const CondoFacade = ({ width, height }: FacadeBox): JSX.Element => {
  const stackWidth = Math.min(6.5, Math.max(2.6, width * 0.13));
  const podium = Math.min(4.2, Math.max(2.2, height * 0.12));
  const stackBottom = height - podium;
  const stacks =
    width >= THREE_STACK_MIN_WIDTH
      ? [0.6, width / 2 - stackWidth / 2, width - stackWidth - 0.6]
      : [0.6, width - stackWidth - 0.6];
  const floors = Math.max(2, Math.round(stackBottom / FLOOR_HEIGHT));
  const floorHeight = stackBottom / floors;
  const lobbyWidth = Math.min(width * 0.4, 12);

  return (
    <g>
      <rect x={0} y={0} width={width} height={height} fill={joustPalette.condoCream} />
      {/* The balcony stacks: glass the full height, in blue with the dusk in it. */}
      <g fill={joustPalette.condoBalconyGlass}>
        {stacks.map((stack) => (
          <rect key={stack} x={stack} y={0.8} width={stackWidth} height={stackBottom - 0.8} />
        ))}
      </g>
      {/* A balcony slab across every stack on every floor. */}
      <g fill={joustPalette.condoCream}>
        {Array.from({ length: floors }, (_unused, floor) =>
          stacks.map((stack) => (
            <rect
              key={`${floor}-${stack}`}
              x={stack - 0.2}
              y={0.8 + (floor + 0.72) * floorHeight}
              width={stackWidth + 0.4}
              height={0.45}
            />
          ))
        )}
      </g>
      {/* The podium at the sand, and the lobby's glass lit in the middle of it. */}
      <rect x={0} y={stackBottom} width={width} height={podium} fill={joustPalette.condoCreamDark} />
      <rect x={0} y={stackBottom - 0.3} width={width} height={0.6} fill={joustPalette.condoCream} />
      <rect
        x={width / 2 - lobbyWidth / 2}
        y={stackBottom + 0.7}
        width={lobbyWidth}
        height={podium - 0.7}
        fill={joustPalette.glass}
        opacity={0.7}
      />
    </g>
  );
};
