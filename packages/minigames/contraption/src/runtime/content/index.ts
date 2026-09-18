import {
  isContraptionContentFile,
  isContraptionLevel,
  type ContraptionLevel,
  type ContraptionPlacedPiece
} from "@wingnight/shared";
import { createPromptContentAdapter } from "@wingnight/minigames-core";

export const clonePlacedPiece = (piece: ContraptionPlacedPiece): ContraptionPlacedPiece => {
  return { kind: piece.kind, column: piece.column, row: piece.row };
};

// Re-adds every known field by hand, on purpose: that is what stops an
// unknown key riding into room state. The solution IS copied — it lives in
// server-side content and the projections drop it, never the adapter.
const cloneLevel = (level: ContraptionLevel): ContraptionLevel => {
  return {
    id: level.id,
    title: level.title,
    wing: {
      x: level.wing.x,
      y: level.wing.y,
      velocity: { x: level.wing.velocity.x, y: level.wing.velocity.y }
    },
    bucket: {
      x: level.bucket.x,
      width: level.bucket.width,
      height: level.bucket.height
    },
    ...(level.obstacles === undefined
      ? {}
      : {
          obstacles: level.obstacles.map((obstacle) => ({
            id: obstacle.id,
            from: { x: obstacle.from.x, y: obstacle.from.y },
            to: { x: obstacle.to.x, y: obstacle.to.y }
          }))
        }),
    ...(level.pickups === undefined
      ? {}
      : {
          pickups: level.pickups.map((pickup) => ({
            id: pickup.id,
            x: pickup.x,
            y: pickup.y,
            points: pickup.points
          }))
        }),
    pieceBudget: level.pieceBudget,
    pointsLanded: level.pointsLanded,
    solution: level.solution.map(clonePlacedPiece)
  };
};

export const contraptionContentAdapter = createPromptContentAdapter<ContraptionLevel>({
  label: "contraption",
  fileName: "minigames/contraption.json",
  invalidContentHint:
    "expected { prompts: [{ id, title, wing, bucket, pieceBudget, pointsLanded, solution }] } with unique, non-empty ids.",
  isContentFile: isContraptionContentFile,
  isPrompt: isContraptionLevel,
  clonePrompt: cloneLevel
});

export const cloneContraptionLevel = contraptionContentAdapter.clonePrompt;
export const parseContraptionContentFile = contraptionContentAdapter.parseFileContent;
export const resolveContraptionContent = contraptionContentAdapter.resolveContent;
