// The guest portal's contract: wingnight.tv's pre-party sign-in, avatar and vote API, served by
// the teaser Worker (apps/teaser-worker) and read by the teaser's pages. Nothing on the night
// depends on it — the party stays on the LAN, and a pull copies what it needs into the pack.
import { AVATAR_ATTEMPT_ID_PARAM, type PortalAvatarStatus } from "./avatar/index.js";
import { PORTAL_API_ROUTES } from "./routes/index.js";
import type { GuestVote, PortalGenre, TeamFormat } from "./vote/index.js";

export {
  AVATAR_ATTEMPT_ID_HEADER,
  AVATAR_ATTEMPT_ID_PARAM,
  AVATAR_FAILED_TRIES_MAX,
  AVATAR_HEAD_MAX_BYTES,
  AVATAR_HEAD_MAX_SIDE_PX,
  AVATAR_HEAD_TYPE,
  AVATAR_PHOTO_LONG_EDGE_PX,
  AVATAR_PHOTO_MAX_BYTES,
  AVATAR_PHOTO_TYPES,
  AVATAR_PHOTO_UPLOAD_MAX_LENGTH,
  AVATAR_TRIES_LEFT_HEADER,
  AVATAR_TRIES_MAX,
  isAdminStyleReferenceRequest,
  readAvatarHeadPng,
  readAvatarPhotoUpload,
  type AdminAvatarReset,
  type AdminStyleReference,
  type AdminStyleReferenceRequest,
  type AvatarPhotoType,
  type AvatarPhotoUpload,
  type PortalAvatarStatus
} from "./avatar/index.js";

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
  isAdminAvatarReset,
  isAdminGuestList,
  isAdminGuestStatus,
  isAdminInviteAllResult,
  isAdminInviteResult,
  isAdminMintedLink,
  isAdminStyleReference,
  isAdminVoteSummary,
  isPortalAvatarStatus,
  isPortalErrorCode,
  isPortalGuest,
  isPortalGuestList,
  isPortalMe,
  readPortalErrorCode
} from "./responses/index.js";
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

export {
  PORTAL_API_ROUTES,
  resolveAdminGuestAvatarResetRoute,
  resolveAdminGuestAvatarRoute,
  resolveAdminGuestInviteRoute,
  resolveAdminGuestLinkRoute,
  resolveAdminGuestRoute,
  resolveAdminGuestSignOutRoute
} from "./routes/index.js";
export { isAdminGuestExportList, type AdminGuestExport, type AdminGuestExportHead } from "./export/index.js";

export const resolveAvatarAcceptRoute = (attemptId: string): string =>
  `${PORTAL_API_ROUTES.myAvatarAccept}?${AVATAR_ATTEMPT_ID_PARAM}=${encodeURIComponent(attemptId)}`;

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
  "no_photo",
  "tries_exhausted",
  "painter_failed",
  "too_large",
  "unsupported_media_type",
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
  avatar: PortalAvatarStatus;
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
  // The accepted head's SHA-256, for the gallery's `?v=` (see PortalAvatarStatus).
  headHash: string | null;
  // This guest's CURRENT head is the one new heads are painted to match.
  isStyleReference: boolean;
  // Tries the guest has left at painting a head (PortalAvatarStatus.triesLeft).
  triesLeft: number;
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
