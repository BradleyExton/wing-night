import { Suspense, lazy } from "react";

import { AppErrorBoundary } from "../AppErrorBoundary";
import { TeaserLanding } from "../TeaserLanding";
import { isTeaserGamePath, resolveTeaserPath, TEASER_ROUTES } from "./teaserRoutes";
import { useTeaserRoster } from "./useTeaserRoster";
import * as styles from "./styles";

// The landing is the front door and ships in the entry. Every other page is its own chunk: a
// game page carries the games' runtimes and surfaces, the portal pages carry the sign-in and the
// head painter, and the landing — opened on a phone, often over cellular — needs none of it. The
// path is read once and there is no router, so exactly one of these ever loads.
const TeaserGamePage = lazy(() =>
  import("../TeaserSoloGame").then((module) => ({ default: module.TeaserGamePage }))
);

const PortalProfile = lazy(() =>
  import("../PortalProfile").then((module) => ({ default: module.PortalProfile }))
);

const PortalWardrobe = lazy(() =>
  import("../PortalWardrobe").then((module) => ({ default: module.PortalWardrobe }))
);

const PortalAdmin = lazy(() =>
  import("../PortalAdmin").then((module) => ({ default: module.PortalAdmin }))
);

const PortalSignIn = lazy(() =>
  import("../PortalSignIn").then((module) => ({ default: module.PortalSignIn }))
);

const TeaserShareCard = lazy(() =>
  import("../TeaserShareCard").then((module) => ({ default: module.TeaserShareCard }))
);

// The online teaser (wingnight.tv): the lobby with a countdown, the minigames that work on a
// phone, and the guest portal's signed-in pages. Every game page draws with the night's own roster.
export const TeaserApp = (): JSX.Element => {
  const { roster, isLoaded } = useTeaserRoster();
  const path = resolveTeaserPath(window.location.pathname);

  const page = ((): JSX.Element | null => {
    if (isTeaserGamePath(path)) {
      return isLoaded ? <TeaserGamePage path={path} roster={roster} /> : null;
    }

    if (path === TEASER_ROUTES.me) {
      return <PortalProfile />;
    }

    if (path === TEASER_ROUTES.wardrobe) {
      return <PortalWardrobe />;
    }

    if (path === TEASER_ROUTES.admin) {
      return <PortalAdmin />;
    }

    if (path === TEASER_ROUTES.signIn) {
      return <PortalSignIn />;
    }

    if (path === TEASER_ROUTES.shareCard) {
      return isLoaded ? <TeaserShareCard roster={roster} /> : null;
    }

    return <TeaserLanding roster={roster} />;
  })();

  // The fallback is the page's own empty background, like the party's route fallback: the
  // instant before a page's chunk lands should look like the blank page before it. The boundary
  // catches a chunk that never lands (a deploy that replaced it under a cached page) and offers
  // one reload instead of a white screen.
  return (
    <div className={styles.root}>
      <AppErrorBoundary surface="TEASER">
        <Suspense fallback={null}>{page}</Suspense>
      </AppErrorBoundary>
    </div>
  );
};
