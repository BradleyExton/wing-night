import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type {
  DisplayRoomStateSnapshot,
  RoleScopedStateSnapshotEnvelope,
  RoomState
} from "@wingnight/shared";

const RoomStateContext = createContext<RoleScopedStateSnapshotEnvelope | null>(null);

type RoomStateProviderProps = {
  value: RoleScopedStateSnapshotEnvelope | null;
  children: ReactNode;
};

export const RoomStateProvider = ({
  value,
  children
}: RoomStateProviderProps): JSX.Element => {
  return <RoomStateContext.Provider value={value}>{children}</RoomStateContext.Provider>;
};

export const useRoomStateEnvelope = (): RoleScopedStateSnapshotEnvelope | null => {
  return useContext(RoomStateContext);
};

export const useHostRoomState = (): RoomState | null => {
  const envelope = useRoomStateEnvelope();

  return envelope?.clientRole === "HOST" ? envelope.roomState : null;
};

export const useDisplayRoomState = (): DisplayRoomStateSnapshot | null => {
  const envelope = useRoomStateEnvelope();

  return envelope?.clientRole === "DISPLAY" ? envelope.roomState : null;
};
