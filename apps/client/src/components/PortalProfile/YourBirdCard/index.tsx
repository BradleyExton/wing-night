import type { Outfit, TeamTheme } from "@wingnight/shared";

import { PortalHeadBird } from "../../PortalHeadBird";
import * as shellStyles from "../../PortalShell/styles";
import { TEASER_ROUTES } from "../../TeaserApp/teaserRoutes";
import { resolveOutfitSummary } from "../../PortalWardrobe/wardrobeState";
import { yourBirdCardCopy } from "./copy";
import * as styles from "./styles";

type YourBirdCardProps = {
  displayName: string;
  headSrc: string | null;
  // The team the guest is on, as the team card shows it (a tap in flight included), or none —
  // no pick yet, or one the roster no longer has. The wardrobe is a team's rail, so no team, no
  // wardrobe.
  theme: TeamTheme | undefined;
  outfit: Outfit;
};

// The third card on /me (docs/research/bird-wardrobe.md §2.5): the bird as the parade will see
// it, what it has on in one line, and the way into the wardrobe. The head studio stays the first
// job, so this card stays short.
export const YourBirdCard = ({ displayName, headSrc, theme, outfit }: YourBirdCardProps): JSX.Element => {
  const summary = resolveOutfitSummary(outfit);

  return (
    <section className={shellStyles.card} aria-labelledby="your-bird-title" data-testid="your-bird-card">
      <p className={shellStyles.eyebrow}>{yourBirdCardCopy.eyebrow}</p>
      <h2 id="your-bird-title" className={shellStyles.cardTitle}>
        {yourBirdCardCopy.title}
      </h2>
      {theme === undefined ? (
        <p className={shellStyles.voice}>{yourBirdCardCopy.noTeam}</p>
      ) : (
        <>
          <div className={styles.row}>
            <PortalHeadBird
              name={displayName}
              headSrc={headSrc}
              theme={theme}
              outfit={outfit}
              size="small"
              label={yourBirdCardCopy.birdLabel(summary)}
            />
            <p className={shellStyles.voice} data-testid="your-bird-summary">
              {summary}
            </p>
          </div>
          <a className={shellStyles.buttonPrimary} href={TEASER_ROUTES.wardrobe}>
            {yourBirdCardCopy.open}
          </a>
        </>
      )}
    </section>
  );
};
