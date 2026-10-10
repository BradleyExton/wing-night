import type { PortalFailure } from "../../../utils/portalApi";

// Every word in the team card.
export const teamPickCardCopy = {
  eyebrow: "Your team",
  title: "Pick your team",
  body: "Tap a team and you're on it. Your bird dresses for it on the spot. Switch any time until Brad closes the picks.",
  closedBody: "Teams are set.",
  loading: "Finding the teams…",
  loadFailed: "We couldn't load the teams. Refresh to try again.",
  noTeams: "No teams yet. Brad is still writing the roster.",
  seats: (taken: number, cap: number): string => `${taken} of ${cap} seats`,
  full: "Full",
  tileLabel: (name: string, taken: number, cap: number, isFull: boolean): string =>
    isFull ? `${name}, full` : `${name}, ${taken} of ${cap} seats`,
  memberBirdLabel: (name: string): string => `${name}'s bird`,
  orphaned: "Your team isn't on the list any more. Pick again.",
  saving: "Saving…",
  saved: (name: string): string => `You're on ${name}.`,
  failures: {
    team_full: "That team just filled up.",
    picks_closed: "Teams are set.",
    network: "No connection. Try again."
  } as Partial<Record<PortalFailure, string>>,
  failed: "That didn't save. Try again."
} as const;
