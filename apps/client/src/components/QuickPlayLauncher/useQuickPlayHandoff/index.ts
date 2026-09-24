import { Phase, SESSION_MODES, type RoomState } from "@wingnight/shared";
import { useEffect } from "react";

// Once the server has opened the session the launcher's job is done: the
// host shell renders the briefing, the takeover and everything after, so the
// tablet goes there. A hard navigation rather than a route swap because the
// socket's client role is resolved from the path at connect time.
export const useQuickPlayHandoff = (
  roomState: RoomState | null,
  hostHref: string,
  navigate: (href: string) => void = (href): void => {
    window.location.assign(href);
  }
): boolean => {
  const isQuickPlayRunning =
    roomState !== null &&
    roomState.sessionMode === SESSION_MODES.QUICK_PLAY &&
    roomState.phase !== Phase.SETUP;

  useEffect(() => {
    if (isQuickPlayRunning) {
      navigate(hostHref);
    }
  }, [hostHref, isQuickPlayRunning, navigate]);

  return isQuickPlayRunning;
};
