import type { ClientRoute } from "../../utils/resolveClientRoute";

// ADMIN and QUICKPLAY need a socket for the same reason HOST does: the config
// wizard's whole job is a `config:*` round trip, the launcher's is one
// `quickplay:start`, and both are host-authorized.
export const shouldCreateRoomSocket = (route: ClientRoute): boolean => {
  return (
    route === "HOST" || route === "ADMIN" || route === "QUICKPLAY" || route === "DISPLAY"
  );
};
