import type { AdminGuestStatus } from "@wingnight/shared/guestPortal";

import type { GuestStanding } from "./copy";

// Where a guest is with signing in: once they have, the invite no longer matters.
export const resolveGuestStanding = (guest: Pick<AdminGuestStatus, "claimedAt" | "invitedAt">): GuestStanding =>
  guest.claimedAt !== null ? "signedIn" : guest.invitedAt !== null ? "invited" : "notInvited";
