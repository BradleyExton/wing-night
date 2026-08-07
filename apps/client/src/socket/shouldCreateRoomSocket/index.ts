import type { ClientRoute } from "../../utils/resolveClientRoute";

// ADMIN needs a socket for the same reason HOST does: the config wizard's whole
// job is a `config:*` round trip, and those events are host-authorized.
export const shouldCreateRoomSocket = (route: ClientRoute): boolean => {
  return route === "HOST" || route === "ADMIN" || route === "DISPLAY";
};
