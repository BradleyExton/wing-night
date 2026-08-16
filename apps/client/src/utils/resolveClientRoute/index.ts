export type ClientRoute =
  | "ROOT"
  | "HOST"
  | "ADMIN"
  | "DISPLAY"
  | "DEV_MINIGAME"
  | "DEV_LAB"
  | "BOARD"
  | "NOT_FOUND";

const DEV_MINIGAME_ROUTE_PREFIX = "/dev/minigame/";

const DEV_LAB_ROUTE_PREFIX = "/dev/lab/";

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

  if (normalizedPathname === "/admin") {
    return "ADMIN";
  }

  if (normalizedPathname === "/display") {
    return "DISPLAY";
  }

  // A FIXED path, so it takes the equality branch the way /admin does — not the
  // prefixed-segment helper below, which exists for routes addressing a variable
  // segment. Trailing slashes are already handled by normalizePathname.
  if (normalizedPathname === "/dev/board") {
    return "BOARD";
  }

  if (resolveDevMinigameSlug(normalizedPathname) !== null) {
    return "DEV_MINIGAME";
  }

  if (resolveDevLabName(normalizedPathname) !== null) {
    return "DEV_LAB";
  }

  return "NOT_FOUND";
};

// Both dev routes address a single lowercase segment under a fixed prefix, and
// reject the bare prefix and any deeper path.
const resolvePrefixedSegment = (pathname: string, prefix: string): string | null => {
  const normalizedPathname = normalizePathname(pathname);

  if (!normalizedPathname.startsWith(prefix)) {
    return null;
  }

  const segment = normalizedPathname.slice(prefix.length).trim().toLowerCase();

  if (segment.length === 0 || segment.includes("/")) {
    return null;
  }

  return segment;
};

export const resolveDevMinigameSlug = (pathname: string): string | null => {
  return resolvePrefixedSegment(pathname, DEV_MINIGAME_ROUTE_PREFIX);
};

export const resolveDevLabName = (pathname: string): string | null => {
  return resolvePrefixedSegment(pathname, DEV_LAB_ROUTE_PREFIX);
};
