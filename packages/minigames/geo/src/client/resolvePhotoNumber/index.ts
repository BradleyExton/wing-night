// Which photo the turn is showing, for the "Photo N / M" counter.
//
// The count in the runtime view is prompts COMPLETED, which the reducer
// increments the moment the guess is stamped — while both surfaces still hold
// that photo, its distance and its points. Reading it as "completed + 1"
// therefore renumbers the photo under the host's finger at the reveal, and the
// host calls out the next number over the current picture. The turn only moves
// on `nextPrompt`, so a submitted photo is still the one that was just scored.
export const resolvePhotoNumber = ({
  promptsCompletedThisTurn,
  promptsPerTurn,
  isSubmitted
}: {
  promptsCompletedThisTurn: number;
  promptsPerTurn: number;
  isSubmitted: boolean;
}): number => {
  const photoNumber = isSubmitted
    ? promptsCompletedThisTurn
    : promptsCompletedThisTurn + 1;

  return Math.min(Math.max(photoNumber, 1), promptsPerTurn);
};
