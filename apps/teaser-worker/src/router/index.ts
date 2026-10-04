// A route table and the one function that reads it: `:name` segments become params, and a path
// that exists under another method is told so rather than not found.
export type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RoutePattern = {
  method: RouteMethod;
  pattern: string;
};

export type RouteMatch<Route> =
  | { kind: "matched"; route: Route; params: Record<string, string> }
  | { kind: "method_not_allowed" }
  | { kind: "not_found" };

const splitPath = (path: string): string[] => path.split("/").filter((segment) => segment.length > 0);

const matchPattern = (pattern: string, pathname: string): Record<string, string> | null => {
  const patternSegments = splitPath(pattern);
  const pathSegments = splitPath(pathname);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (const [index, patternSegment] of patternSegments.entries()) {
    const pathSegment = pathSegments[index] ?? "";

    if (patternSegment.startsWith(":")) {
      try {
        params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      } catch {
        return null;
      }
    } else if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
};

export const matchRoute = <Route extends RoutePattern>(
  routes: readonly Route[],
  method: string,
  pathname: string
): RouteMatch<Route> => {
  let pathExists = false;

  for (const route of routes) {
    const params = matchPattern(route.pattern, pathname);

    if (params === null) {
      continue;
    }

    if (route.method === method) {
      return { kind: "matched", route, params };
    }

    pathExists = true;
  }

  return pathExists ? { kind: "method_not_allowed" } : { kind: "not_found" };
};
