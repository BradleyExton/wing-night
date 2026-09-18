import {
  CONTRAPTION_CELL_UNITS,
  CONTRAPTION_FIELD_UNITS,
  type ContraptionLayout,
  type ContraptionLevel,
  type ContraptionPieceKind,
  type ContraptionPlacedPiece,
  type ContraptionSegment
} from "@wingnight/shared";

import {
  FIELD_GRAVITY,
  WING_RADIUS,
  WING_RESTITUTION,
  WING_SLIP
} from "../types/index.js";

// The frame every level stands in: a floor two units up from the bottom edge
// and a wall two units in from each side, so a wing never leaves the field.
export const FLOOR_Y = CONTRAPTION_FIELD_UNITS - 2;

const WALL_INSET = 2;

export const WING_BODY_ID = "wing";

export const PIECE_SEGMENT_ID_PREFIX = "piece-";

export const BUCKET_SEGMENT_ID_PREFIX = "bucket-";

type CellOffsets = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

// Each kind is one straight segment inside its cell, as fractions of the cell.
// "right" means the wing rolls to the right — the segment descends that way.
const CELL_OFFSETS_BY_KIND: Record<ContraptionPieceKind, CellOffsets> = {
  shelf: { fromX: 0, fromY: 0.5, toX: 1, toY: 0.5 },
  "slope-right": { fromX: 0, fromY: 0.3, toX: 1, toY: 0.7 },
  "slope-left": { fromX: 0, fromY: 0.7, toX: 1, toY: 0.3 },
  "steep-right": { fromX: 0, fromY: 0, toX: 1, toY: 1 },
  "steep-left": { fromX: 0, fromY: 1, toX: 1, toY: 0 }
};

export const pieceSegmentId = (piece: ContraptionPlacedPiece): string => {
  return `${PIECE_SEGMENT_ID_PREFIX}${piece.column}-${piece.row}`;
};

export const toPieceSegment = (piece: ContraptionPlacedPiece): ContraptionSegment => {
  const offsets = CELL_OFFSETS_BY_KIND[piece.kind];
  const cellX = piece.column * CONTRAPTION_CELL_UNITS;
  const cellY = piece.row * CONTRAPTION_CELL_UNITS;

  return {
    id: pieceSegmentId(piece),
    from: {
      x: cellX + offsets.fromX * CONTRAPTION_CELL_UNITS,
      y: cellY + offsets.fromY * CONTRAPTION_CELL_UNITS
    },
    to: {
      x: cellX + offsets.toX * CONTRAPTION_CELL_UNITS,
      y: cellY + offsets.toY * CONTRAPTION_CELL_UNITS
    }
  };
};

export const toBucketSegments = (level: ContraptionLevel): ContraptionSegment[] => {
  const { bucket } = level;
  const topY = FLOOR_Y - bucket.height;

  return [
    {
      id: `${BUCKET_SEGMENT_ID_PREFIX}left`,
      from: { x: bucket.x, y: FLOOR_Y },
      to: { x: bucket.x, y: topY }
    },
    {
      id: `${BUCKET_SEGMENT_ID_PREFIX}right`,
      from: { x: bucket.x + bucket.width, y: FLOOR_Y },
      to: { x: bucket.x + bucket.width, y: topY }
    }
  ];
};

export const FRAME_SEGMENTS: readonly ContraptionSegment[] = [
  { id: "floor", from: { x: 0, y: FLOOR_Y }, to: { x: CONTRAPTION_FIELD_UNITS, y: FLOOR_Y } },
  { id: "wall-left", from: { x: WALL_INSET, y: 0 }, to: { x: WALL_INSET, y: FLOOR_Y } },
  {
    id: "wall-right",
    from: { x: CONTRAPTION_FIELD_UNITS - WALL_INSET, y: 0 },
    to: { x: CONTRAPTION_FIELD_UNITS - WALL_INSET, y: FLOOR_Y }
  }
];

// The whole physical scene for one run: frame, bucket, the level's fixed
// obstacles, the team's pieces, and the wing with its throw. Pure — the same
// level and pieces always build the same layout, which is what makes a run a
// function of (layout, seed) and nothing else.
export const buildLayout = (
  level: ContraptionLevel,
  pieces: readonly ContraptionPlacedPiece[]
): ContraptionLayout => {
  return {
    gravity: { x: FIELD_GRAVITY.x, y: FIELD_GRAVITY.y },
    segments: [
      ...FRAME_SEGMENTS,
      ...toBucketSegments(level),
      ...(level.obstacles ?? []).map((obstacle) => ({
        id: `obstacle-${obstacle.id}`,
        from: { x: obstacle.from.x, y: obstacle.from.y },
        to: { x: obstacle.to.x, y: obstacle.to.y }
      })),
      ...pieces.map(toPieceSegment)
    ],
    bodies: [
      {
        id: WING_BODY_ID,
        origin: { x: level.wing.x, y: level.wing.y },
        radius: WING_RADIUS,
        restitution: WING_RESTITUTION,
        slip: WING_SLIP,
        initialVelocity: { x: level.wing.velocity.x, y: level.wing.velocity.y }
      }
    ]
  };
};
