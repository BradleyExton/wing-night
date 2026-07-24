import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  DisplayRoomStateSnapshot,
  RoleScopedStateSnapshotEnvelope,
  RoomState
} from "@wingnight/shared";

import { HostHandlersProvider } from "../../context/HostHandlersContext";
import type { HostHandlers } from "../../context/HostHandlersContext";
import { RoomStateProvider } from "../../context/RoomStateContext";

type HostProviderOptions = {
  roomState?: RoomState | null;
  handlers?: HostHandlers;
};

type DisplayProviderOptions = {
  roomState?: DisplayRoomStateSnapshot | null;
};

export const buildNoopHostHandlers = (
  overrides: HostHandlers = {}
): HostHandlers => {
  return {
    onNextPhase: (): void => undefined,
    onCreateTeam: (): void => undefined,
    onAddPlayer: (): void => undefined,
    onAssignPlayer: (): void => undefined,
    onAutoAssignRemainingPlayers: (): void => undefined,
    onSetWingParticipation: (): void => undefined,
    onDispatchMinigameAction: (): void => undefined,
    onPauseTimer: (): void => undefined,
    onResumeTimer: (): void => undefined,
    onExtendTimer: (): void => undefined,
    onReorderTurnOrder: (): void => undefined,
    onSkipTurnBoundary: (): void => undefined,
    onAdjustTeamScore: (): void => undefined,
    onResetGame: (): void => undefined,
    onRedoLastMutation: (): void => undefined,
    ...overrides
  };
};

export const withHostProviders = (
  ui: ReactNode,
  { roomState = null, handlers = {} }: HostProviderOptions = {}
): JSX.Element => {
  const envelope: RoleScopedStateSnapshotEnvelope | null =
    roomState === null ? null : { clientRole: "HOST", roomState };

  return (
    <RoomStateProvider value={envelope}>
      <HostHandlersProvider value={handlers}>{ui}</HostHandlersProvider>
    </RoomStateProvider>
  );
};

export const renderHostMarkup = (
  ui: ReactNode,
  options: HostProviderOptions = {}
): string => {
  return renderToStaticMarkup(withHostProviders(ui, options));
};

export const withDisplayProviders = (
  ui: ReactNode,
  { roomState = null }: DisplayProviderOptions = {}
): JSX.Element => {
  const envelope: RoleScopedStateSnapshotEnvelope | null =
    roomState === null ? null : { clientRole: "DISPLAY", roomState };

  return <RoomStateProvider value={envelope}>{ui}</RoomStateProvider>;
};

export const renderDisplayMarkup = (
  ui: ReactNode,
  options: DisplayProviderOptions = {}
): string => {
  return renderToStaticMarkup(withDisplayProviders(ui, options));
};
