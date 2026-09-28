import { useEffect, useRef } from "react";
import { useHouseSoundboard } from "@wingnight/surface";
import type { RecreateAttemptStatus, RecreateMinigameDisplayView } from "@wingnight/shared";

// Pure: what a change in the attempt's status sounds like. Sending the prompt off is a whoosh,
// the forgery arriving is a bell, a failed generation fizzles. A skip says nothing. `null` for
// the previous status is "no attempt before this one", which is how a fresh attempt's
// `generating` is a send rather than a change from the last attempt's `ready`.
export const resolveAttemptCue = (
  previousStatus: RecreateAttemptStatus | null,
  status: RecreateAttemptStatus | null
): "whoosh" | "arrive" | "fizzle" | null => {
  if (status === null || status === previousStatus) {
    return null;
  }

  switch (status) {
    case "generating":
      return "whoosh";
    case "ready":
      return "arrive";
    case "failed":
      return "fizzle";
    case "skipped":
      return null;
  }
};

// Pure: a box ticked or unticked on the ingredient board, by the count of checked ingredients.
export const resolveIngredientCue = (
  previousCount: number,
  count: number
): "tickOn" | "tickOff" | null => {
  if (count === previousCount) {
    return null;
  }

  return count > previousCount ? "tickOn" : "tickOff";
};

type AttemptReading = {
  attemptId: string | null;
  status: RecreateAttemptStatus | null;
  checkedCount: number;
};

// The room's sound for a forgery, on the TV only. The appraisal is the house result card's own
// sting. Every reading is compared within one attempt: a new attempt starts from nothing, so a
// fresh empty board is not a run of unticks, and a display that mounts on a picture already up
// (the first reading) did not watch it arrive.
export const useRecreateSounds = (view: RecreateMinigameDisplayView | null): void => {
  const play = useHouseSoundboard();
  const attemptId = view?.attempt?.attemptId ?? null;
  const status = view?.attempt?.status ?? null;
  const checkedCount = view?.checkedIngredientIndexes.length ?? 0;
  const readingRef = useRef<AttemptReading | undefined>(undefined);

  useEffect(() => {
    const previous = readingRef.current;

    readingRef.current = { attemptId, status, checkedCount };

    if (previous === undefined) {
      return;
    }

    const isSameAttempt = previous.attemptId === attemptId;
    const attemptCue = resolveAttemptCue(isSameAttempt ? previous.status : null, status);
    const ingredientCue = isSameAttempt
      ? resolveIngredientCue(previous.checkedCount, checkedCount)
      : null;

    if (attemptCue !== null) {
      play(attemptCue);
    }

    if (ingredientCue !== null) {
      play(ingredientCue);
    }
  }, [attemptId, status, checkedCount, play]);
};
