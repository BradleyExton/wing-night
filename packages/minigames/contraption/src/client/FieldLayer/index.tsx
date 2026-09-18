import {
  CONTRAPTION_CELL_UNITS,
  CONTRAPTION_FIELD_UNITS,
  CONTRAPTION_GRID_COLUMNS,
  CONTRAPTION_GRID_ROWS,
  type ContraptionMinigameLevelView,
  type ContraptionPlacedPiece,
  type ContraptionVec2
} from "@wingnight/shared";

import { FLOOR_Y, toPieceSegment } from "../../runtime/geometry/index.js";
import { PICKUP_COLLECT_RADIUS } from "../../runtime/types/index.js";
import { Drumette } from "../scene/index.js";
import { fieldLayerCopy } from "./copy.js";

// The physical scene in FIELD UNITS (0–100), as one SVG group. The host draws
// it inside a square viewBox with the grid on; the display embeds it in the
// Sidestage scenery. One drawing, so the plan the team taps in on the tablet
// is the plan the room sees — and the run replays over the same geometry it
// was simulated on.

const COLORS = {
  grid: "rgba(226, 232, 240, 0.12)",
  frame: "rgba(226, 232, 240, 0.35)",
  obstacle: "#64748b",
  piece: "#f97316",
  pieceEdge: "#7c2d12",
  bucket: "#94a3b8",
  bucketRim: "#e2e8f0",
  bucketInside: "rgba(15, 23, 42, 0.55)",
  pickup: "#fbbf24",
  pickupLit: "#fde68a",
  trail: "rgba(255, 213, 128, 0.55)",
  tapTarget: "transparent"
} as const;

const PICKUP_RADIUS_UNITS = 2.2;

export type FieldLayerProps = {
  level: ContraptionMinigameLevelView;
  pieces: ContraptionPlacedPiece[];
  // `null` draws the wing at its start — in the thrower's hand.
  wingPosition: ContraptionVec2 | null;
  // Positions played so far; drawn as the trail and used to light pickups as
  // the wing reaches them rather than all at once when the run is graded.
  trail?: ContraptionVec2[];
  collectedPickupIds?: string[];
  showGrid?: boolean;
  showFrame?: boolean;
  // The cleaner has it — the floor is empty from here on.
  hideWing?: boolean;
  onCellTap?: (column: number, row: number) => void;
};

const isNear = (left: ContraptionVec2, right: ContraptionVec2, radius: number): boolean => {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;

  return deltaX * deltaX + deltaY * deltaY <= radius * radius;
};

const GRID_COLUMNS = Array.from({ length: CONTRAPTION_GRID_COLUMNS }, (_unused, index) => index);

const GRID_ROWS = Array.from({ length: CONTRAPTION_GRID_ROWS }, (_unused, index) => index);

const GridLines = (): JSX.Element => {
  return (
    <g stroke={COLORS.grid} strokeWidth={0.3}>
      {GRID_COLUMNS.slice(1).map((column) => (
        <line
          key={`column-${column}`}
          x1={column * CONTRAPTION_CELL_UNITS}
          y1={0}
          x2={column * CONTRAPTION_CELL_UNITS}
          y2={FLOOR_Y}
        />
      ))}
      {GRID_ROWS.slice(1).map((row) => (
        <line
          key={`row-${row}`}
          x1={0}
          y1={row * CONTRAPTION_CELL_UNITS}
          x2={CONTRAPTION_FIELD_UNITS}
          y2={row * CONTRAPTION_CELL_UNITS}
        />
      ))}
    </g>
  );
};

const Bucket = ({ level }: { level: ContraptionMinigameLevelView }): JSX.Element => {
  const { bucket } = level;
  const topY = FLOOR_Y - bucket.height;

  return (
    <g>
      <rect
        x={bucket.x}
        y={topY}
        width={bucket.width}
        height={bucket.height}
        fill={COLORS.bucketInside}
      />
      <path
        d={`M ${bucket.x} ${topY} L ${bucket.x} ${FLOOR_Y} L ${bucket.x + bucket.width} ${FLOOR_Y} L ${bucket.x + bucket.width} ${topY}`}
        fill="none"
        stroke={COLORS.bucket}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <rect
        x={bucket.x - 1.2}
        y={topY - 1.2}
        width={bucket.width + 2.4}
        height={2.4}
        rx={1.2}
        fill={COLORS.bucketRim}
      />
    </g>
  );
};

export const FieldLayer = ({
  level,
  pieces,
  wingPosition,
  trail,
  collectedPickupIds = [],
  showGrid = false,
  showFrame = false,
  hideWing = false,
  onCellTap
}: FieldLayerProps): JSX.Element => {
  const wingAt = wingPosition ?? { x: level.wing.x, y: level.wing.y };

  return (
    <g>
      {showGrid ? <GridLines /> : null}
      {showFrame ? (
        <g stroke={COLORS.frame} strokeWidth={0.8} strokeLinecap="round">
          <line x1={0} y1={FLOOR_Y} x2={CONTRAPTION_FIELD_UNITS} y2={FLOOR_Y} />
          <line x1={2} y1={0} x2={2} y2={FLOOR_Y} />
          <line
            x1={CONTRAPTION_FIELD_UNITS - 2}
            y1={0}
            x2={CONTRAPTION_FIELD_UNITS - 2}
            y2={FLOOR_Y}
          />
        </g>
      ) : null}

      {level.obstacles.map((obstacle) => (
        <line
          key={obstacle.id}
          x1={obstacle.from.x}
          y1={obstacle.from.y}
          x2={obstacle.to.x}
          y2={obstacle.to.y}
          stroke={COLORS.obstacle}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      ))}

      <Bucket level={level} />

      {level.pickups.map((pickup) => {
        const reached =
          collectedPickupIds.includes(pickup.id) &&
          (trail === undefined ||
            trail.some((position) => isNear(position, pickup, PICKUP_COLLECT_RADIUS)));

        return (
          <g key={pickup.id} data-contraption-pickup={reached ? "lit" : "waiting"}>
            <circle
              cx={pickup.x}
              cy={pickup.y}
              r={PICKUP_RADIUS_UNITS}
              fill={reached ? COLORS.pickupLit : "none"}
              stroke={COLORS.pickup}
              strokeWidth={0.7}
              opacity={reached ? 1 : 0.85}
            />
            <text
              x={pickup.x}
              y={pickup.y - PICKUP_RADIUS_UNITS - 1}
              textAnchor="middle"
              fontSize={3.2}
              fontWeight={800}
              fill={COLORS.pickup}
            >
              {fieldLayerCopy.pickupLabel(pickup.points)}
            </text>
          </g>
        );
      })}

      {pieces.map((piece) => {
        const segment = toPieceSegment(piece);

        return (
          <g key={segment.id} data-contraption-piece={piece.kind}>
            <line
              x1={segment.from.x}
              y1={segment.from.y}
              x2={segment.to.x}
              y2={segment.to.y}
              stroke={COLORS.pieceEdge}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <line
              x1={segment.from.x}
              y1={segment.from.y}
              x2={segment.to.x}
              y2={segment.to.y}
              stroke={COLORS.piece}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {trail !== undefined && trail.length > 1 ? (
        <polyline
          points={trail.map((position) => `${position.x},${position.y}`).join(" ")}
          fill="none"
          stroke={COLORS.trail}
          strokeWidth={0.9}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}

      {hideWing ? null : (
        <g transform={`translate(${wingAt.x}, ${wingAt.y})`} data-contraption-wing>
          <Drumette radius={level.wing.radius} />
        </g>
      )}

      {onCellTap === undefined
        ? null
        : GRID_ROWS.map((row) =>
            GRID_COLUMNS.map((column) => (
              <rect
                key={`tap-${column}-${row}`}
                role="button"
                aria-label={fieldLayerCopy.cellLabel(column, row)}
                x={column * CONTRAPTION_CELL_UNITS}
                y={row * CONTRAPTION_CELL_UNITS}
                width={CONTRAPTION_CELL_UNITS}
                height={CONTRAPTION_CELL_UNITS}
                fill={COLORS.tapTarget}
                onClick={(): void => {
                  onCellTap(column, row);
                }}
              />
            ))
          )}
    </g>
  );
};
