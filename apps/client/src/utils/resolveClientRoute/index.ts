export type ClientRoute = "HOST" | "DISPLAY" | "NOT_FOUND";

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

export const resolveClientRoute = (pathname: string): ClientRoute => {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/host") {
    return "HOST";
  }

  if (normalizedPathname === "/display") {
    return "DISPLAY";
  }

  return "NOT_FOUND";
};
