import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { PortalGenre } from "@wingnight/shared/guestPortal";

import * as shellStyles from "../../../PortalShell/styles";
import { genreLabels, voteFormCopy } from "../copy";
import { moveGenre, rankGenre, unrankGenre, unrankedGenres } from "../voteDraft";
import * as styles from "./styles";

type GenreRankingProps = {
  ranking: PortalGenre[];
  onChange: (ranking: PortalGenre[]) => void;
};

// A reorderable list that works by touch: buttons, not drag, because a drag on a phone fights
// the page's own scroll.
export const GenreRanking = ({ ranking, onChange }: GenreRankingProps): JSX.Element => {
  const unranked = unrankedGenres(ranking);

  return (
    <>
      <span className={shellStyles.fieldLabel}>{voteFormCopy.rankedLabel}</span>
      {ranking.length === 0 ? (
        <p className={styles.empty}>{voteFormCopy.rankedEmpty}</p>
      ) : (
        <ol className={styles.list} data-testid="genre-ranking">
          {ranking.map((genre, index) => (
            <li key={genre} className={styles.item}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.genre}>{genreLabels[genre]}</span>
              <span className={styles.controls}>
                <button
                  type="button"
                  className={shellStyles.iconButton}
                  aria-label={voteFormCopy.moveUp(genreLabels[genre])}
                  disabled={index === 0}
                  onClick={(): void => onChange(moveGenre(ranking, index, -1))}
                >
                  <ChevronUp className={styles.glyph} aria-hidden />
                </button>
                <button
                  type="button"
                  className={shellStyles.iconButton}
                  aria-label={voteFormCopy.moveDown(genreLabels[genre])}
                  disabled={index === ranking.length - 1}
                  onClick={(): void => onChange(moveGenre(ranking, index, 1))}
                >
                  <ChevronDown className={styles.glyph} aria-hidden />
                </button>
                <button
                  type="button"
                  className={shellStyles.iconButton}
                  aria-label={voteFormCopy.unrank(genreLabels[genre])}
                  onClick={(): void => onChange(unrankGenre(ranking, genre))}
                >
                  <X className={styles.glyph} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {unranked.length > 0 && (
        <>
          <span className={shellStyles.fieldLabel}>{voteFormCopy.unrankedLabel}</span>
          <div className={styles.chips}>
            {unranked.map((genre) => (
              <button
                key={genre}
                type="button"
                className={styles.chip}
                aria-label={voteFormCopy.rank(genreLabels[genre])}
                onClick={(): void => onChange(rankGenre(ranking, genre))}
              >
                <Plus className={styles.chipGlyph} aria-hidden />
                {genreLabels[genre]}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};
