import {
  hasMalformedFeaturedPlayers,
  readFeaturedPlayers
} from "@wingnight/shared";
import type {
  MinigameDisplayView,
  MinigameHostView,
  MinigameType
} from "@wingnight/shared";
import type { ComponentType } from "react";

export type SerializablePrimitive = null | boolean | number | string;

export type SerializableValue =
  | SerializablePrimitive
  | SerializableValue[]
  | { [key: string]: SerializableValue };

export type SerializableRecord = { [key: string]: SerializableValue };

export type MinigameRuntimeActionEnvelope = {
  actionType: string;
  actionPayload: SerializableValue;
};

export type MinigameRuntimeInitializationInput = {
  teamIds: string[];
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
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
  reduceAction: (input: MinigameRuntimeReductionInput) => MinigameRuntimeReductionResult;
  syncPendingPoints?: (input: MinigameRuntimeSyncPendingPointsInput) => SerializableValue;
  syncContent?: (input: MinigameRuntimeSyncContentInput) => SerializableValue;
  selectHostView: (input: MinigameRuntimeSelectorInput) => MinigameHostView | null;
  selectDisplayView: (input: MinigameRuntimeSelectorInput) => MinigameDisplayView | null;
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
  activeTeamName: string | null;
  teamNameByTeamId: Map<string, string>;
  canDispatchAction: boolean;
  onDispatchAction: MinigameActionDispatch;
};

export type MinigameDisplayRendererProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType;
  minigameDisplayView: MinigameDisplayView | null;
  activeTeamName: string | null;
  // Origin of the asset-serving Express app, for surfaces that fetch
  // server-hosted media. There is no dev proxy in this repo, so the display is
  // always a different origin from the server and a root-relative media URL
  // would 404 against the Vite origin. `null` until the host app has resolved
  // it — resolution reads `window`, so it happens in an effect.
  serverOrigin: string | null;
};

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
  teamNameByTeamId: Record<string, string>;
  activeRoundTeamId: string | null;
  pointsMax: number;
  pendingPointsByTeamId: Record<string, number>;
  rules: SerializableValue | null;
  content: SerializableValue | null;
};

export type CreateDevManifestInput = {
  rules: SerializableValue | null;
  content: SerializableValue | null;
  pointsMax?: number;
};

// Standard two-team sandbox fixture shared by every minigame package; only
// the game-specific rules/content (and optionally pointsMax) vary per game.
export const createDevManifest = ({
  rules,
  content,
  pointsMax = 15
}: CreateDevManifestInput): MinigameDevManifest => {
  return {
    teamIds: ["team-alpha", "team-beta"],
    teamNameByTeamId: {
      "team-alpha": "Team Alpha",
      "team-beta": "Team Beta"
    },
    activeRoundTeamId: "team-alpha",
    pointsMax,
    pendingPointsByTeamId: {
      "team-alpha": 0,
      "team-beta": 0
    },
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
