import { type RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { DisplayPlaceholder } from "./components/DisplayPlaceholder";
import { HostPlaceholder } from "./components/HostPlaceholder";
import { RouteNotFound } from "./components/RouteNotFound";
import { roomSocket } from "./socket/createRoomSocket";
import { resolveClientRoute } from "./utils/resolveClientRoute";
import { wireRoomStateRehydration } from "./utils/wireRoomStateRehydration";

export const App = (): JSX.Element => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const route = resolveClientRoute(window.location.pathname);

  useEffect(() => {
    return wireRoomStateRehydration(roomSocket, setRoomState);
  }, []);

  useEffect(() => {
    if (route === "DISPLAY" && roomState) {
      console.warn("Display received state snapshot", roomState);
    }
  }, [roomState, route]);

  if (route === "HOST") {
    return <HostPlaceholder />;
  }

  if (route === "DISPLAY") {
    return <DisplayPlaceholder />;
  }

  return <RouteNotFound />;
};
