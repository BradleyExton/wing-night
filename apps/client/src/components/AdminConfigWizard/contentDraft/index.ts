import {
  CONFIG_FILE_KEYS,
  validateDrawingContentFile,
  validateGameConfigFile,
  validatePlayersContentFile,
  validateTeamsContentFile,
  validateTriviaContentFile,
  type ConfigContentSnapshot,
  type ConfigFileEdit,
  type ConfigFileKey,
  type DrawingContentFile,
  type DrawingPrompt,
  type GameConfigFile,
  type PlayersContentEntry,
  type PlayersContentFile,
  type TeamsContentEntry,
  type TeamsContentFile,
  type TriviaContentFile,
  type TriviaPrompt,
  type ValidationIssue
} from "@wingnight/shared";

// The wizard's draft across every editable content file: what it holds, how a
// server snapshot becomes one, and what an apply sends.
//
// The draft holds the WRITE shapes, not the read ones. `ConfigContentSnapshot`
// hands back flat arrays (`players[]`, `triviaPrompts[]`) while
// `ConfigFileEdit.value` must be the whole file object (`{ players: [...] }`,
// `{ prompts: [...] }`) — so the adapter runs ONCE at seed time and the draft is
// thereafter exactly what goes on the wire. Wrapping at apply instead would let
// a draft exist that is not a valid file, which is the state every keystroke
// would pass through.

export type ConfigDraft = {
  gameConfig: GameConfigFile;
  players: PlayersContentFile;
  teams: TeamsContentFile;
  trivia: TriviaContentFile;
  drawing: DrawingContentFile;
};

export const toConfigDraft = (snapshot: ConfigContentSnapshot): ConfigDraft => {
  return {
    gameConfig: snapshot.gameConfig,
    players: { players: snapshot.players },
    teams: { teams: snapshot.teams },
    trivia: { prompts: snapshot.triviaPrompts },
    drawing: { prompts: snapshot.drawingPrompts }
  };
};

// Only the files that actually changed. Sending every file would write a
// `content/local/` copy of each one, and local wins over sample on every later
// read — so an untouched sample file would be silently promoted to an override
// the host never asked for, and would stop tracking the repo's sample content.
export const selectDirtyEdits = (
  draft: ConfigDraft,
  baseline: ConfigDraft
): ConfigFileEdit[] => {
  return CONFIG_FILE_KEYS.filter(
    (key) => JSON.stringify(draft[key]) !== JSON.stringify(baseline[key])
  ).map((key) => ({ key, value: draft[key] }));
};

// Called bare, without the minigame-rules validator, for the reason
// `useConfigWizard` documents: neither `packages/shared` nor the client can
// reach the runtime plugins. This is a pre-check, not a replacement for the
// server's write-path validation.
const VALIDATE_BY_KEY: Readonly<
  Record<ConfigFileKey, (value: unknown) => ValidationIssue[]>
> = Object.freeze({
  gameConfig: validateGameConfigFile,
  players: validatePlayersContentFile,
  teams: validateTeamsContentFile,
  trivia: validateTriviaContentFile,
  drawing: validateDrawingContentFile
});

// Reported in the SAME coordinates the server uses: `contentWriter` prefixes
// every issue with its file key before it reaches the wire, so a locally
// detected issue and a server-reported one address the same field. Without this
// the two sets would be in different coordinate systems and only one would ever
// land on an input.
export const selectDraftIssues = (draft: ConfigDraft): ValidationIssue[] => {
  return CONFIG_FILE_KEYS.flatMap((key) =>
    VALIDATE_BY_KEY[key](draft[key]).map(({ path, message }) => ({
      path: path.length === 0 ? key : `${key}.${path}`,
      message
    }))
  );
};

// New rows arrive blank and therefore invalid, which is the same bargain
// `addRound` already makes: the field is highlighted until the host types into
// it, rather than the row being seeded with a plausible-looking lie.
export const blankPlayer = (): PlayersContentEntry => ({ name: "" });

export const blankTeam = (): TeamsContentEntry => ({ name: "" });

// Prompt ids are minted, never typed: the pack validator requires them
// non-empty and unique within the pack, and a host adding a prompt has no
// reason to care what it is called. The lowest free suffix rather than a random
// or clock-derived id, so the transform is deterministic and testable.
const nextPromptId = (
  prompts: readonly { id: string }[],
  prefix: string
): string => {
  const usedIds = new Set(prompts.map((prompt) => prompt.id));
  let suffix = prompts.length + 1;

  while (usedIds.has(`${prefix}-${suffix}`)) {
    suffix += 1;
  }

  return `${prefix}-${suffix}`;
};

export const nextTriviaPrompt = (
  prompts: readonly TriviaPrompt[]
): TriviaPrompt => ({
  id: nextPromptId(prompts, "trivia"),
  question: "",
  answer: ""
});

export const nextDrawingPrompt = (
  prompts: readonly DrawingPrompt[]
): DrawingPrompt => ({
  id: nextPromptId(prompts, "drawing"),
  prompt: ""
});

// `avatarSrc` is validated on PRESENCE, not definedness — `validatePlayers-
// ContentEntry` tests `"avatarSrc" in value` — so an emptied field has to remove
// the key rather than write "". Writing the empty string would leave the entry
// invalid with an empty input on screen and nothing explaining why.
export const setPlayerAvatarSrc = (
  player: PlayersContentEntry,
  avatarSrc: string
): PlayersContentEntry => {
  const nextPlayer = { ...player };

  if (avatarSrc.trim().length === 0) {
    delete nextPlayer.avatarSrc;

    return nextPlayer;
  }

  return { ...nextPlayer, avatarSrc };
};
