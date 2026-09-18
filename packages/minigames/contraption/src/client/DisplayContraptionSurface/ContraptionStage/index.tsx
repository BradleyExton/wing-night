import { useMemo } from "react";
import {
  CONTRAPTION_FIELD_UNITS,
  type ContraptionMinigameDisplayView,
  type ContraptionVec2
} from "@wingnight/shared";

import { FLOOR_Y } from "../../../runtime/geometry/index.js";
import { FieldLayer } from "../../FieldLayer/index.js";
import { hasPickedUp, isStooping, resolveCleanerX } from "../../cleanerWalk/index.js";
import {
  resolveRunSequence,
  resolveTrackPositions,
  type RunSequencePosition
} from "../../runSequence/index.js";
import { Balcony, Cleaner, SeatedThrower, Table } from "../../scene/index.js";
import * as styles from "./styles.js";

// Sidestage, re-cut: the thrower SITS AT A TABLE eating wings, well above the
// contraption field, facing away from it, and tosses the wing backward over
// their shoulder — so the machine sits behind and below them and the whole
// throw traverses the stage. The field is the physics field, one-to-one; the
// thrower's shoulder is placed ON the wing's start so the release reads as a
// hand-off rather than a teleport.
const STAGE_WIDTH = 960;

const STAGE_HEIGHT = 540;

const FIELD_SCALE = 4.4;

const FIELD_ORIGIN = { x: 430, y: 70 } as const;

const FLOOR_PX = FIELD_ORIGIN.y + FLOOR_Y * FIELD_SCALE;

const TABLE_WIDTH = 190;

// The seated thrower's feet, below the shoulder; the balcony slab sits there.
const SEAT_DROP_PX = 84;

const TABLE_TOP_DROP_PX = 26;

// Field-unit x of the left wall, where the balcony's front face lands.
const LEFT_WALL_UNITS = 2;

const BALCONY_REACH_PX = 250;

// The cleaner stops a step to the right of the wing, her feet on the floor.
const CLEANER_REST_OFFSET_PX = 42;

const CLEANER_FEET_OFFSET_PX = 58;

const COLORS = {
  background: "#0f172a",
  floor: "#1e293b",
  fieldWash: "rgba(2, 6, 23, 0.45)"
} as const;

const toStage = (position: ContraptionVec2): ContraptionVec2 => {
  return {
    x: FIELD_ORIGIN.x + position.x * FIELD_SCALE,
    y: FIELD_ORIGIN.y + position.y * FIELD_SCALE
  };
};

type ContraptionStageProps = {
  view: ContraptionMinigameDisplayView;
  elapsedMs: number;
};

export const resolveStageSequence = (
  view: ContraptionMinigameDisplayView,
  elapsedMs: number
): RunSequencePosition | null => {
  return view.run === null ? null : resolveRunSequence(elapsedMs, view.run);
};

export const ContraptionStage = ({ view, elapsedMs }: ContraptionStageProps): JSX.Element => {
  const { level, run } = view;
  const positions = useMemo(() => (run === null ? [] : resolveTrackPositions(run)), [run]);

  if (level === null) {
    return <svg viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} className={styles.svg} role="img" />;
  }

  const sequence = resolveStageSequence(view, elapsedMs);
  const trail = sequence === null ? undefined : positions.slice(0, sequence.frameIndex + 1);
  const wingPosition = sequence === null ? null : (positions[sequence.frameIndex] ?? null);
  const shoulder = toStage({ x: level.wing.x, y: level.wing.y });
  const holding = sequence === null || sequence.frameIndex === 0;
  const cleanupProgress = sequence?.stage === "cleanup" ? sequence.cleanupProgress : null;
  const finalWing = toStage(positions[positions.length - 1] ?? { x: level.wing.x, y: level.wing.y });
  const wingTaken =
    sequence !== null && sequence.stage !== "flight" && run !== null && run.outcome !== "landed"
      ? hasPickedUp(sequence.cleanupProgress) || sequence.stage === "held"
      : false;

  return (
    <svg
      viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
      className={styles.svg}
      role="img"
      data-contraption-stage={sequence?.stage ?? "building"}
    >
      <rect x={0} y={0} width={STAGE_WIDTH} height={STAGE_HEIGHT} fill={COLORS.background} />
      <rect
        x={FIELD_ORIGIN.x}
        y={FIELD_ORIGIN.y}
        width={CONTRAPTION_FIELD_UNITS * FIELD_SCALE}
        height={FLOOR_Y * FIELD_SCALE}
        fill={COLORS.fieldWash}
      />
      <rect x={0} y={FLOOR_PX} width={STAGE_WIDTH} height={8} rx={4} fill={COLORS.floor} />

      <g
        transform={`translate(${FIELD_ORIGIN.x + LEFT_WALL_UNITS * FIELD_SCALE}, ${shoulder.y + SEAT_DROP_PX})`}
      >
        <Balcony
          reach={BALCONY_REACH_PX}
          drop={FLOOR_PX - (shoulder.y + SEAT_DROP_PX) - 14}
        />
      </g>
      <g transform={`translate(${shoulder.x - TABLE_WIDTH - 12}, ${shoulder.y + TABLE_TOP_DROP_PX})`}>
        <Table width={TABLE_WIDTH} legHeight={SEAT_DROP_PX - TABLE_TOP_DROP_PX - 12} />
      </g>
      <g transform={`translate(${shoulder.x}, ${shoulder.y})`}>
        <SeatedThrower holding={holding} />
      </g>

      <g transform={`translate(${FIELD_ORIGIN.x}, ${FIELD_ORIGIN.y}) scale(${FIELD_SCALE})`}>
        <FieldLayer
          level={level}
          pieces={view.pieces}
          wingPosition={wingPosition}
          trail={trail}
          collectedPickupIds={run?.collectedPickupIds ?? []}
          showFrame
          hideWing={wingTaken}
        />
      </g>

      {cleanupProgress !== null ? (
        <g
          transform={`translate(${resolveCleanerX(
            cleanupProgress,
            STAGE_WIDTH,
            finalWing.x + CLEANER_REST_OFFSET_PX
          )}, ${FLOOR_PX - CLEANER_FEET_OFFSET_PX})`}
          data-contraption-cleaner
        >
          <Cleaner stooping={isStooping(cleanupProgress)} carrying={hasPickedUp(cleanupProgress)} />
        </g>
      ) : null}
    </svg>
  );
};
