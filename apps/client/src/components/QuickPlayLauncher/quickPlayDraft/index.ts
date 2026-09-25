import {
  resolveMinigameDefinition,
  type GameConfigFile,
  type MinigameRuleRecord,
  type MinigameType,
  type QuickPlayGame,
  type QuickPlayTeam,
  type Team
} from "@wingnight/shared";

// The launcher's whole draft, and every edit to it as a pure function — the
// same bargain the config wizard makes: the harness renders with
// `renderToStaticMarkup` and never fires an event, so a rule left inside a
// click handler is a rule no test can reach.

export type QuickPlayQueueEntry = {
  minigame: MinigameType;
  // Seeded from the pack's block for this game, then edited in place. Null
  // for a game with no rules key, or a pack that carries no block for it.
  rules: MinigameRuleRecord | null;
  // Seeded from the pack's clock. Null for a host-paced game.
  timerSeconds: number | null;
};

export type QuickPlayDraft = {
  // Roster order, so the deal is stable as people are ticked on and off.
  presentPlayerIds: string[];
  teamCount: number;
  // Which of the first `teamCount` preset teams each present player sits on.
  seatByPlayerId: Record<string, number>;
  queue: QuickPlayQueueEntry[];
};

export const QUICK_PLAY_DEFAULT_TEAM_COUNT = 2;

export const createQuickPlayDraft = (): QuickPlayDraft => ({
  presentPlayerIds: [],
  teamCount: QUICK_PLAY_DEFAULT_TEAM_COUNT,
  seatByPlayerId: {},
  queue: []
});

// Round-robin in the order given, so a fresh deal is the roster's own order
// and a shuffled one is whatever order the shuffle produced.
const dealSeats = (playerIds: readonly string[], teamCount: number): Record<string, number> => {
  return Object.fromEntries(playerIds.map((playerId, index) => [playerId, index % teamCount]));
};

const resolveSeatCounts = (draft: QuickPlayDraft): number[] => {
  const counts = new Array<number>(draft.teamCount).fill(0);

  for (const playerId of draft.presentPlayerIds) {
    const seat = draft.seatByPlayerId[playerId];

    if (seat !== undefined && seat < draft.teamCount) {
      counts[seat] = (counts[seat] ?? 0) + 1;
    }
  }

  return counts;
};

// Ticking someone on seats them where there is most room, so the deal the
// host already looked at does not reshuffle under them; ticking someone off
// just empties their chair.
export const togglePlayer = (
  draft: QuickPlayDraft,
  playerId: string,
  rosterPlayerIds: readonly string[]
): QuickPlayDraft => {
  if (draft.presentPlayerIds.includes(playerId)) {
    const { [playerId]: _removedSeat, ...seatByPlayerId } = draft.seatByPlayerId;

    return {
      ...draft,
      presentPlayerIds: draft.presentPlayerIds.filter((id) => id !== playerId),
      seatByPlayerId
    };
  }

  const counts = resolveSeatCounts(draft);
  const emptiestSeat = counts.indexOf(Math.min(...counts));
  const presentPlayerIds = rosterPlayerIds.filter(
    (id) => id === playerId || draft.presentPlayerIds.includes(id)
  );

  return {
    ...draft,
    presentPlayerIds,
    seatByPlayerId: { ...draft.seatByPlayerId, [playerId]: Math.max(emptiestSeat, 0) }
  };
};

export const setEveryonePresent = (
  draft: QuickPlayDraft,
  rosterPlayerIds: readonly string[]
): QuickPlayDraft => ({
  ...draft,
  presentPlayerIds: [...rosterPlayerIds],
  seatByPlayerId: dealSeats(rosterPlayerIds, draft.teamCount)
});

export const clearPresent = (draft: QuickPlayDraft): QuickPlayDraft => ({
  ...draft,
  presentPlayerIds: [],
  seatByPlayerId: {}
});

// A new team count is a new deal: there is no seating that survives a team
// appearing or vanishing that the host would recognise as "theirs".
export const setTeamCount = (draft: QuickPlayDraft, teamCount: number): QuickPlayDraft => ({
  ...draft,
  teamCount,
  seatByPlayerId: dealSeats(draft.presentPlayerIds, teamCount)
});

// Fisher–Yates over the present players, injected randomness so a test can
// pin the deal.
export const shuffleSeats = (
  draft: QuickPlayDraft,
  random: () => number = Math.random
): QuickPlayDraft => {
  const shuffled = [...draft.presentPlayerIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const held = shuffled[index] as string;
    shuffled[index] = shuffled[swapIndex] as string;
    shuffled[swapIndex] = held;
  }

  return { ...draft, seatByPlayerId: dealSeats(shuffled, draft.teamCount) };
};

// Tap a name to bump it to the next team round the table.
export const cyclePlayerSeat = (draft: QuickPlayDraft, playerId: string): QuickPlayDraft => {
  const seat = draft.seatByPlayerId[playerId];

  if (seat === undefined) {
    return draft;
  }

  return {
    ...draft,
    seatByPlayerId: { ...draft.seatByPlayerId, [playerId]: (seat + 1) % draft.teamCount }
  };
};

// What the pack would play this game with tonight, as the editable seed.
export const seedQueueEntry = (
  minigame: MinigameType,
  gameConfig: GameConfigFile | null
): QuickPlayQueueEntry => {
  const { rulesKey, timerKey } = resolveMinigameDefinition(minigame);
  const packRules = rulesKey === null ? undefined : gameConfig?.minigameRules?.[rulesKey];
  const packTimer = timerKey === null ? undefined : gameConfig?.timers[timerKey];

  return {
    minigame,
    rules: packRules === undefined ? null : structuredClone(packRules),
    timerSeconds: packTimer === undefined ? null : packTimer
  };
};

export const toggleGame = (
  draft: QuickPlayDraft,
  minigame: MinigameType,
  gameConfig: GameConfigFile | null
): QuickPlayDraft => {
  if (draft.queue.some((entry) => entry.minigame === minigame)) {
    return { ...draft, queue: draft.queue.filter((entry) => entry.minigame !== minigame) };
  }

  return { ...draft, queue: [...draft.queue, seedQueueEntry(minigame, gameConfig)] };
};

export const moveGame = (
  draft: QuickPlayDraft,
  minigame: MinigameType,
  direction: -1 | 1
): QuickPlayDraft => {
  const index = draft.queue.findIndex((entry) => entry.minigame === minigame);
  const targetIndex = index + direction;

  if (index === -1 || targetIndex < 0 || targetIndex >= draft.queue.length) {
    return draft;
  }

  const queue = [...draft.queue];
  const held = queue[index] as QuickPlayQueueEntry;
  queue[index] = queue[targetIndex] as QuickPlayQueueEntry;
  queue[targetIndex] = held;

  return { ...draft, queue };
};

export const setGameRule = (
  draft: QuickPlayDraft,
  minigame: MinigameType,
  ruleKey: string,
  value: number | boolean
): QuickPlayDraft => ({
  ...draft,
  queue: draft.queue.map((entry) =>
    entry.minigame === minigame
      ? { ...entry, rules: { ...(entry.rules ?? {}), [ruleKey]: value } }
      : entry
  )
});

export const setGameTimer = (
  draft: QuickPlayDraft,
  minigame: MinigameType,
  timerSeconds: number
): QuickPlayDraft => ({
  ...draft,
  queue: draft.queue.map((entry) =>
    entry.minigame === minigame ? { ...entry, timerSeconds } : entry
  )
});

export type EditableRuleField = {
  key: string;
  value: number | boolean;
};

// Only the scalars the launcher can put a control on. A pack can carry
// richer rules (GEO's score bands are an array); those ride through untouched.
export const resolveEditableRuleFields = (
  rules: MinigameRuleRecord | null
): EditableRuleField[] => {
  if (rules === null) {
    return [];
  }

  return Object.entries(rules).flatMap(([key, value]) =>
    typeof value === "number" || typeof value === "boolean" ? [{ key, value }] : []
  );
};

// `parWingsPerRun` → `Par wings per run`. Good enough for a rule the host
// already knows by name from their own config file.
export const humanizeRuleKey = (ruleKey: string): string => {
  const spaced = ruleKey.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

// The first `teamCount` preset teams, each with the present players seated on
// it, in seat order. Empty teams are kept so the start issues can name them.
export const resolveQuickPlayTeams = (
  draft: QuickPlayDraft,
  presetTeams: readonly Team[]
): QuickPlayTeam[] => {
  return presetTeams.slice(0, draft.teamCount).map((team, seat) => ({
    teamId: team.id,
    playerIds: draft.presentPlayerIds.filter(
      (playerId) => draft.seatByPlayerId[playerId] === seat
    )
  }));
};

export const resolveQuickPlayGames = (draft: QuickPlayDraft): QuickPlayGame[] => {
  return draft.queue.map((entry) => ({
    minigame: entry.minigame,
    rules: entry.rules,
    timerSeconds: entry.timerSeconds
  }));
};
