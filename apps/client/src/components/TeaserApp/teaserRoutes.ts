// The teaser's pages. It has no router, like the party app: the path is read once and a link is
// a real navigation.
export const TEASER_ROUTES = {
  home: "/",
  dunlopDash: "/dunlop-dash"
} as const;

export const resolveTeaserPath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, "");

  return trimmed.length === 0 ? TEASER_ROUTES.home : trimmed;
};
