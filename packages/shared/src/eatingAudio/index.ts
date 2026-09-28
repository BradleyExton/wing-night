// Imported by BOTH the express mount and the client's track URL resolver, the
// same reason `LOBBY_AUDIO_ROUTE_PATH` is shared: a rename becomes a typecheck
// failure rather than a silent 404 on the TV.
export const EATING_AUDIO_ROUTE_PATH = "/eating-audio";
