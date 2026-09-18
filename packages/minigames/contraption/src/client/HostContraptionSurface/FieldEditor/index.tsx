import { useMemo } from "react";
import type {
  ContraptionMinigameLevelView,
  ContraptionMinigameRun,
  ContraptionPlacedPiece
} from "@wingnight/shared";

import { FieldLayer } from "../../FieldLayer/index.js";
import { resolveRunSequence, resolveTrackPositions } from "../../runSequence/index.js";
import * as styles from "./styles.js";

type FieldEditorProps = {
  level: ContraptionMinigameLevelView;
  pieces: ContraptionPlacedPiece[];
  run: ContraptionMinigameRun | null;
  elapsedMs: number;
  canBuild: boolean;
  onCellTap: (column: number, row: number) => void;
};

// The tablet's view of the field: the grid while building, the same replay
// the TV shows once a run exists. Read-only during a run — the server owns
// the outcome, the tablet just watches it too.
export const FieldEditor = ({
  level,
  pieces,
  run,
  elapsedMs,
  canBuild,
  onCellTap
}: FieldEditorProps): JSX.Element => {
  const positions = useMemo(() => (run === null ? [] : resolveTrackPositions(run)), [run]);
  const sequence = run === null ? null : resolveRunSequence(elapsedMs, run);
  const trail = sequence === null ? undefined : positions.slice(0, sequence.frameIndex + 1);
  const wingPosition = sequence === null ? null : (positions[sequence.frameIndex] ?? null);

  return (
    <div className={styles.frame} data-contraption-field-editor>
      <svg viewBox="0 0 100 100" className={styles.svg} role="img">
        <FieldLayer
          level={level}
          pieces={pieces}
          wingPosition={wingPosition}
          trail={trail}
          collectedPickupIds={run?.collectedPickupIds ?? []}
          showGrid={run === null}
          showFrame
          onCellTap={canBuild ? onCellTap : undefined}
        />
      </svg>
    </div>
  );
};
