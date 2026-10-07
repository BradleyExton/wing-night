import type { PortalFailure } from "../../../utils/portalApi";

export type GuestStanding = "signedIn" | "invited" | "notInvited";

// Every word in Brad's guest list.
export const adminGuestListCopy = {
  eyebrow: "Guest list",
  title: "Guests",
  count: (total: number): string => (total === 1 ? "1 guest" : `${total} guests`),
  inviteAll: (count: number): string => `Invite ${count} more`,
  inviting: "Sending…",
  inviteAllResult: (invited: number, failed: number, remaining: number): string =>
    `${invited} sent${failed > 0 ? `, ${failed} failed` : ""}.${remaining > 0 ? ` ${remaining} still to go — press again.` : ""}`,
  addGuest: "Add a guest",
  add: "Add",
  added: "Added. Invite them, or mint a link to text.",
  standings: {
    signedIn: "Signed in",
    invited: "Invited",
    notInvited: "Not invited"
  } satisfies Record<GuestStanding, string>,
  admin: "Admin",
  noEmail: "No email — text them a link",
  hasHead: "Head",
  hasVoted: "Voted",
  noHead: "No head",
  notVoted: "No vote",
  invite: "Invite",
  reinvite: "Re-invite",
  mintLink: "Link",
  resetTries: "Reset tries",
  tries: (left: number, max: number): string => `Tries ${left}/${max}`,
  resetDone: (max: number): string => `Tries back to ${max}, and any photo they left is deleted.`,
  edit: "Edit",
  save: "Save",
  copy: "Copy",
  copied: "Copied",
  linkLabel: (name: string): string => `${name}'s sign-in link`,
  linkNote: "Shown once. Minting it replaced their old link.",
  invited: "Invite sent.",
  failures: {
    no_email: "They have no address to send to.",
    mail_failed: "The mail didn't go. Try again, or text them a link.",
    network: "No connection. Try again."
  } as Partial<Record<PortalFailure, string>>,
  failed: "That didn't work. Try again."
} as const;
