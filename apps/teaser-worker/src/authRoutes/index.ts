// Signing in and out: the `/s/<token>` page and its POST, the "email me a link" request, and
// sign-out.
import {
  PORTAL_API_ROUTES,
  PORTAL_HOME_PATH,
  PORTAL_SIGN_IN_PATH_PREFIX,
  isEmailLinkRequest,
  normalizeGuestEmail
} from "@wingnight/shared/guestPortal";

import type { PortalDeps } from "../deps/index.ts";
import { errorResponse, htmlResponse, jsonResponse, readClientIp, readJsonBody } from "../http/index.ts";
import type { PortalRoute, PublicContext } from "../routeContext/index.ts";
import {
  buildClearedSessionCookie,
  buildSessionCookie,
  createSession,
  deleteSession
} from "../sessions/index.ts";
import { composeSignInMail } from "../signInMail/index.ts";
import {
  mintEmailLink,
  redeemSignInToken,
  resolveLinkOrigin,
  resolveSignInUrl
} from "../signInLinks/index.ts";
import { renderSignInPage } from "../signInPage/index.ts";
import { hashToken, isTokenShaped } from "../tokens/index.ts";

export { EMAIL_LINKS_PER_ADDRESS_PER_HOUR } from "../signInLinks/index.ts";

// The one answer to every well-formed email-link request — known address, unknown address,
// rate-limited, or the mail service down. Anything that varied would tell a stranger who is on
// the guest list.
export const EMAIL_LINK_ACCEPTED_BODY = { status: "accepted" } as const;

const SIGN_IN_PATTERN = `${PORTAL_SIGN_IN_PATH_PREFIX}:token`;

const showSignInPage = async ({ params }: PublicContext): Promise<Response> => {
  return isTokenShaped(params.token ?? "")
    ? htmlResponse(renderSignInPage("ready"))
    : htmlResponse(renderSignInPage("invalid"), 404);
};

const signIn = async ({ params, deps }: PublicContext): Promise<Response> => {
  const token = params.token ?? "";
  const guestId = isTokenShaped(token) ? await redeemSignInToken(deps, token) : null;

  if (guestId === null) {
    return htmlResponse(renderSignInPage("invalid"), 400);
  }

  const sessionToken = await createSession(deps, guestId);

  // A 303 turns the POST into a GET of the guest's page, and takes the token out of the
  // address bar and the history with it.
  return new Response(null, {
    status: 303,
    headers: { Location: PORTAL_HOME_PATH, "Set-Cookie": buildSessionCookie(sessionToken) }
  });
};

// Runs after the response has gone: whether the address is known, the limits, the insert and
// the send all happen where their timing cannot be measured.
const sendRequestedLink = async (deps: PortalDeps, email: string, ip: string, origin: string): Promise<void> => {
  const { success } = await deps.signInLimiter.limit({ key: `email-link:${ip}` });

  if (!success) {
    return;
  }

  const guest = await deps.db
    .prepare("SELECT guest_id, display_name FROM guests WHERE email = ?")
    .bind(email)
    .first<{ guest_id: string; display_name: string }>();

  if (guest === null) {
    return;
  }

  // Null when the address has had its hour's worth of links.
  const token = await mintEmailLink(deps, guest.guest_id, await hashToken(ip));

  if (token === null) {
    return;
  }

  await deps.mail.send(
    composeSignInMail({
      kind: "requested",
      to: email,
      displayName: guest.display_name,
      url: resolveSignInUrl(origin, token)
    })
  );
};

const requestEmailLink = async ({ request, url, deps }: PublicContext): Promise<Response> => {
  const body = await readJsonBody(request);

  if (!isEmailLinkRequest(body)) {
    return errorResponse("bad_request");
  }

  // isEmailLinkRequest has already proved it normalizes.
  const email = normalizeGuestEmail(body.email) ?? "";

  deps.defer(
    sendRequestedLink(deps, email, readClientIp(request), resolveLinkOrigin(deps, url)).catch((error: unknown) =>
      deps.logError("email-link: send failed", error)
    )
  );

  return jsonResponse(EMAIL_LINK_ACCEPTED_BODY, 202);
};

const signOut = async ({ request, deps }: PublicContext): Promise<Response> => {
  await deleteSession(deps, request);

  return new Response(null, { status: 204, headers: { "Set-Cookie": buildClearedSessionCookie() } });
};

export const AUTH_ROUTES: PortalRoute[] = [
  { method: "GET", pattern: SIGN_IN_PATTERN, access: "public", handle: showSignInPage },
  { method: "POST", pattern: SIGN_IN_PATTERN, access: "public", handle: signIn },
  { method: "POST", pattern: PORTAL_API_ROUTES.emailLink, access: "public", handle: requestEmailLink },
  { method: "POST", pattern: PORTAL_API_ROUTES.signOut, access: "public", handle: signOut }
];
