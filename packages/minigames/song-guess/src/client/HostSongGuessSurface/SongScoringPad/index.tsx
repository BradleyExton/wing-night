import type { SongGuessMark, SongGuessTeamScore } from "@wingnight/shared";

import { hostSongGuessSurfaceCopy } from "../copy.js";
import * as styles from "./styles.js";

type SongScoringPadProps = {
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

// A point each for the title and the original artist, ruled at the reveal.
// It lives in the takeover's foot row beside "Next song" — the ruling and the
// advance are the same beat, and the host's thumb is already there.
export const SongScoringPad = ({
  currentScore,
  canDispatchAction,
  onMark
}: SongScoringPadProps): JSX.Element => {
  const isFullyRuled = currentScore.title !== null && currentScore.artist !== null;

  return (
    <div className={styles.card} data-song-guess-scoring>
      <span className={styles.title}>
        {isFullyRuled
          ? hostSongGuessSurfaceCopy.scoringOnDisplayTitle
          : hostSongGuessSurfaceCopy.scoringTitle}
      </span>
      <div className={styles.rows}>
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
    </div>
  );
};
