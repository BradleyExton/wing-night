// Which exhibit the journal page is showing, for the "Exhibit N of M" meta.
//
// The count in the runtime view is prompts COMPLETED, which the reducer
// increments the moment the guess is stamped — while the page still holds that
// exhibit's photo, distance stamp and points seal. Reading it as "completed + 1"
// therefore renames the exhibit under the host's finger at the reveal, and the
// host calls out the next number over the current picture. The page only turns
// on `nextPrompt`, so a submitted page is still the exhibit that was just
// scored.
export const resolveExhibitNumber = ({
  promptsCompletedThisTurn,
  promptsPerTurn,
  isSubmitted
}: {
  promptsCompletedThisTurn: number;
  promptsPerTurn: number;
  isSubmitted: boolean;
}): number => {
  const exhibitNumber = isSubmitted
    ? promptsCompletedThisTurn
    : promptsCompletedThisTurn + 1;

  return Math.min(Math.max(exhibitNumber, 1), promptsPerTurn);
};
