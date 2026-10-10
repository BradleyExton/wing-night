// The portal's answers, read back from unknown JSON by whoever called it — the teaser's pages,
// and a script holding the admin token. The Worker is ours, but its JSON still crosses a network
// and a deploy boundary, so a page that got an answer it cannot read says so instead of
// rendering `undefined`. Shape checks only, as deep as a caller reads.
import { isNonNegativeInteger, isRecord } from "../../guards/index.js";
import { isTeamColorToken } from "../../teamTheme/index.js";
import { PORTAL_ERROR_CODES, type PortalErrorCode } from "../index.js";
import {
  isTeamPick,
  type AdminPicksState,
  type AdminTeamBoard,
  type PortalTeam,
  type PortalTeamList,
  type PortalTeamMember,
  type PortalTeamPicked
} from "../teamPick/index.js";
import type { AdminAvatarReset, AdminStyleReference, PortalAvatarStatus } from "../avatar/index.js";
import type {
  AdminGuestStatus,
  AdminInviteAllResult,
  AdminInviteResult,
  AdminMintedLink,
  PortalMe
} from "../index.js";

const isString = (value: unknown): value is string => typeof value === "string";
const isNullableString = (value: unknown): value is string | null => value === null || isString(value);
const isNullableTime = (value: unknown): value is number | null => value === null || isNonNegativeInteger(value);
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isListOf = <T>(value: unknown, guard: (entry: unknown) => entry is T): value is T[] =>
  Array.isArray(value) && value.every(guard);

export const isPortalErrorCode = (value: unknown): value is PortalErrorCode => {
  return isString(value) && (PORTAL_ERROR_CODES as readonly string[]).includes(value);
};

// The `{ error }` body of a failed request, or null when it is not one.
export const readPortalErrorCode = (value: unknown): PortalErrorCode | null => {
  return isRecord(value) && isPortalErrorCode(value.error) ? value.error : null;
};

export const isPortalAvatarStatus = (value: unknown): value is PortalAvatarStatus => {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.triesMax) &&
    isNonNegativeInteger(value.triesLeft) &&
    isBoolean(value.hasPhoto) &&
    isNullableString(value.headHash)
  );
};

export const isPortalMe = (value: unknown): value is PortalMe => {
  return (
    isRecord(value) &&
    isString(value.guestId) &&
    isString(value.displayName) &&
    isNullableString(value.email) &&
    isBoolean(value.isAdmin) &&
    isBoolean(value.hasHead) &&
    isPortalAvatarStatus(value.avatar) &&
    (value.team === null || isTeamPick(value.team)) &&
    isBoolean(value.picksClosed)
  );
};

export const isAdminGuestStatus = (value: unknown): value is AdminGuestStatus => {
  return (
    isRecord(value) &&
    isString(value.guestId) &&
    isString(value.displayName) &&
    isNullableString(value.email) &&
    isBoolean(value.isAdmin) &&
    isNonNegativeInteger(value.createdAt) &&
    isNullableTime(value.invitedAt) &&
    isNullableTime(value.claimedAt) &&
    isNullableTime(value.lastSeenAt) &&
    isBoolean(value.hasHead) &&
    isNullableString(value.headHash) &&
    isBoolean(value.isStyleReference) &&
    isNonNegativeInteger(value.triesLeft) &&
    isNullableString(value.team)
  );
};

export const isAdminGuestList = (value: unknown): value is AdminGuestStatus[] =>
  isListOf(value, isAdminGuestStatus);

export const isAdminMintedLink = (value: unknown): value is AdminMintedLink => {
  return isRecord(value) && isString(value.guestId) && isString(value.url);
};

export const isAdminInviteResult = (value: unknown): value is AdminInviteResult => {
  return isRecord(value) && isString(value.guestId) && isNonNegativeInteger(value.invitedAt);
};

export const isAdminInviteAllResult = (value: unknown): value is AdminInviteAllResult => {
  return (
    isRecord(value) &&
    isListOf(value.invited, isString) &&
    isListOf(value.failed, isString) &&
    isNonNegativeInteger(value.remaining)
  );
};

export const isAdminStyleReference = (value: unknown): value is AdminStyleReference => {
  return (
    isRecord(value) && isString(value.guestId) && isString(value.headHash) && isNonNegativeInteger(value.pickedAt)
  );
};

export const isAdminAvatarReset = (value: unknown): value is AdminAvatarReset => {
  return isRecord(value) && isString(value.guestId) && isPortalAvatarStatus(value.avatar);
};

const isPortalTeamMember = (value: unknown): value is PortalTeamMember => {
  return isRecord(value) && isString(value.guestId) && isString(value.displayName) && isNullableString(value.headHash);
};

// `genre` and `color` are optional on the way out, as on a roster `Team`: absent, not null.
const isPortalTeam = (value: unknown): value is PortalTeam => {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    (value.genre === undefined || isString(value.genre)) &&
    (value.color === undefined || isTeamColorToken(value.color)) &&
    isListOf(value.members, isPortalTeamMember)
  );
};

export const isPortalTeamList = (value: unknown): value is PortalTeamList => {
  return (
    isRecord(value) &&
    isListOf(value.teams, isPortalTeam) &&
    isNonNegativeInteger(value.seatCap) &&
    isBoolean(value.picksClosed)
  );
};

export const isPortalTeamPicked = (value: unknown): value is PortalTeamPicked => {
  return isRecord(value) && isTeamPick(value.team) && isPortalTeamList(value.teams);
};

export const isAdminTeamBoard = (value: unknown): value is AdminTeamBoard => {
  if (!isRecord(value)) {
    return false;
  }

  const { unseated } = value;

  return isPortalTeamList(value) && isListOf(unseated, isPortalTeamMember);
};

export const isAdminPicksState = (value: unknown): value is AdminPicksState => {
  return isRecord(value) && isBoolean(value.picksClosed);
};
