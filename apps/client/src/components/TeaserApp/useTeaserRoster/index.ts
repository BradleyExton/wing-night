import { useEffect, useState } from "react";
import { schlonicDevManifest } from "@wingnight/minigames-schlonic/dev";

import {
  parseTeaserRoster,
  TEASER_ROSTER_PATH,
  type TeaserRoster
} from "../../../utils/parseTeaserRoster";

// A site built without the night pack — or one whose roster file is missing — still has
// somebody to put on the street: the minigame's own fixture roster.
const FALLBACK_ROSTER: TeaserRoster = {
  players: schlonicDevManifest.players,
  teams: schlonicDevManifest.teams
};

export type TeaserRosterState = {
  roster: TeaserRoster;
  isLoaded: boolean;
};

export const useTeaserRoster = (): TeaserRosterState => {
  const [state, setState] = useState<TeaserRosterState>({
    roster: FALLBACK_ROSTER,
    isLoaded: false
  });

  useEffect(() => {
    let cancelled = false;

    fetch(TEASER_ROSTER_PATH)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((file: unknown) => {
        if (!cancelled) {
          setState({ roster: parseTeaserRoster(file) ?? FALLBACK_ROSTER, isLoaded: true });
        }
      });

    return (): void => {
      cancelled = true;
    };
  }, []);

  return state;
};
