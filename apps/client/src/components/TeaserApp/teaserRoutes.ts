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

// A game's page is its slug. The slugs live here rather than on the games themselves
// (TeaserSoloGame/teaserGames) so the landing and the page switch can name a game without
// importing it — a game is its runtime and its surface, and those load only on its page.
export const TEASER_GAME_SLUGS = {
  dunlopDash: "dunlop-dash",
  fappyBird: "fappy-bird",
  slingshlong: "slingshlong",
  streetsOfBarrie: "streets-of-barrie"
} as const;

export const resolveTeaserGameHref = (slug: string): string => `/${slug}`;

export const isTeaserGamePath = (path: string): boolean =>
  Object.values(TEASER_GAME_SLUGS).some((slug) => resolveTeaserGameHref(slug) === path);

export const resolveTeaserPath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, "");

  return trimmed.length === 0 ? TEASER_ROUTES.home : trimmed;
};
