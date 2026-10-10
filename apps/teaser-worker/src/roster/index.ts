// The night's teams, as the Worker knows them: `teaser-roster.json`, the file the teaser build
// writes from the pack's teams.json (tools/build-teaser/planTeaserRoster.ts) and ships beside the
// pages. The Worker reads it back through its ASSETS binding, so there is no second team list in
// D1 and no team editor on /admin (docs/guest-portal-team-pick-plan.md, decision 1).
//
// Parsed here with a guard of the Worker's own rather than the client's parseTeaserRoster: the
// Worker cannot import apps/client, and that parser drops a team nobody is seated on, which is
// exactly what a brand-new team looks like before anyone has picked it.
import { isRecord, isTeamColorToken, type TeamColorToken } from "@wingnight/shared";

import type { PortalDeps } from "../deps/index.ts";

export const ROSTER_PATH = "/teaser-roster.json";

// A team in file order, which is seating order (the colour collision pass walks it). `color` is
// kept only when it is a TeamColorToken, like the party's own content loader.
export type RosterTeam = {
  id: string;
  name: string;
  genre?: string;
  color?: TeamColorToken;
};

export type PortalRoster = {
  teams: RosterTeam[];
};

const parseRosterTeam = (value: unknown): RosterTeam | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    typeof value.name !== "string" ||
    value.name.length === 0 ||
    (value.genre !== undefined && typeof value.genre !== "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    ...(value.genre === undefined ? {} : { genre: value.genre }),
    ...(isTeamColorToken(value.color) ? { color: value.color } : {})
  };
};

// The parsed roster, or null when the file is not one. Only the teams are read; the players
// ride along for the landing page and are nothing to the portal.
export const parseRoster = (value: unknown): PortalRoster | null => {
  if (!isRecord(value) || !Array.isArray(value.teams)) {
    return null;
  }

  const teams: RosterTeam[] = [];

  for (const entry of value.teams) {
    const team = parseRosterTeam(entry);

    if (team === null) {
      return null;
    }

    teams.push(team);
  }

  return { teams };
};

type RosterDeps = Pick<PortalDeps, "assets" | "logError">;

// One parse per isolate: a deploy makes a new isolate, and the roster only changes with a
// deploy. Keyed on the binding so each test portal, with a binding of its own, reads its own
// roster. A failed read is not kept — it is logged every time, because a missing roster is a
// deploy bug and nothing that reads it should go quiet.
const rostersByAssets = new WeakMap<PortalDeps["assets"], Promise<PortalRoster | null>>();

const fetchRoster = async (deps: RosterDeps, origin: string): Promise<PortalRoster | null> => {
  const response = await deps.assets.fetch(new Request(new URL(ROSTER_PATH, origin)));

  if (!response.ok) {
    deps.logError(`roster: ${ROSTER_PATH} is missing from the assets (${response.status}) — the teaser build did not ship one`);

    return null;
  }

  // A missing file can also come back as the site's own page, 200, under the single-page
  // fallback (wrangler.jsonc); it fails to parse like anything else that is not the roster.
  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch {
    deps.logError(`roster: ${ROSTER_PATH} is not JSON — the assets answered something else for it`);

    return null;
  }

  const roster = parseRoster(parsed);

  if (roster === null) {
    deps.logError(`roster: ${ROSTER_PATH} is not a roster — tools/build-teaser writes { players, teams }`);
  }

  return roster;
};

// The roster, or null (already logged) when the deploy shipped none: the routes that need it
// answer server_error, never an empty team list that would read as "no teams tonight".
export const readRoster = async (deps: RosterDeps, origin: string): Promise<PortalRoster | null> => {
  const cached = rostersByAssets.get(deps.assets);

  if (cached !== undefined) {
    return cached;
  }

  const reading = fetchRoster(deps, origin).then(
    (roster) => {
      if (roster === null) {
        rostersByAssets.delete(deps.assets);
      }

      return roster;
    },
    (error: unknown) => {
      rostersByAssets.delete(deps.assets);
      throw error;
    }
  );

  rostersByAssets.set(deps.assets, reading);

  return reading;
};

export const findRosterTeam = (roster: PortalRoster, teamName: string): RosterTeam | undefined => {
  return roster.teams.find((team) => team.name === teamName);
};
