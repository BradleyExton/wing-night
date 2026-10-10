// The team picks as D1 holds them (migrations/0005_team_picks.sql), read the way both sides
// need them: a guest's own pick, the list GET teams answers, the board /admin reads, and the
// switch. The writes live with their routes (src/guestRoutes seats under the cap, src/adminRoutes
// seats over it); this module is the shared reads and the one seating query behind them.
import {
  isTeamPick,
  resolveTeamSeatCap,
  type AdminTeamBoard,
  type PortalTeam,
  type PortalTeamList,
  type PortalTeamMember,
  type TeamPick
} from "@wingnight/shared/guestPortal";

import type { PortalDeps } from "../deps/index.ts";
import type { PortalRoster } from "../roster/index.ts";

export const PICKS_CLOSED_KEY = "picks_closed";

// The kept head's hash, as the admin guest status selects it.
const HEAD_HASH_SUBQUERY =
  "(SELECT a.head_hash FROM avatar_attempts a WHERE a.guest_id = g.guest_id AND a.accepted_at IS NOT NULL)";

type SeatingRow = {
  guest_id: string;
  display_name: string;
  team_name: string | null;
  head_hash: string | null;
};

type PickRow = {
  team_name: string;
  outfits_json: string;
};

// A stored pick read back through the same guard that guards the wire, so a row the schema has
// outgrown reads as no pick rather than a malformed one.
export const parsePickRow = (row: PickRow): TeamPick | null => {
  try {
    const pick: unknown = { teamName: row.team_name, outfitsByGenre: JSON.parse(row.outfits_json) };

    return isTeamPick(pick) ? pick : null;
  } catch {
    return null;
  }
};

export const readTeamPick = async (deps: PortalDeps, guestId: string): Promise<TeamPick | null> => {
  const row = await deps.db
    .prepare("SELECT team_name, outfits_json FROM team_picks WHERE guest_id = ?")
    .bind(guestId)
    .first<PickRow>();

  return row === null ? null : parsePickRow(row);
};

export const readPicksClosed = async (deps: PortalDeps): Promise<boolean> => {
  const row = await deps.db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .bind(PICKS_CLOSED_KEY)
    .first<{ value: string }>();

  return row?.value === "1";
};

export const writePicksClosed = async (deps: PortalDeps, closed: boolean): Promise<void> => {
  await deps.db
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
    .bind(PICKS_CLOSED_KEY, closed ? "1" : "0")
    .run();
};

export const readGuestCount = async (deps: PortalDeps): Promise<number> => {
  const row = await deps.db.prepare("SELECT COUNT(*) AS n FROM guests").first<{ n: number }>();

  return row?.n ?? 0;
};

// Every guest with their pick, if any: one read that is the member lists, the unseated and the
// guest count the cap is computed from. Ordered as every list of guests is.
const readSeatingRows = async (deps: PortalDeps): Promise<SeatingRow[]> => {
  const { results } = await deps.db
    .prepare(
      `SELECT g.guest_id, g.display_name, p.team_name, ${HEAD_HASH_SUBQUERY} AS head_hash
       FROM guests g LEFT JOIN team_picks p ON p.guest_id = g.guest_id
       ORDER BY g.display_name COLLATE NOCASE, g.guest_id`
    )
    .all<SeatingRow>();

  return results;
};

const toMember = (row: SeatingRow): PortalTeamMember => ({
  guestId: row.guest_id,
  displayName: row.display_name,
  headHash: row.head_hash
});

// A member belongs to the roster team whose name their pick matches EXACTLY; a pick naming any
// other team is orphaned (the pack renamed the team) and lands among the unseated.
export const readTeamBoard = async (deps: PortalDeps, roster: PortalRoster): Promise<AdminTeamBoard> => {
  const [rows, picksClosed] = await Promise.all([readSeatingRows(deps), readPicksClosed(deps)]);
  const teams: PortalTeam[] = roster.teams.map((team) => ({
    id: team.id,
    name: team.name,
    ...(team.genre === undefined ? {} : { genre: team.genre }),
    ...(team.color === undefined ? {} : { color: team.color }),
    members: []
  }));
  const teamsByName = new Map(teams.map((team) => [team.name, team]));
  const unseated: PortalTeamMember[] = [];

  for (const row of rows) {
    const team = row.team_name === null ? undefined : teamsByName.get(row.team_name);

    (team === undefined ? unseated : team.members).push(toMember(row));
  }

  return { teams, seatCap: resolveTeamSeatCap(rows.length, roster.teams.length), picksClosed, unseated };
};

export const readTeamList = async (deps: PortalDeps, roster: PortalRoster): Promise<PortalTeamList> => {
  const { teams, seatCap, picksClosed } = await readTeamBoard(deps, roster);

  return { teams, seatCap, picksClosed };
};
