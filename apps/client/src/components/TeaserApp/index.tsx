import { TeaserDunlopDash } from "../TeaserDunlopDash";
import { TeaserLanding } from "../TeaserLanding";
import { resolveTeaserPath, TEASER_ROUTES } from "./teaserRoutes";
import { useTeaserRoster } from "./useTeaserRoster";
import * as styles from "./styles";

// The online teaser (wingnight.tv): the lobby with a countdown, and the minigames that work on a
// phone. Every page draws with the night's own roster.
export const TeaserApp = (): JSX.Element => {
  const { roster, isLoaded } = useTeaserRoster();
  const path = resolveTeaserPath(window.location.pathname);

  return (
    <div className={styles.root}>
      {path === TEASER_ROUTES.dunlopDash ? (
        isLoaded && <TeaserDunlopDash roster={roster} />
      ) : (
        <TeaserLanding roster={roster} />
      )}
    </div>
  );
};
