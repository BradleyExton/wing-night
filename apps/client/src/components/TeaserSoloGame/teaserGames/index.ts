import type { ComponentType } from "react";
import type {
  MinigameHostRendererProps,
  MinigameRuntimePlugin,
  SerializableValue
} from "@wingnight/minigames-core";
import { fappyRuntimePlugin } from "@wingnight/minigames-fappy";
import { fappyRendererBundle, formatRelayClock } from "@wingnight/minigames-fappy/client";
import { joustRuntimePlugin } from "@wingnight/minigames-joust";
import { joustRendererBundle } from "@wingnight/minigames-joust/client";
import { joustDevManifest } from "@wingnight/minigames-joust/dev";
import { schlonicRuntimePlugin } from "@wingnight/minigames-schlonic";
import { schlonicRendererBundle } from "@wingnight/minigames-schlonic/client";
import type { MinigameHostView, MinigameType } from "@wingnight/shared";

import { teaserGamesCopy } from "./copy";

// How a finished turn reads on the teaser's end card, and the number the phone keeps a best of:
// null while the turn is still being played.
export type TeaserTurnOutcome = {
  kicker: string;
  headline: string;
  // The turn's score, or null when it ended without one (a relay that ran out of time).
  result: number | null;
};

// One game the teaser lets a phone play alone. The pure runtime and the tablet's own surface are
// the party's, untouched; everything here is what the party gets from the room instead — the
// rules the pack would load, and a host who would read the result out.
export type TeaserGame = {
  // The page's path and the key its best is kept under on the phone.
  slug: string;
  minigameType: MinigameType;
  runtimePlugin: MinigameRuntimePlugin;
  HostSurface: ComponentType<MinigameHostRendererProps>;
  // The night's own rules for the game (content/sample/gameConfig.json and the pack agree unless
  // noted), copied because the site has no content loader.
  rules: SerializableValue;
  // The game's content file (arenas, prompts), for a game that has one; null for one seeded
  // from its rules.
  content: SerializableValue | null;
  title: string;
  pickerBody: string;
  resolveOutcome: (view: MinigameHostView) => TeaserTurnOutcome | null;
  // Whether a result beats the phone's best: more wings or points, or a faster relay.
  beats: (result: number, best: number) => boolean;
  formatResult: (result: number) => string;
};

// The round's points cap (gameConfig.json `minigameScoring.defaultMax`).
export const TEASER_POINTS_MAX = 15;

export const dunlopDashGame: TeaserGame = {
  slug: "dunlop-dash",
  minigameType: "SCHLONIC",
  runtimePlugin: schlonicRuntimePlugin,
  HostSurface: schlonicRendererBundle.HostSurface,
  rules: { runsPerTurn: 3, zoneSeed: 20260919, zoneChunks: 22, parWingsPerRun: 120 },
  content: null,
  title: teaserGamesCopy.dunlopDashTitle,
  pickerBody: teaserGamesCopy.dunlopDashPickerBody,
  resolveOutcome: (view) =>
    view.minigame === "SCHLONIC" && view.phase === "finished"
      ? {
          kicker: teaserGamesCopy.dunlopDashFinishKicker,
          headline: teaserGamesCopy.wings(view.wingsBanked),
          result: view.wingsBanked
        }
      : null,
  beats: (result, best) => result > best,
  formatResult: teaserGamesCopy.wings
};

export const fappyBirdGame: TeaserGame = {
  slug: "fappy-bird",
  minigameType: "FAPPY",
  runtimePlugin: fappyRuntimePlugin,
  HostSurface: fappyRendererBundle.HostSurface,
  // The pack's relay: a leg for each of a team's five.
  rules: { legsPerTurn: 5, gatesPerLeg: 6, parSeconds: 60, limitSeconds: 110 },
  content: null,
  title: teaserGamesCopy.fappyBirdTitle,
  pickerBody: teaserGamesCopy.fappyBirdPickerBody,
  resolveOutcome: (view) => {
    if (view.minigame !== "FAPPY") {
      return null;
    }

    if (view.phase === "timedOut") {
      return { kicker: teaserGamesCopy.fappyTimedOutKicker, headline: teaserGamesCopy.fappyTimedOut, result: null };
    }

    return view.phase === "finished" && view.elapsedMs !== null
      ? {
          kicker: teaserGamesCopy.fappyFinishKicker,
          headline: formatRelayClock(view.elapsedMs),
          result: view.elapsedMs
        }
      : null;
  },
  beats: (result, best) => result < best,
  formatResult: formatRelayClock
};

export const slingshlongGame: TeaserGame = {
  slug: "slingshlong",
  minigameType: "JOUST",
  runtimePlugin: joustRuntimePlugin,
  HostSurface: joustRendererBundle.HostSurface,
  rules: { shotsPerPlayer: 1 },
  // The pack carries no joust.json, so the night is the sample's lanes and loadout — which the
  // package's dev fixture copies shelf for shelf, guarded by its own test against the file.
  content: joustDevManifest.content,
  title: teaserGamesCopy.slingshlongTitle,
  pickerBody: teaserGamesCopy.slingshlongPickerBody,
  resolveOutcome: (view) => {
    if (view.minigame !== "JOUST" || view.phase !== "done") {
      return null;
    }

    const points = view.shots.reduce((total, shot) => total + shot.points, 0);

    return {
      kicker: view.shots.some((shot) => shot.isRackCleared)
        ? teaserGamesCopy.slingshlongClearedKicker
        : teaserGamesCopy.slingshlongFinishKicker,
      headline: teaserGamesCopy.points(points),
      result: points
    };
  },
  beats: (result, best) => result > best,
  formatResult: teaserGamesCopy.points
};

export const TEASER_GAMES: readonly TeaserGame[] = [dunlopDashGame, fappyBirdGame, slingshlongGame];

export const resolveTeaserGame = (path: string): TeaserGame | null =>
  TEASER_GAMES.find((game) => `/${game.slug}` === path) ?? null;
