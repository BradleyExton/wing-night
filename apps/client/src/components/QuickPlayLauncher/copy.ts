import type { QuickPlayStartIssue } from "@wingnight/shared";

import { commonCopy } from "../../copy/common";

const START_ISSUE_LABELS: Record<QuickPlayStartIssue, string> = {
  NO_GAMES: "Queue at least one mini-game.",
  TOO_FEW_TEAMS: "Quick Play needs at least two teams.",
  DUPLICATE_TEAM: "A team is listed twice.",
  EMPTY_TEAM: "Every team needs at least one player.",
  DUPLICATE_PLAYER: "A player is seated on two teams."
};

export const quickPlayLauncherCopy = {
  brandLabel: commonCopy.brandLabel,
  brandMarkPath: commonCopy.brandMarkPath,
  brandMarkAlt: commonCopy.brandMarkAlt,
  eyebrow: "Quick Play",
  title: "Just the games.",
  description:
    "Pick who's here, deal them into teams and queue the mini-games you want to try. No wings, no lock-in: the room opens on the first team's briefing and the TV follows.",
  hostLinkLabel: "Host Controller",
  hostLinkHref: "/host",
  homeLinkLabel: "Back to screen picker",
  homeLinkHref: "/",
  loadingLabel: "Waiting for the room…",
  handoffLabel: "Quick Play is on. Heading to the Host Controller…",
  inProgressTitle: "The room is mid-game.",
  inProgressDescription:
    "Quick Play starts from SETUP. Finish the game on the Host Controller, or reset the room to start fresh.",
  resetRoomButtonLabel: "Reset room to setup",
  resetRoomConfirmLabel: "Yes, reset the room",
  resetRoomCancelLabel: "Keep playing",
  resetRoomConfirmDescription:
    "This throws away the game in progress and returns everyone to setup.",
  noPresetTeamsTitle: "This pack has fewer than two teams.",
  noPresetTeamsDescription:
    "Quick Play deals players onto the pack's preset teams. Add teams in the config wizard first.",
  rosterSectionTitle: "Who's here",
  rosterEveryoneButtonLabel: "Everyone",
  rosterClearButtonLabel: "Clear",
  rosterEmptyLabel: "No players in the pack.",
  rosterToggleAriaLabel: (playerName: string): string => `Toggle ${playerName}`,
  teamsSectionTitle: "Teams",
  teamCountLabel: "How many",
  teamCountChipAriaLabel: (teamCount: number): string => `${teamCount} teams`,
  shuffleButtonLabel: "Shuffle",
  teamEmptyLabel: "Nobody yet",
  teamMemberAriaLabel: (playerName: string, teamName: string): string =>
    `Move ${playerName} off ${teamName}`,
  teamsHint: "Tap a name to bump it to the next team.",
  gamesSectionTitle: "Mini-games",
  gamesHint: "Tap a game to queue it. They play in the order you queue them.",
  queuePositionLabel: (position: number): string => `${position}`,
  queueGameAriaLabel: (gameName: string): string => `Queue ${gameName}`,
  unqueueGameAriaLabel: (gameName: string): string => `Remove ${gameName} from the queue`,
  moveEarlierAriaLabel: (gameName: string): string => `Play ${gameName} earlier`,
  moveLaterAriaLabel: (gameName: string): string => `Play ${gameName} later`,
  moveEarlierGlyph: "↑",
  moveLaterGlyph: "↓",
  settingsTitle: "Rules for tonight",
  timerFieldLabel: "Seconds on the clock",
  noSettingsLabel: "Plays with the pack's rules.",
  startButtonLabel: "Start Quick Play",
  startIssueLabel: (issue: QuickPlayStartIssue): string => START_ISSUE_LABELS[issue],
  readyHint: (gameCount: number, teamCount: number, playerCount: number): string =>
    `${gameCount} game${gameCount === 1 ? "" : "s"} · ${teamCount} teams · ${playerCount} player${
      playerCount === 1 ? "" : "s"
    }`
} as const;
