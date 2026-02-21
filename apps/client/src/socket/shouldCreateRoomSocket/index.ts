import type { ClientRoute } from "../../utils/resolveClientRoute";

export const shouldCreateRoomSocket = (route: ClientRoute): boolean => {
  return route === "HOST" || route === "DISPLAY";
};
