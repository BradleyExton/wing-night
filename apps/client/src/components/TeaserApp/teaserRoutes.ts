// The teaser's pages. It has no router, like the party app: the path is read once and a link is
// a real navigation.
export const TEASER_ROUTES = {
  home: "/",
  // The link-preview picture's page (TeaserShareCard); nothing links to it.
  shareCard: "/card"
} as const;

// A game's page is its slug (TeaserSoloGame/teaserGames).
export const resolveTeaserGameHref = (slug: string): string => `/${slug}`;

export const resolveTeaserPath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, "");

  return trimmed.length === 0 ? TEASER_ROUTES.home : trimmed;
};
