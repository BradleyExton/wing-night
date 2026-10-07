import {
  hasMalformedFeaturedPlayers,
  isNumberRecord,
  isStringArray,
  readFeaturedPlayers
} from "@wingnight/shared";
import type {
  ContestantController,
  MinigameDisplayView,
  MinigameHostView,
  MinigameType,
  Player,
  Team
} from "@wingnight/shared";
import type { ComponentType, ReactNode } from "react";

export type SerializablePrimitive = null | boolean | number | string;

export type SerializableValue =
  | SerializablePrimitive
  | SerializableValue[]
  | { [key: string]: SerializableValue };

export type SerializableRecord = { [key: string]: SerializableValue };

export type MinigameRuntimeActionEnvelope = {
  actionType: string;
  actionPayload: SerializableValue;
  // Server wall-clock at receipt, stamped by `dispatchMinigameAction`, so a
  // timing-aware reducer stays pure: it reads a number off the envelope and
  // its tests pass literal timestamps. Optional because the fixtures written
  // before it omit it; a reducer that needs it refuses an action without it.
  receivedAtMs?: number;
};

export type MinigameRuntimeInitializationInput = {
  teamIds: string[];
  // The night's roster and seating. Most games never look: a turn is a team's,
  // and the team ids above are the whole board. JOUST is the exception — it
  // racks up every player who is not shooting, so it needs to know who they
  // are and which side they are on.
  players: Player[];
  teams: Team[];
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
  // What this game's `selectRoundMemory` handed forward from the previous
  // team's turn in the SAME round, or null on the round's first turn (and for
  // a plugin that keeps no memory). Runtime state is re-initialised for every
  // team, so this is the one way a round-long fact — a best run to race, a
  // target already taken — crosses from one turn to the next.
  roundMemory?: SerializableValue | null;
};

export type MinigameRuntimeReductionInput = {
  state: SerializableValue;
  envelope: MinigameRuntimeActionEnvelope;
  pointsMax: number;
  rules: SerializableValue | null;
  content: SerializableValue | null;
};

export type MinigameRuntimeSyncPendingPointsInput = {
  state: SerializableValue;
  pendingPointsByTeamId: Record<string, number>;
};

export type MinigameRuntimeSyncContentInput = {
  state: SerializableValue;
  rules: SerializableValue | null;
  content: SerializableValue | null;
};

export type MinigameRuntimeSelectorInput = {
  state: SerializableValue;
  rules: SerializableValue | null;
  content: SerializableValue | null;
};

export type MinigameRuntimeReductionResult = {
  state: SerializableValue;
  didMutate: boolean;
};

export type MinigameRuntimeContentAdapter = {
  fileName: string;
  parseFileContent: (
    rawContent: string,
    contentFilePath: string
  ) => SerializableValue;
};

export type MinigameRuntimePlugin = {
  id: MinigameType;
  content?: MinigameRuntimeContentAdapter;
  // Optional config-load-time validation for this game's minigameRules block.
  // The server content loader calls it (when defined) so invalid rules still
  // fail fast at startup with a clear error.
  isRules?: (value: unknown) => boolean;
  initialize: (input: MinigameRuntimeInitializationInput) => SerializableValue | null;
  // `reduceAction`, `syncPendingPoints` and `syncContent` MUST NOT mutate
  // `input.state`. They return the next state; the one they were handed has to
  // keep describing the room as it was before the action.
  //
  // This is not tidiness, it is what undo is built on. The server captures an
  // undo point by HOLDING A REFERENCE to the current runtime state rather than
  // deep-copying it — a copy per action meant cloning every stroke on the easel
  // fourteen times a second during a DRAWING turn. A reducer that writes
  // through to `input.state` would rewrite the undo point under the host's
  // feet, and nothing would report it. Rebuild by spreading, always.
  reduceAction: (input: MinigameRuntimeReductionInput) => MinigameRuntimeReductionResult;
  // Optional: the actions that are the turn being PLAYED rather than judged —
  // a stroke, a flap, an aim, a typed emoji, a forgery landing. They never
  // become the host's "Undo Last Score" point. Every other action that mutates
  // does, so a DRAWING point stays undoable while the next sketch streams in
  // fourteen sends a second, which used to replace it within 70ms.
  transientActionTypes?: readonly string[];
  syncPendingPoints?: (input: MinigameRuntimeSyncPendingPointsInput) => SerializableValue;
  syncContent?: (input: MinigameRuntimeSyncContentInput) => SerializableValue;
  selectHostView: (input: MinigameRuntimeSelectorInput) => MinigameHostView | null;
  selectDisplayView: (input: MinigameRuntimeSelectorInput) => MinigameDisplayView | null;
  // Optional: what the round should remember of this state once the turn is
  // over, handed to the next team's `initialize` as `roundMemory`. The server
  // reads it after every change to the state, so a memory is always the
  // latest state's — including after an undo — and never a stale one taken
  // at the turn's end. Cleared when a round starts. Serializable, like state.
  selectRoundMemory?: (input: MinigameRuntimeSelectorInput) => SerializableValue | null;
  // The phone hooks, implemented by the four arcade relays alone (`CONTESTANT_MINIGAME_TYPES`)
  // and by no game whose host view carries an answer. A game with both can be played leg by leg
  // on each contestant's own phone; one without either stays on the tablet whatever the host sets.
  //
  // `selectContestant`: the leg in hand and whose it is — null when no leg is (the turn is
  // over). `contestantActionTypes`: what that player's phone may send — the inputs and the
  // run's own end, never a skip, a reset or anything that paces the turn for the room.
  selectContestant?: (input: MinigameRuntimeSelectorInput) => MinigameContestant | null;
  contestantActionTypes?: readonly string[];
  // Optional, beside the two above: the host action that restarts the leg in hand when the host
  // takes it back from a phone, so the tablet starts it clean rather than inheriting a log it
  // could never continue. Absent for a game whose legs are atomic (a JOUST shot): taking one
  // back only moves the next leg to the tablet.
  contestantRetakeActionType?: string;
  // Optional, beside the hooks above: the host action that starts the whole turn over from its
  // first leg with every log fresh. Legs the tablet held (taken back, or begun on the tablet) go
  // back to their contestants' phones when it lands.
  contestantResetActionType?: string;
  // Optional: an action the SERVER sends on its own clock — a deadline the game enforces with no
  // device's help, so it still lands with the phone that was playing gone. Null while there is
  // none. Read after every broadcast; the server dispatches `actionType` at `atMs` (its own wall
  // clock, the one `receivedAtMs` is stamped with) unless the state has moved on by then.
  selectDeadlineAction?: (input: MinigameRuntimeSelectorInput) => MinigameDeadlineAction | null;
};

// The leg in hand of an arcade relay (`MinigameRuntimePlugin.selectContestant`). `legIndex`
// names it for the turn — FAPPY's leg, SCHLONIC's run, BRAWL's block, JOUST's shot — so a leg the
// host took back stays the tablet's however many attempts it takes. Either player may be null:
// the house bird flies a leg with nobody behind it.
export type MinigameContestant = {
  legIndex: number;
  playerId: string | null;
  nextPlayerId: string | null;
};

export type MinigameDeadlineAction = {
  actionType: string;
  atMs: number;
};

export type MinigameSurfacePhase = "intro" | "play";

export type MinigameActionDispatch = (
  actionType: string,
  actionPayload: SerializableValue
) => void;

export type MinigameHostRendererProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType;
  minigameHostView: MinigameHostView | null;
  // The turn's team, resolved ONCE by the shell with the mini-rail's own
  // precedence (`selectHeaderContext`: the turn's team, else the round's), so
  // the string here and the string in the rail are the same string. A host
  // surface must not render it as chrome — the rail says it, and saying it
  // twice on one canvas is the duplication this seam exists to remove — but a
  // sentence that needs the name may still use it.
  activeTeamName: string | null;
  teamNameByTeamId: Map<string, string>;
  // Shell-owned takeover chrome, two slots rather than one `chrome` object:
  // a multi-field configuration object is what `docs/adr/0002` guardrail 2
  // forbids, and these two have nothing to do with each other beyond where
  // they land. `rail` is the shell's `<HostMiniRail />`, `clock` its
  // `<TakeoverTimerChip />`, which renders nothing when the room has no timer.
  //
  // A host surface never renders either one itself: it forwards them into
  // `<TakeoverStage>`'s or `<TakeoverCanvas>`'s `rail` and `clock` slots and
  // lets the layout place them (docs/takeover-layout-api.md §4, §5). Both are
  // `null` on the intro deck, which is a panel in the host's own control deck
  // rather than a takeover and carries no chrome of its own.
  rail: ReactNode;
  clock: ReactNode;
  canDispatchAction: boolean;
  onDispatchAction: MinigameActionDispatch;
  // Origin of the asset-serving Express app, for the same reason the display
  // props carry one: the host tablet is a different origin from the server too,
  // so a content-pack image (a GEO photo, a player's head) has to be addressed
  // absolutely. `null` until the host app has resolved it in an effect.
  serverOrigin: string | null;
  // Who the surface is in front of (`MinigameSeat`). Required, so every shell says which seat
  // it is; a game that has nothing seat-specific — every non-arcade one — simply ignores it.
  seat: MinigameSeat;
  // Who plays the leg in hand (`MinigameHandset`), for the copy that tells players what to pick
  // up: "pass the tablet" or "their phone is live". Games without phone turns ignore it.
  handset: MinigameHandset;
};

// Who a host surface is in front of: one union, never a set of flags (ADR-0002 guardrail 2).
// - "host": the party's host tablet. Every escape hatch (skip, reset, the next-shot pacing), the
//   room's running totals and the "advance the phase" hint. Silent: the TV is the room's speaker.
// - "solo": the online teaser (wingnight.tv), where one phone is the whole room — no TV and no
//   host. Its own speaker (the TV's soundboard plays here), no skip, Reset reads Restart, no
//   room standings and nobody to ask to advance the phase.
// - "contestant": a guest's own phone at the party, playing their own leg of a relay. No escape
//   hatches at all (the host keeps every one on the tablet), no running totals, no phase hint,
//   and NO sound — the TV is still the room's only speaker.
export type MinigameSeat = "host" | "solo" | "contestant";

// The one seat that makes sound. The TV is the room's speaker at the party, so the host tablet and
// a contestant's phone are both silent; only a solo phone, which has no TV beside it, plays the
// game's soundboard itself. Every arcade surface asks this rather than comparing seats, so the
// rule that a guest's phone never makes a noise lives in one place.
export const isSpeakerSeat = (seat: MinigameSeat): boolean => {
  return seat === "solo";
};

export type MinigameDisplayRendererProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType;
  minigameDisplayView: MinigameDisplayView | null;
  activeTeamName: string | null;
  // The TV's turn clock, the display twin of the host props' `clock`
  // (docs/takeover-layout-api.md §6). It used to pin itself over the stage's
  // top-right corner, so eight of the nine display surfaces hand-typed
  // `pr-[clamp(8rem,14vw,18rem)]` against it and EMOJI_CHARADES held an empty
  // grid column — while only three of the nine have a `timerKey` at all, so
  // six of those reserves guarded a chip that never draws.
  //
  // It is a slot now: the surface puts it in its marquee's meta cell, and a
  // clock that renders nothing takes no width. The reserve follows from
  // whether the chip renders because there is no reserve. `null` from any
  // harness that has no room clock to show.
  clock: ReactNode;
  // The clock's other half: the lit length the shell's `MinigameTimerLine`
  // draws in the marquee's track under the row, burning down as the turn
  // runs. Same contract as `clock` — null for a room with no timer, and a
  // surface seats it in `<NeonMarquee clockLine>` and nowhere else.
  clockLine: ReactNode;
  // Origin of the asset-serving Express app, for surfaces that fetch
  // server-hosted media. There is no dev proxy in this repo, so the display is
  // always a different origin from the server and a root-relative media URL
  // would 404 against the Vite origin. `null` until the host app has resolved
  // it — resolution reads `window`, so it happens in an effect.
  serverOrigin: string | null;
  // Who plays the leg in hand (`MinigameHandset`). A fact the room is told, not a behaviour: an
  // arcade relay's wall says "grab the tablet" or "your phone is live" at the handoff.
  handset: MinigameHandset;
};

// Who plays the leg in hand of an arcade relay: the tablet, passed hand to hand, or the
// contestant's own phone. What the server says actually holds the leg (`contestantTurn
// .controller`), never just the turn's mode — a phones turn whose next player has no phone
// plays that leg on the tablet, and the copy has to say so. On a briefing, before any leg is in
// hand: "phone" when the turn is on phones and someone on the team has one. Every game with no
// phone turns, and every harness with no room, says "tablet".
export type MinigameHandset = ContestantController;

export type MinigameRendererBundle = {
  HostSurface: ComponentType<MinigameHostRendererProps>;
  DisplaySurface: ComponentType<MinigameDisplayRendererProps>;
  // Declares that the display surface is the room's speaker for this game, so
  // the display shell knows to offer its tap-to-enable-audio overlay even when
  // the active team has no anthem to play.
  requiresDisplayAudio?: boolean;
};

// Everything the dev sandbox needs to boot a minigame's runtime plugin with
// fake teams: the same inputs the server passes to initialize(), supplied by
// each package because the browser cannot read content/sample/.
export type MinigameDevManifest = {
  teamIds: string[];
  players: Player[];
  teams: Team[];
  teamNameByTeamId: Record<string, string>;
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
};

// A scripted move the dev sandbox offers as a button, and nothing outside the sandbox ever renders:
// the game's own harness, for an e2e that must drive the real reducer with input no pointer can
// reproduce (Mount Your Hens' goose bot, a climb timed to the tick). `resolve` reads the host view
// the sandbox is showing and names the action to dispatch through the sandbox's own reducer — the
// same path the tablet's actions take — or null when it has nothing to do right now. Functions,
// not data, so it lives beside the manifest (the client registry) rather than in it: a manifest
// may arrive from the server's content pack, and that copy is JSON.
export type MinigameDevAction = {
  id: string;
  label: string;
  resolve: (
    hostView: MinigameHostView | null
  ) => { actionType: string; actionPayload: SerializableValue } | null;
};

export type CreateDevManifestInput = {
  rules: SerializableValue | null;
  content: SerializableValue | null;
  pointsMax?: number;
};

// Twelve named players seated three a side across four teams — the shape of a real night, so a
// game that draws the room (JOUST racks up everyone who is not shooting) has a plausible crowd to
// draw, and so the sandbox can reach the per-team content of every team in the turn order. No
// avatars: the sandbox has no content pack to serve heads from.
const DEV_PLAYERS: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Caitlin" },
  { id: "player-3", name: "Dan" },
  { id: "player-4", name: "Rosie" },
  { id: "player-5", name: "Darren" },
  { id: "player-6", name: "Sarah" },
  { id: "player-7", name: "Jazz" },
  { id: "player-8", name: "Dylan" },
  { id: "player-9", name: "Rob" },
  { id: "player-10", name: "Tay" },
  { id: "player-11", name: "Steve" },
  { id: "player-12", name: "Joleeza" }
];

const DEV_TEAM_NAMES = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"] as const;
const DEV_TEAM_IDS = ["team-alpha", "team-beta", "team-gamma", "team-delta"] as const;
const DEV_TEAM_GENRES = ["Metal", "Disco", "Country", "Pop"] as const;

const DEV_TEAMS: Team[] = DEV_TEAM_IDS.map((teamId, index) => ({
  id: teamId,
  name: DEV_TEAM_NAMES[index] ?? teamId,
  playerIds: DEV_PLAYERS.slice(index * 3, index * 3 + 3).map((player) => player.id),
  totalScore: 0,
  genre: DEV_TEAM_GENRES[index]
}));

// Standard four-team sandbox fixture shared by every minigame package; only
// the game-specific rules/content (and optionally pointsMax) vary per game.
export const createDevManifest = ({
  rules,
  content,
  pointsMax = 15
}: CreateDevManifestInput): MinigameDevManifest => {
  return {
    teamIds: [...DEV_TEAM_IDS],
    players: DEV_PLAYERS,
    teams: DEV_TEAMS,
    teamNameByTeamId: Object.fromEntries(DEV_TEAMS.map((team) => [team.id, team.name])),
    activeRoundTeamId: DEV_TEAM_IDS[0],
    pointsMax,
    pendingPointsByTeamId: Object.fromEntries(DEV_TEAMS.map((team) => [team.id, 0])),
    rules,
    content
  };
};

export type PromptContentFile<TPrompt> = {
  prompts: TPrompt[];
};

export type PromptContentAdapter<TPrompt> = {
  fileName: string;
  clonePrompt: (prompt: TPrompt) => TPrompt;
  parseFileContent: (
    rawContent: string,
    contentFilePath: string
  ) => PromptContentFile<TPrompt>;
  resolveContent: (
    content: SerializableValue | null
  ) => PromptContentFile<TPrompt>;
};

export type CreatePromptContentAdapterInput<TPrompt> = {
  // Lowercase name used in error messages, e.g. "trivia".
  label: string;
  // Content file path relative to the content root, e.g. "minigames/trivia.json".
  fileName: string;
  // Shape hint appended to the invalid-content error, e.g.
  // "expected { prompts: [{ id, question, answer }] }.".
  invalidContentHint: string;
  isContentFile: (value: unknown) => value is PromptContentFile<TPrompt>;
  isPrompt: (value: unknown) => value is TPrompt;
  clonePrompt: (prompt: TPrompt) => TPrompt;
};

// Shared prompt-bank content pipeline: strict parse (used by the server
// content loader, throws with file context) plus a lenient resolve (used at
// runtime, drops anything malformed).
export const createPromptContentAdapter = <TPrompt>({
  label,
  fileName,
  invalidContentHint,
  isContentFile,
  isPrompt,
  clonePrompt
}: CreatePromptContentAdapterInput<TPrompt>): PromptContentAdapter<TPrompt> => {
  // Each minigame's `clonePrompt` re-adds its known fields BY HAND, on purpose
  // — that is what stops an unknown key riding into room state. The roster tag
  // is the one field every bank shares, so it is carried here instead of in
  // three hand-written clones: a new prompt bank inherits tagging for free, and
  // no bank can forget to copy it.
  const clonePromptWithFeaturedPlayers = (prompt: TPrompt): TPrompt => {
    const featuredPlayers = readFeaturedPlayers(prompt);
    const clonedPrompt = clonePrompt(prompt);

    if (featuredPlayers === null) {
      return clonedPrompt;
    }

    return { ...clonedPrompt, featuredPlayers: [...featuredPlayers] };
  };

  const parseFileContent = (
    rawContent: string,
    contentFilePath: string
  ): PromptContentFile<TPrompt> => {
    let parsedContent: unknown;

    try {
      parsedContent = JSON.parse(rawContent);
    } catch (error) {
      const parseReason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to parse ${label} content at "${contentFilePath}": ${parseReason}`
      );
    }

    if (!isContentFile(parsedContent)) {
      throw new Error(
        `Invalid ${label} content at "${contentFilePath}": ${invalidContentHint}`
      );
    }

    // Checked AFTER `isContentFile`, so the shape error a pack author sees is
    // the most specific one available: "prompt 3's tags are wrong", not
    // "this file is wrong". Tags are hand-edited, so this is the likeliest
    // mistake in the file and the one worth naming precisely.
    const malformedTagIndex = parsedContent.prompts.findIndex((prompt) => {
      return hasMalformedFeaturedPlayers(prompt);
    });

    if (malformedTagIndex !== -1) {
      throw new Error(
        `Invalid ${label} content at "${contentFilePath}": prompts[${malformedTagIndex}].featuredPlayers must be an array of player names.`
      );
    }

    return {
      prompts: parsedContent.prompts.map(clonePromptWithFeaturedPlayers)
    };
  };

  const resolveContent = (
    content: SerializableValue | null
  ): PromptContentFile<TPrompt> => {
    if (typeof content !== "object" || content === null) {
      return { prompts: [] };
    }

    if (!("prompts" in content) || !Array.isArray(content.prompts)) {
      return { prompts: [] };
    }

    const candidatePrompts: unknown[] = content.prompts;
    const prompts = candidatePrompts.filter((prompt): prompt is TPrompt => {
      return isPrompt(prompt);
    });

    return {
      prompts: prompts.map(clonePromptWithFeaturedPlayers)
    };
  };

  return {
    fileName,
    clonePrompt,
    parseFileContent,
    resolveContent
  };
};

export type ResolveSeededPromptCursorInput = {
  // The room's turn order, so a team's position in it decides its slice.
  teamIds: string[];
  activeRoundTeamId: string | null;
  // How many prompts this team will burn through on its turn.
  promptsPerTurn: number;
  // How many prompts the bank holds.
  promptCount: number;
};

// Seed each team's cursor into a distinct content slice so later teams never
// replay a prompt an earlier team already answered aloud this round.
//
// The wrap is deliberate: a bank smaller than teams x promptsPerTurn HAS to
// repeat, and a repeat is a better party than an empty screen. It does mean a
// short bank replays silently, so size the bank for the roster.
export const resolveSeededPromptCursor = ({
  teamIds,
  activeRoundTeamId,
  promptsPerTurn,
  promptCount
}: ResolveSeededPromptCursorInput): number => {
  if (promptCount === 0) {
    return 0;
  }

  const teamIndex =
    activeRoundTeamId === null ? 0 : Math.max(0, teamIds.indexOf(activeRoundTeamId));

  return (teamIndex * promptsPerTurn) % promptCount;
};

const isSerializableRecord = (
  value: Record<string, unknown>
): value is { [key: string]: SerializableValue } => {
  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }

  return Object.values(value).every((entry) => isSerializableValue(entry));
};

export const isSerializableValue = (value: unknown): value is SerializableValue => {
  if (value === null) {
    return true;
  }

  if (typeof value === "boolean" || typeof value === "string") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every((entry) => isSerializableValue(entry));
  }

  if (typeof value === "object") {
    return isSerializableRecord(value as Record<string, unknown>);
  }

  return false;
};

const isStringRecord = (value: unknown): value is Record<string, string> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "string");
};

const isNamedEntity = (value: unknown): boolean => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entity = value as { id?: unknown; name?: unknown };

  return typeof entity.id === "string" && typeof entity.name === "string";
};

// Guards a manifest that arrived over the wire — the dev sandbox fetches one
// from the server so it can seed itself from the real content pack. Only the
// fields the sandbox hands `initialize()` are checked, and a `false` here
// keeps the sandbox on its bundled fixture rather than blanking it.
export const isMinigameDevManifest = (
  value: unknown
): value is MinigameDevManifest => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const manifest = value as Record<string, unknown>;

  return (
    isStringArray(manifest.teamIds) &&
    Array.isArray(manifest.players) &&
    manifest.players.every((player) => isNamedEntity(player)) &&
    Array.isArray(manifest.teams) &&
    manifest.teams.every((team) => isNamedEntity(team)) &&
    isStringRecord(manifest.teamNameByTeamId) &&
    (manifest.activeRoundTeamId === null ||
      typeof manifest.activeRoundTeamId === "string") &&
    typeof manifest.pointsMax === "number" &&
    Number.isFinite(manifest.pointsMax) &&
    isNumberRecord(manifest.pendingPointsByTeamId) &&
    isSerializableValue(manifest.rules) &&
    isSerializableValue(manifest.content)
  );
};

// A reveal is a two-second window on the answer a tablet just ruled on, and
// both of its timestamps are stamped by the SERVER's clock.
//
// Which is why a surface must never compare `expiresAtMs` against its own
// `Date.now()`: the TV, the host tablet and the server are three devices with
// three clocks, and the window is 2000ms. A display running two seconds fast
// finds every reveal already expired and never shows the room an answer at
// all; one running slow pins the answer on screen long past its welcome.
// Nothing warns anybody — the surface just quietly stops doing its job.
//
// The DIFFERENCE between the two stamps has no such problem. Both come off the
// same clock, so it is a duration, and a duration means the same thing on
// every device. Surfaces time the window from the moment they see the reveal,
// for as long as this says.
export type MinigameRevealWindow = {
  revealedAtMs: number;
  expiresAtMs: number;
};

export const resolveRevealDurationMs = (reveal: MinigameRevealWindow): number => {
  return Math.max(0, reveal.expiresAtMs - reveal.revealedAtMs);
};
