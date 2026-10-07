// The portal's answers, read back from unknown JSON by whoever called it — the teaser's pages,
// and a script holding the admin token. The Worker is ours, but its JSON still crosses a network
// and a deploy boundary, so a page that got an answer it cannot read says so instead of
// rendering `undefined`. Shape checks only, as deep as a caller reads.
import { isNonNegativeInteger, isRecord } from "../../guards/index.js";
import { PORTAL_ERROR_CODES, type PortalErrorCode } from "../index.js";
import { PORTAL_GENRES, TEAM_FORMATS, type GuestVote, type PortalGenre, type TeamFormat } from "../vote/index.js";
import type { AdminAvatarReset, AdminStyleReference, PortalAvatarStatus } from "../avatar/index.js";
import type {
  AdminGuestStatus,
  AdminInviteAllResult,
  AdminInviteResult,
  AdminMintedLink,
  AdminVoteSummary,
  PortalGuest,
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

const isPortalGenre = (value: unknown): value is PortalGenre =>
  isString(value) && (PORTAL_GENRES as readonly string[]).includes(value);

const isTeamFormat = (value: unknown): value is TeamFormat =>
  isString(value) && (TEAM_FORMATS as readonly string[]).includes(value);

// A vote as the API hands one back. The Worker validated it on the way in (isGuestVote); this
// only proves the shape survived the trip.
const isStoredVote = (value: unknown): value is GuestVote => {
  return (
    isRecord(value) &&
    isListOf(value.genreRanking, isPortalGenre) &&
    isListOf(value.teammateWishes, isString) &&
    isTeamFormat(value.teamFormat)
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
    (value.vote === null || isStoredVote(value.vote))
  );
};

export const isPortalGuest = (value: unknown): value is PortalGuest => {
  return isRecord(value) && isString(value.guestId) && isString(value.displayName);
};

export const isPortalGuestList = (value: unknown): value is PortalGuest[] => isListOf(value, isPortalGuest);

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
    isBoolean(value.hasVoted)
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

export const isAdminVoteSummary = (value: unknown): value is AdminVoteSummary => {
  if (!isRecord(value) || !isNonNegativeInteger(value.voterCount) || !isRecord(value.formatTallies)) {
    return false;
  }

  const { formatTallies } = value;

  return (
    isListOf(
      value.genreTallies,
      (tally): tally is AdminVoteSummary["genreTallies"][number] =>
        isRecord(tally) &&
        isPortalGenre(tally.genre) &&
        isNonNegativeInteger(tally.points) &&
        isNonNegativeInteger(tally.firstChoices)
    ) &&
    isListOf(
      value.mutualWishes,
      (wish): wish is AdminVoteSummary["mutualWishes"][number] =>
        isRecord(wish) && isListOf(wish.guests, isPortalGuest) && wish.guests.length === 2
    ) &&
    TEAM_FORMATS.every((format) => isNonNegativeInteger(formatTallies[format])) &&
    isPortalGuestList(value.notVoted)
  );
};
