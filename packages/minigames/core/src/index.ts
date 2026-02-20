import type {
  MinigameApiVersion,
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

type MinigameBaseInput<TContext extends SerializableValue> = {
  teamIds: string[];
  pointsMax: number;
  context: TContext;
};

export type MinigameInitInput<TContext extends SerializableValue> =
  MinigameBaseInput<TContext>;

export type MinigameReduceInput<
  TState extends SerializableValue,
  TAction,
  TContext extends SerializableValue
> = MinigameBaseInput<TContext> & {
  state: TState;
  action: TAction;
};

export type MinigameSelectorInput<
  TState extends SerializableValue,
  TContext extends SerializableValue
> = {
  state: TState;
  context: TContext;
};

export type MinigameModule<
  TState extends SerializableValue,
  TAction,
  THostView extends SerializableValue,
  TDisplayView extends SerializableValue,
  TContext extends SerializableValue = SerializableRecord
> = {
  id: MinigameType;
  metadata?: MinigamePluginMetadata;
  init: (input: MinigameInitInput<TContext>) => TState;
  reduce: (input: MinigameReduceInput<TState, TAction, TContext>) => TState;
  selectHostView: (
    input: MinigameSelectorInput<TState, TContext>
  ) => THostView;
  selectDisplayView: (
    input: MinigameSelectorInput<TState, TContext>
  ) => TDisplayView;
};

export type MinigamePluginMetadata = {
  minigameApiVersion: MinigameApiVersion;
  capabilities: {
    supportsHostRenderer: boolean;
    supportsDisplayRenderer: boolean;
    supportsDevScenarios: boolean;
  };
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

export type MinigameDevScenario = {
  id: string;
  label: string;
  phase: MinigameSurfacePhase;
  activeTeamName: string | null;
  teamNameByTeamId: Record<string, string>;
  minigameHostView: MinigameHostView | null;
  minigameDisplayView: MinigameDisplayView | null;
};

export type MinigameDevManifest = {
  defaultScenarioId: string;
  scenarios: MinigameDevScenario[];
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
