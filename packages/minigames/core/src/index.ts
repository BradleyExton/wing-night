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
};

export type MinigameRendererBundle = {
  HostSurface: ComponentType<MinigameHostRendererProps>;
  DisplaySurface: ComponentType<MinigameDisplayRendererProps>;
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

    return {
      prompts: parsedContent.prompts.map(clonePrompt)
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
      prompts: prompts.map(clonePrompt)
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
