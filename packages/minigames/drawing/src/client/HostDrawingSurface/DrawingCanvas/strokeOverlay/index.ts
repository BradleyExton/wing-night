import type { DrawingStroke } from "@wingnight/shared";

// Ended strokes the server never took whole — rejected at the stroke cap,
// trimmed at the point cap — drop out of the local overlay after this long.
export const LOCAL_STROKE_RETENTION_MS = 4000;

export type LocalStrokeRecord = {
  stroke: DrawingStroke;
  endedAtMs: number | null;
};

// Whether an ended stroke may stop covering for the server's copy. Catching
// up cannot be the only exit: the runtime trims a stroke at its point cap
// and then never grows it, so a trimmed stroke would sit on the easel
// forever, showing the artist ink the TV never received.
export const shouldDropLocalStroke = ({
  localRecord,
  serverStroke,
  nowMs
}: {
  localRecord: LocalStrokeRecord;
  serverStroke: DrawingStroke | undefined;
  nowMs: number;
}): boolean => {
  if (localRecord.endedAtMs === null) {
    return false;
  }

  if (
    serverStroke !== undefined &&
    serverStroke.points.length >= localRecord.stroke.points.length
  ) {
    return true;
  }

  return nowMs - localRecord.endedAtMs > LOCAL_STROKE_RETENTION_MS;
};

// What the easel actually paints: the canonical strokes in their canonical
// order, each one replaced by the artist's own copy wherever that copy is
// further ahead, followed by any local stroke the snapshot has not carried
// back yet.
export const mergeStrokesForRender = ({
  serverStrokes,
  localStrokes
}: {
  serverStrokes: DrawingStroke[];
  localStrokes: Map<string, LocalStrokeRecord>;
}): DrawingStroke[] => {
  const mergedStrokes: DrawingStroke[] = [];
  const mergedStrokeIds = new Set<string>();

  for (const serverStroke of serverStrokes) {
    const localRecord = localStrokes.get(serverStroke.strokeId);
    mergedStrokes.push(
      localRecord !== undefined &&
        localRecord.stroke.points.length > serverStroke.points.length
        ? localRecord.stroke
        : serverStroke
    );
    mergedStrokeIds.add(serverStroke.strokeId);
  }

  for (const [strokeId, localRecord] of localStrokes) {
    if (!mergedStrokeIds.has(strokeId)) {
      mergedStrokes.push(localRecord.stroke);
    }
  }

  return mergedStrokes;
};
