// The guest portal's contract: wingnight.tv's pre-party sign-in, avatar and team-pick API, served
// by the teaser Worker (apps/teaser-worker) and read by the teaser's pages. Nothing on the night
// depends on it — the party stays on the LAN, and a pull copies what it needs into the pack.
import { AVATAR_ATTEMPT_ID_PARAM, type PortalAvatarStatus } from "./avatar/index.js";
import { PORTAL_API_ROUTES } from "./routes/index.js";
import type { TeamPick } from "./teamPick/index.js";

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
  isAdminPicksRequest,
  isAdminTeamSeatRequest,
  isTeamPick,
  isTeamPickRequest,
  resolveTeamSeatCap,
  resolveThemeTeam,
  type AdminPicksRequest,
  type AdminPicksState,
  type AdminTeamBoard,
  type AdminTeamSeatRequest,
  type OutfitDraft,
  type PortalTeam,
  type PortalTeamList,
  type PortalTeamMember,
  type PortalTeamPicked,
  type TeamPick,
  type TeamPickRequest
} from "./teamPick/index.js";
export {
  isAdminAvatarReset,
  isAdminGuestList,
  isAdminGuestStatus,
  isAdminInviteAllResult,
  isAdminInviteResult,
  isAdminMintedLink,
  isAdminPicksState,
  isAdminStyleReference,
  isAdminTeamBoard,
  isPortalAvatarStatus,
  isPortalErrorCode,
  isPortalMe,
  isPortalTeamList,
  isPortalTeamPicked,
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
  resolveAdminGuestSignOutRoute,
  resolveAdminGuestTeamRoute,
  resolveGuestAvatarRoute
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
  // PUT myTeam: every seat on that team is taken (resolveTeamSeatCap), or Brad has closed picks.
  "team_full",
  "picks_closed",
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
  // The guest's pick, or null before one. A pick naming a team GET teams does not list is
  // orphaned (the pack renamed the team): /me asks them to pick again.
  team: TeamPick | null;
  // While true, PUT myTeam refuses with picks_closed and /me's tiles are inert.
  picksClosed: boolean;
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
  // The picked team's roster name; null before a pick, and null when the pick names a team the
  // roster no longer has (so this row and the team board never disagree about who is seated).
  team: string | null;
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
