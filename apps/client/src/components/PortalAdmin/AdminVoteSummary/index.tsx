import { PORTAL_GENRES, TEAM_FORMATS, type AdminVoteSummary as AdminVoteSummaryData } from "@wingnight/shared/guestPortal";

import * as shellStyles from "../../PortalShell/styles";
import { adminVoteSummaryCopy, genreLabels, teamFormatLabels } from "./copy";
import * as styles from "./styles";

type AdminVoteSummaryProps = {
  summary: AdminVoteSummaryData;
};

// The bar's length in tenths of the leader's, so no width is ever an inline style.
const resolveFillWidth = (points: number, leader: number): string => {
  const tenths = leader === 0 ? 0 : Math.max(1, Math.round((points / leader) * 10));

  return styles.fillWidths[tenths] ?? styles.fillWidths[0];
};

// What the guests asked for, for Brad's eyes only: the music, the format, who wants to sit with
// whom (only the pairs who named each other), and who has not voted.
export const AdminVoteSummary = ({ summary }: AdminVoteSummaryProps): JSX.Element => {
  const leader = summary.genreTallies[0]?.points ?? 0;

  return (
    <section className={shellStyles.card} aria-labelledby="admin-votes-title">
      <p className={shellStyles.eyebrow}>{adminVoteSummaryCopy.eyebrow(summary.voterCount)}</p>
      <h2 id="admin-votes-title" className={shellStyles.cardTitle}>
        {adminVoteSummaryCopy.title}
      </h2>

      <div className={styles.group}>
        <span className={shellStyles.fieldLabel}>{adminVoteSummaryCopy.genresLabel}</span>
        {summary.voterCount === 0 ? (
          <p className={styles.names}>{adminVoteSummaryCopy.noVotes}</p>
        ) : (
          <ol className={styles.tallies} data-testid="admin-genre-tallies">
            {summary.genreTallies
              .filter((tally) => tally.points > 0)
              .map((tally) => (
                <li key={tally.genre} className={styles.tally} data-genre={tally.genre} data-points={tally.points}>
                  <span className={styles.genre}>{genreLabels[tally.genre]}</span>
                  <span className={styles.track} aria-label={adminVoteSummaryCopy.firstChoices(tally.firstChoices)}>
                    <span className={`${styles.fill} ${resolveFillWidth(tally.points, leader)}`} />
                  </span>
                  <span className={styles.points}>{tally.points}</span>
                </li>
              ))}
          </ol>
        )}
        <p className={shellStyles.fine}>{adminVoteSummaryCopy.genresNote(PORTAL_GENRES.length)}</p>
      </div>

      <div className={styles.group}>
        <span className={shellStyles.fieldLabel}>{adminVoteSummaryCopy.formatsLabel}</span>
        <ul className={styles.formats}>
          {TEAM_FORMATS.map((format) => (
            <li key={format} className={styles.format} data-format={format}>
              {teamFormatLabels[format]}
              <span className={styles.formatCount}>{summary.formatTallies[format]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.group}>
        <span className={shellStyles.fieldLabel}>{adminVoteSummaryCopy.wishesLabel}</span>
        {summary.mutualWishes.length === 0 ? (
          <p className={styles.names}>{adminVoteSummaryCopy.wishesEmpty}</p>
        ) : (
          summary.mutualWishes.map(({ guests: [first, second] }) => (
            <p key={`${first.guestId}-${second.guestId}`} className={styles.line}>
              {adminVoteSummaryCopy.pair(first.displayName, second.displayName)}
            </p>
          ))
        )}
      </div>

      <div className={styles.group}>
        <span className={shellStyles.fieldLabel}>{adminVoteSummaryCopy.notVotedLabel}</span>
        <p className={styles.names} data-testid="admin-not-voted">
          {summary.notVoted.length === 0
            ? adminVoteSummaryCopy.everyoneVoted
            : summary.notVoted.map((guest) => guest.displayName).join(", ")}
        </p>
      </div>
    </section>
  );
};
