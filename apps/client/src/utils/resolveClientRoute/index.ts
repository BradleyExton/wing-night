export type ClientRoute = "ROOT" | "HOST" | "DISPLAY" | "DEV_MINIGAME" | "NOT_FOUND";

const DEV_MINIGAME_ROUTE_PREFIX = "/dev/minigame/";

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

export const resolveClientRoute = (pathname: string): ClientRoute => {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/") {
    return "ROOT";
  }

  if (normalizedPathname === "/host") {
    return "HOST";
  }

  if (normalizedPathname === "/display") {
    return "DISPLAY";
  }

  if (resolveDevMinigameSlug(normalizedPathname) !== null) {
    return "DEV_MINIGAME";
  }

  return "NOT_FOUND";
};

export const resolveDevMinigameSlug = (pathname: string): string | null => {
  const normalizedPathname = normalizePathname(pathname);

  if (!normalizedPathname.startsWith(DEV_MINIGAME_ROUTE_PREFIX)) {
    return null;
  }

  const slug = normalizedPathname
    .slice(DEV_MINIGAME_ROUTE_PREFIX.length)
    .trim()
    .toLowerCase();

  if (slug.length === 0 || slug.includes("/")) {
    return null;
  }

  return slug;
};
