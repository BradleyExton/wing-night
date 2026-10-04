// What the guest portal's requests carry, read from unknown JSON. The portal answers a request
// that fails one of these with a 400 and never guesses at what was meant.
import { isRecord } from "../../guards/index.js";

export const GUEST_DISPLAY_NAME_MAX_LENGTH = 40;
// RFC 5321's longest deliverable address.
const EMAIL_MAX_LENGTH = 254;
// Deliberately loose: one @, something either side, a dot in the domain. Whether an address
// really takes mail is the mail service's to find out.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// An address as the portal stores and compares it: trimmed and lower-cased, so an invite to
// "Rob@Example.com" and a sign-in request for "rob@example.com " are the same guest. Null when
// it is not an address at all.
export const normalizeGuestEmail = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();

  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email) ? email : null;
};

// Inner runs of whitespace collapse, so "Rob  " and "Rob" are one name on every list.
export const normalizeGuestDisplayName = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const displayName = value.trim().replace(/\s+/g, " ");

  return displayName.length > 0 && displayName.length <= GUEST_DISPLAY_NAME_MAX_LENGTH
    ? displayName
    : null;
};

export type EmailLinkRequest = {
  email: string;
};

export const isEmailLinkRequest = (value: unknown): value is EmailLinkRequest => {
  return isRecord(value) && normalizeGuestEmail(value.email) !== null;
};

// A guest may have no address: Brad can still text them a personal link by hand.
export type AdminCreateGuestRequest = {
  displayName: string;
  email: string | null;
};

export const isAdminCreateGuestRequest = (value: unknown): value is AdminCreateGuestRequest => {
  return (
    isRecord(value) &&
    normalizeGuestDisplayName(value.displayName) !== null &&
    (value.email === null || normalizeGuestEmail(value.email) !== null)
  );
};

// Either field may be left out to leave it as it is; `email: null` clears the address.
export type AdminEditGuestRequest = {
  displayName?: string;
  email?: string | null;
};

export const isAdminEditGuestRequest = (value: unknown): value is AdminEditGuestRequest => {
  if (!isRecord(value) || (value.displayName === undefined && value.email === undefined)) {
    return false;
  }

  return (
    (value.displayName === undefined || normalizeGuestDisplayName(value.displayName) !== null) &&
    (value.email === undefined || value.email === null || normalizeGuestEmail(value.email) !== null)
  );
};
