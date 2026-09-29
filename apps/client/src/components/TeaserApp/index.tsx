import { TeaserLanding } from "../TeaserLanding";
import { TeaserShareCard } from "../TeaserShareCard";
import { TeaserSoloGame } from "../TeaserSoloGame";
import { resolveTeaserGame } from "../TeaserSoloGame/teaserGames";
import { resolveTeaserPath, TEASER_ROUTES } from "./teaserRoutes";
import { useTeaserRoster } from "./useTeaserRoster";
import * as styles from "./styles";

// The online teaser (wingnight.tv): the lobby with a countdown, and the minigames that work on a
// phone. Every page draws with the night's own roster.
export const TeaserApp = (): JSX.Element => {
  const { roster, isLoaded } = useTeaserRoster();
  const path = resolveTeaserPath(window.location.pathname);
  const game = resolveTeaserGame(path);

  const page = ((): JSX.Element | null => {
    if (game !== null) {
      return isLoaded ? <TeaserSoloGame key={game.slug} game={game} roster={roster} /> : null;
    }

    if (path === TEASER_ROUTES.shareCard) {
      return isLoaded ? <TeaserShareCard roster={roster} /> : null;
    }

    return <TeaserLanding roster={roster} />;
  })();

  return <div className={styles.root}>{page}</div>;
};
