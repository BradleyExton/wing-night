import type { SongGuessMark, SongGuessTeamScore } from "@wingnight/shared";

import { hostSongGuessSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

type SongScoringDeckProps = {
  currentScore: SongGuessTeamScore;
  canDispatchAction: boolean;
  onMark: (actionType: "markTitle" | "markArtist", correct: boolean) => void;
};

type MarkRowProps = {
  label: string;
  mark: SongGuessMark;
  canDispatchAction: boolean;
  onMark: (correct: boolean) => void;
};

const resolveMarkButtonClassName = (
  mark: SongGuessMark,
  isCorrectButton: boolean
): string => {
  if (mark !== isCorrectButton) {
    return styles.markButton;
  }

  return isCorrectButton ? styles.markButtonCorrect : styles.markButtonIncorrect;
};

const MarkRow = ({
  label,
  mark,
  canDispatchAction,
  onMark
}: MarkRowProps): JSX.Element => {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      {[true, false].map((isCorrectButton) => (
        <button
          key={isCorrectButton ? "correct" : "incorrect"}
          type="button"
          aria-label={hostSongGuessSurfaceCopy.markAriaLabel(label, isCorrectButton)}
          aria-pressed={mark === isCorrectButton}
          className={resolveMarkButtonClassName(mark, isCorrectButton)}
          disabled={!canDispatchAction}
          onClick={(): void => {
            onMark(isCorrectButton);
          }}
        >
          {isCorrectButton
            ? hostSongGuessSurfaceCopy.correctLabel
            : hostSongGuessSurfaceCopy.incorrectLabel}
        </button>
      ))}
    </div>
  );
};

export const SongScoringDeck = ({
  currentScore,
  canDispatchAction,
  onMark
}: SongScoringDeckProps): JSX.Element => {
  return (
    <div className={styles.card} data-song-guess-scoring>
      <span className={styles.title}>{hostSongGuessSurfaceCopy.scoringTitle}</span>
      <MarkRow
        label={hostSongGuessSurfaceCopy.titleRowLabel}
        mark={currentScore.title}
        canDispatchAction={canDispatchAction}
        onMark={(correct): void => {
          onMark("markTitle", correct);
        }}
      />
      <MarkRow
        label={hostSongGuessSurfaceCopy.artistRowLabel}
        mark={currentScore.artist}
        canDispatchAction={canDispatchAction}
        onMark={(correct): void => {
          onMark("markArtist", correct);
        }}
      />
    </div>
  );
};
