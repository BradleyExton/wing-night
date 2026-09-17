// Imported by BOTH the express mount and the client's lobby track URL resolver,
// the same reason `TEAM_AUDIO_ROUTE_PATH` is shared: a rename becomes a
// typecheck failure rather than a silent 404 on the TV.
export const LOBBY_AUDIO_ROUTE_PATH = "/lobby-audio";
