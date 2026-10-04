// The guest portal's contract: wingnight.tv's pre-party sign-in, avatar and vote API, served by
// the teaser Worker (apps/teaser-worker) and read by the teaser's pages. Nothing on the night
// depends on it — the party stays on the LAN, and a pull copies what it needs into the pack.
import type { GuestVote, PortalGenre, TeamFormat } from "./vote/index.js";

export {
  PORTAL_GENRES,
  TEAM_FORMATS,
  TEAMMATE_WISHES_MAX,
  isGuestVote,
  resolveGenreBordaPoints,
  type GuestVote,
  type PortalGenre,
  type TeamFormat
} from "./vote/index.js";
export {
  GUEST_DISPLAY_NAME_MAX_LENGTH,
  isAdminCreateGuestRequest,
  isAdminEditGuestRequest,
  isEmailLinkRequest,
  normalizeGuestDisplayName,
  normalizeGuestEmail,
  type AdminCreateGuestRequest,
  type AdminEditGuestRequest,
  type EmailLinkRequest
} from "./requests/index.js";

export const PORTAL_SESSION_COOKIE_NAME = "wn_session";

// A sign-in link is `/s/<token>`, for a personal link and an emailed one alike.
export const PORTAL_SIGN_IN_PATH_PREFIX = "/s/";
// Where a guest lands once signed in.
export const PORTAL_HOME_PATH = "/me";

export const PORTAL_API_ROUTES = {
  me: "/api/me",
  myVote: "/api/me/vote",
  guests: "/api/guests",
  emailLink: "/api/auth/email-link",
  signOut: "/api/auth/sign-out",
  adminGuests: "/api/admin/guests",
  adminInviteAll: "/api/admin/invites",
  adminVotes: "/api/admin/votes"
} as const;

export const resolveAdminGuestRoute = (guestId: string): string =>
  `${PORTAL_API_ROUTES.adminGuests}/${encodeURIComponent(guestId)}`;

export const resolveAdminGuestInviteRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/invite`;

export const resolveAdminGuestLinkRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/link`;

export const resolveAdminGuestSignOutRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/sign-out`;

// Every failure the API names. The body of a failed request is `{ error }` and nothing else.
export const PORTAL_ERROR_CODES = [
  "bad_request",
  "unauthorized",
  "forbidden",
  "cross_origin",
  "not_found",
  "method_not_allowed",
  "email_taken",
  "no_email",
  "mail_failed",
  "server_error"
] as const;
export type PortalErrorCode = (typeof PORTAL_ERROR_CODES)[number];

export type PortalErrorBody = {
  error: PortalErrorCode;
};

// Every timestamp the API returns is milliseconds since the epoch, like the party's `endsAt`.

// GET /api/me. Your own address is yours to see; nobody else's ever leaves the admin API.
export type PortalMe = {
  guestId: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  hasHead: boolean;
  vote: GuestVote | null;
};

// GET /api/guests: the teammate-wish picker's list, and deliberately nothing more.
export type PortalGuest = {
  guestId: string;
  displayName: string;
};

// The admin's guest list.
export type AdminGuestStatus = {
  guestId: string;
  displayName: string;
  email: string | null;
  isAdmin: boolean;
  createdAt: number;
  invitedAt: number | null;
  claimedAt: number | null;
  lastSeenAt: number | null;
  hasHead: boolean;
  hasVoted: boolean;
};

// A freshly minted personal link, shown once: only its hash is kept.
export type AdminMintedLink = {
  guestId: string;
  url: string;
};

// Ends every session a guest has, everywhere.
export type AdminSignOutResult = {
  guestId: string;
  sessionsEnded: number;
};

export type AdminInviteResult = {
  guestId: string;
  invitedAt: number;
};

// "Invite everyone" works through the uninvited (admins aside) in batches small enough for one
// Worker request; `remaining` is how many guests with an address are still uninvited after this
// press, those whose mail just failed included.
export type AdminInviteAllResult = {
  invited: string[];
  failed: string[];
  remaining: number;
};

export type VoteGenreTally = {
  genre: PortalGenre;
  points: number;
  firstChoices: number;
};

export type VoteMutualWish = {
  guests: [PortalGuest, PortalGuest];
};

export type AdminVoteSummary = {
  voterCount: number;
  // Highest Borda total first (resolveGenreBordaPoints).
  genreTallies: VoteGenreTally[];
  // Pairs who each named the other.
  mutualWishes: VoteMutualWish[];
  formatTallies: Record<TeamFormat, number>;
  notVoted: PortalGuest[];
};
