// The Worker's whole request path, pure over its deps: the cross-origin check, the route, who is
// asking, the handler, and the headers every response leaves with.
//
// In production only `/api/*` and `/s/*` reach the Worker (`run_worker_first` in wrangler.jsonc);
// everything else is the teaser's static pages. Anything that does arrive here unrouted outside
// those prefixes is handed back to the assets, and still leaves with the portal's headers.
import { PORTAL_SIGN_IN_PATH_PREFIX } from "@wingnight/shared/guestPortal";

import { ADMIN_ROUTES } from "../adminRoutes/index.ts";
import { AUTH_ROUTES } from "../authRoutes/index.ts";
import type { PortalDeps } from "../deps/index.ts";
import { GUEST_ROUTES } from "../guestRoutes/index.ts";
import { errorResponse, htmlResponse, readBearerToken, withPortalHeaders } from "../http/index.ts";
import type { PortalRoute, PublicContext } from "../routeContext/index.ts";
import { matchRoute } from "../router/index.ts";
import { resolveSession } from "../sessions/index.ts";
import { renderSignInPage } from "../signInPage/index.ts";
import { secretsMatch } from "../tokens/index.ts";

const API_PREFIX = "/api/";
const ADMIN_API_PREFIX = "/api/admin/";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const PORTAL_ROUTES: readonly PortalRoute[] = [...AUTH_ROUTES, ...GUEST_ROUTES, ...ADMIN_ROUTES];

// A request that carries a bearer is a script, and is judged on the bearer alone — its cookie,
// if any, is ignored. That is also why it skips the Origin check: a browser never attaches an
// Authorization header on its own, so there is no forged request to stop.
const isBearerAdminRequest = (request: Request, pathname: string): boolean => {
  return pathname.startsWith(ADMIN_API_PREFIX) && request.headers.has("Authorization");
};

// The sign-in POST is the sign-in page's own form, and that page is served with
// Referrer-Policy: no-referrer — under which a browser posts the form with `Origin: null`. So
// Origin alone cannot tell the page's own button from another site's form here; Sec-Fetch-Site,
// which every current browser sends, can. A browser that sends it must say `same-origin`. One
// that does not (an old browser, curl) may send no Origin, `null`, or this origin — never a
// foreign one. The token in the path is the credential either way.
const isSignInPostFromThisSite = (request: Request, url: URL): boolean => {
  const origin = request.headers.get("Origin");

  if (origin !== null && origin !== "null" && origin !== url.origin) {
    return false;
  }

  const fetchSite = request.headers.get("Sec-Fetch-Site");

  return fetchSite === null || fetchSite === "same-origin";
};

// CSRF, on top of SameSite=Lax: a state-changing request must come from a page on this origin.
// The API's requests are the pages' own fetch() calls, which always carry their real Origin, so
// the API refuses a missing or `null` one outright.
const resolveOriginRefusal = (request: Request, url: URL): Response | null => {
  if (SAFE_METHODS.has(request.method)) {
    return null;
  }

  if (url.pathname.startsWith(PORTAL_SIGN_IN_PATH_PREFIX)) {
    return isSignInPostFromThisSite(request, url) ? null : htmlResponse(renderSignInPage("crossOrigin"), 403);
  }

  if (url.pathname.startsWith(API_PREFIX) && !isBearerAdminRequest(request, url.pathname)) {
    return request.headers.get("Origin") === url.origin ? null : errorResponse("cross_origin");
  }

  return null;
};

const isAdminCaller = async (context: PublicContext): Promise<boolean> => {
  const { request, deps } = context;

  if (request.headers.has("Authorization")) {
    const bearer = readBearerToken(request);

    return deps.adminApiToken !== null && bearer !== null && (await secretsMatch(bearer, deps.adminApiToken));
  }

  return (await resolveSession(deps, request))?.isAdmin === true;
};

const runRoute = async (route: PortalRoute, context: PublicContext): Promise<Response> => {
  switch (route.access) {
    case "public":
      return route.handle(context);
    case "guest": {
      const session = await resolveSession(context.deps, context.request);

      return session === null ? errorResponse("unauthorized") : route.handle({ ...context, session });
    }
    case "admin":
      return (await isAdminCaller(context)) ? route.handle(context) : errorResponse("forbidden");
  }
};

const isWorkerPath = (pathname: string): boolean => {
  return pathname.startsWith(API_PREFIX) || pathname.startsWith(PORTAL_SIGN_IN_PATH_PREFIX);
};

const routeRequest = async (request: Request, deps: PortalDeps): Promise<Response> => {
  const url = new URL(request.url);
  const refusal = resolveOriginRefusal(request, url);

  if (refusal !== null) {
    return refusal;
  }

  const match = matchRoute(PORTAL_ROUTES, request.method, url.pathname);

  if (match.kind === "matched") {
    return runRoute(match.route, { request, url, params: match.params, deps });
  }

  if (!isWorkerPath(url.pathname)) {
    return deps.assets.fetch(request);
  }

  return errorResponse(match.kind);
};

export const handleRequest = async (request: Request, deps: PortalDeps): Promise<Response> => {
  try {
    return withPortalHeaders(await routeRequest(request, deps));
  } catch (error) {
    deps.logError(`${request.method} ${new URL(request.url).pathname} failed`, error);

    return withPortalHeaders(errorResponse("server_error"));
  }
};
