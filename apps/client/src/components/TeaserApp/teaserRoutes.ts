import { PORTAL_HOME_PATH } from "@wingnight/shared/guestPortal";

// The teaser's pages. It has no router, like the party app: the path is read once and a link is
// a real navigation.
export const TEASER_ROUTES = {
  home: "/",
  // The link-preview picture's page (TeaserShareCard); nothing links to it.
  shareCard: "/card",
  // The guest portal's pages, behind a sign-in (apps/teaser-worker). The link a guest is sent
  // (`/s/<token>`) is the Worker's own page, and it lands here.
  me: PORTAL_HOME_PATH,
  admin: "/admin",
  signIn: "/signin"
} as const;

// A game's page is its slug (TeaserSoloGame/teaserGames).
export const resolveTeaserGameHref = (slug: string): string => `/${slug}`;

export const resolveTeaserPath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, "");

  return trimmed.length === 0 ? TEASER_ROUTES.home : trimmed;
};
