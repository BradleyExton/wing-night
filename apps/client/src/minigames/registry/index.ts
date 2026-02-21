import type {
  DisplayRoomStateSnapshot,
  MinigameHostView,
  MinigameType
} from "@wingnight/shared";

import { DisplayTakeoverRenderer as TriviaDisplayTakeoverRenderer } from "../trivia/DisplayTakeoverRenderer";
import { HostTakeoverRenderer as TriviaHostTakeoverRenderer } from "../trivia/HostTakeoverRenderer";
import { DisplayUnsupportedRenderer } from "../unsupported/DisplayUnsupportedRenderer";
import { HostUnsupportedRenderer } from "../unsupported/HostUnsupportedRenderer";

export type HostTakeoverRendererProps = {
  hostMode: "minigame_intro" | "minigame_play";
  minigameId: MinigameType;
  minigameHostView: MinigameHostView | null;
  activeRoundTeamName: string;
  teamNameByTeamId: Map<string, string>;
  triviaAttemptDisabled: boolean;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
};

export type DisplayTakeoverRendererProps = {
  roomState: DisplayRoomStateSnapshot | null;
  phaseLabel: string;
  isMinigamePlayPhase: boolean;
  minigameId: MinigameType;
  activeTeamName: string | null;
};

type HostTakeoverRenderer = (props: HostTakeoverRendererProps) => JSX.Element;

type DisplayTakeoverRenderer = (
  props: DisplayTakeoverRendererProps
) => JSX.Element;

export type ClientMinigameRendererDescriptor = {
  minigameId: MinigameType;
  hostTakeoverRenderer: HostTakeoverRenderer;
  displayTakeoverRenderer: DisplayTakeoverRenderer;
  supportsGameplayRenderer: boolean;
};

const unsupportedDescriptor = (
  minigameId: MinigameType
): ClientMinigameRendererDescriptor => {
  return {
    minigameId,
    hostTakeoverRenderer: HostUnsupportedRenderer,
    displayTakeoverRenderer: DisplayUnsupportedRenderer,
    supportsGameplayRenderer: false
  };
};

export const CLIENT_MINIGAME_RENDERER_REGISTRY = {
  TRIVIA: {
    minigameId: "TRIVIA",
    hostTakeoverRenderer: TriviaHostTakeoverRenderer,
    displayTakeoverRenderer: TriviaDisplayTakeoverRenderer,
    supportsGameplayRenderer: true
  },
  GEO: unsupportedDescriptor("GEO"),
  DRAWING: unsupportedDescriptor("DRAWING")
} satisfies Record<MinigameType, ClientMinigameRendererDescriptor>;

export const resolveClientMinigameRendererDescriptor = (
  minigameId: MinigameType
): ClientMinigameRendererDescriptor => {
  return CLIENT_MINIGAME_RENDERER_REGISTRY[minigameId];
};
