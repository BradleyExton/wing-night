import type { PortalFailure } from "../../../utils/portalApi";

export const adminGuestFormCopy = {
  nameLabel: "Name",
  namePlaceholder: "As the TV should say it",
  emailLabel: "Email (optional)",
  emailPlaceholder: "Leave blank to text them a link",
  cancel: "Cancel",
  saving: "Saving…",
  failures: {
    email_taken: "Another guest already has that address.",
    bad_request: "Check the name (40 letters at most) and the address."
  } as Partial<Record<PortalFailure, string>>,
  failed: "That didn't save. Try again."
} as const;
