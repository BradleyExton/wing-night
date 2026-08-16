export type Team = {
  id: string;
  name: string;
  playerIds: string[];
  totalScore: number;
  genre?: string;
  anthems?: string[];
};

// Imported by BOTH the express mount and the client's anthem URL resolver, so
// the two cannot drift on the route string — a rename becomes a typecheck
// failure rather than a silent 404.
export const TEAM_AUDIO_ROUTE_PATH = "/team-audio";
