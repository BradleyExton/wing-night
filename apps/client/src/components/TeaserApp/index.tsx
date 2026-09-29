import { TeaserDunlopDash } from "../TeaserDunlopDash";
import { TeaserLanding } from "../TeaserLanding";
import { TeaserShareCard } from "../TeaserShareCard";
import { resolveTeaserPath, TEASER_ROUTES } from "./teaserRoutes";
import { useTeaserRoster } from "./useTeaserRoster";
import * as styles from "./styles";

// The online teaser (wingnight.tv): the lobby with a countdown, and the minigames that work on a
// phone. Every page draws with the night's own roster.
export const TeaserApp = (): JSX.Element => {
  const { roster, isLoaded } = useTeaserRoster();
  const path = resolveTeaserPath(window.location.pathname);

  const page = ((): JSX.Element | null => {
    switch (path) {
      case TEASER_ROUTES.dunlopDash:
        return isLoaded ? <TeaserDunlopDash roster={roster} /> : null;
      case TEASER_ROUTES.shareCard:
        return isLoaded ? <TeaserShareCard roster={roster} /> : null;
      default:
        return <TeaserLanding roster={roster} />;
    }
  })();

  return <div className={styles.root}>{page}</div>;
};
