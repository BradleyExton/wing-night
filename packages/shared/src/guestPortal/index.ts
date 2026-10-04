// The guest portal's contract: wingnight.tv's pre-party sign-in, avatar and vote API, served by
// the teaser Worker (apps/teaser-worker) and read by the teaser's pages. Nothing on the night
// depends on it — the party stays on the LAN, and a pull copies what it needs into the pack.
import { AVATAR_ATTEMPT_ID_PARAM, type PortalAvatarStatus } from "./avatar/index.js";
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

// The avatar routes, in the order a guest's phone calls them (avatar/index.ts has the types):
//
//   POST photo     body: the downscaled photo as a data URL, sent as text
//                  (`data:image/jpeg;base64,…`, readAvatarPhotoUpload). Replaces any earlier one.
//                  → 200 PortalAvatarStatus · 400 not a photo upload (or no Content-Length)
//                    · 413 too big · 429 tries_exhausted (a photo nobody can paint is not kept)
//   POST generate  no body. Spends a try, then paints from the stored photo (and the style
//                  reference, once Brad has picked one) and streams Gemini's generateContent JSON
//                  back untouched, headers AVATAR_TRIES_LEFT_HEADER and AVATAR_ATTEMPT_ID_HEADER.
//                  The browser parses it with @wingnight/avatar-head's extractGeneratedImage,
//                  which throws with the model's own words when it painted nothing, and keys it
//                  with keyAndCropHead.
//                  → 200 the JSON · 409 no_photo · 429 tries_exhausted · 502 painter_failed
//   POST accept?attemptId=<the generate's attempt id>
//                  body: the finished keyed PNG, `Content-Type: image/png` (readAvatarHeadPng).
//                  Stores it as the guest's head and DELETES the photo.
//                  → 200 PortalAvatarStatus · 404 no such painted try · 400/413/415 a bad PNG
//   GET  (myAvatar) the guest's own head as image/png → 404 until there is one
//
// Brad reads any guest's head at resolveAdminGuestAvatarRoute, and picks the style reference
// with POST adminStyleReference { guestId } → 200 AdminStyleReference · 404 that guest has no head.
export const PORTAL_API_ROUTES = {
  me: "/api/me",
  myVote: "/api/me/vote",
  myAvatar: "/api/me/avatar",
  myAvatarPhoto: "/api/me/avatar/photo",
  myAvatarGenerate: "/api/me/avatar/generate",
  myAvatarAccept: "/api/me/avatar/accept",
  guests: "/api/guests",
  emailLink: "/api/auth/email-link",
  signOut: "/api/auth/sign-out",
  adminGuests: "/api/admin/guests",
  adminInviteAll: "/api/admin/invites",
  adminVotes: "/api/admin/votes",
  adminStyleReference: "/api/admin/style-reference"
} as const;

export const resolveAvatarAcceptRoute = (attemptId: string): string =>
  `${PORTAL_API_ROUTES.myAvatarAccept}?${AVATAR_ATTEMPT_ID_PARAM}=${encodeURIComponent(attemptId)}`;

export const resolveAdminGuestRoute = (guestId: string): string =>
  `${PORTAL_API_ROUTES.adminGuests}/${encodeURIComponent(guestId)}`;

export const resolveAdminGuestInviteRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/invite`;

export const resolveAdminGuestLinkRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/link`;

export const resolveAdminGuestSignOutRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/sign-out`;

export const resolveAdminGuestAvatarRoute = (guestId: string): string =>
  `${resolveAdminGuestRoute(guestId)}/avatar`;

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
  // This guest's head is the one new heads are painted to match.
  isStyleReference: boolean;
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
