import assert from "node:assert/strict";
import test from "node:test";
import type { MinigameDevManifest } from "@wingnight/minigames-core";

import { resolveInitialViewState, resolveScenarioById } from "./index";

const devManifestFixture: MinigameDevManifest = {
  defaultScenarioId: "play-default",
  live: {
    teamIds: ["team-alpha"],
    teamNameByTeamId: {
      "team-alpha": "Team Alpha"
    },
    activeRoundTeamId: "team-alpha",
    pointsMax: 15,
    pendingPointsByTeamId: {
      "team-alpha": 0
    },
    rules: null,
    content: null
  },
  scenarios: [
    {
      id: "intro-default",
      label: "Intro",
      phase: "intro"
    },
    {
      id: "play-default",
      label: "Play",
      phase: "play"
    }
  ]
};

const withWindowSearch = (search: string, callback: () => void): void => {
  const globalScope = globalThis as unknown as { window?: unknown };
  const originalWindow = globalScope.window;

  globalScope.window = {
    location: {
      search,
      pathname: "/dev/minigame/trivia"
    },
    history: {
      replaceState: (): void => {
        return;
      }
    }
  } as unknown as Window;

  try {
    callback();
  } finally {
    if (originalWindow === undefined) {
      delete globalScope.window;
    } else {
      globalScope.window = originalWindow;
    }
  }
};

test("resolveInitialViewState uses the manifest default scenario without query params", () => {
  withWindowSearch("", () => {
    const viewState = resolveInitialViewState(devManifestFixture);
    assert.equal(viewState.scenarioId, "play-default");
    assert.equal(viewState.phase, "play");
  });
});

test("resolveInitialViewState honors scenario and phase query params", () => {
  withWindowSearch("?scenario=intro-default&phase=play", () => {
    const viewState = resolveInitialViewState(devManifestFixture);
    assert.equal(viewState.scenarioId, "intro-default");
    assert.equal(viewState.phase, "play");
  });
});

test("resolveInitialViewState falls back to scenario phase for invalid phase query params", () => {
  withWindowSearch("?scenario=intro-default&phase=unsupported", () => {
    const viewState = resolveInitialViewState(devManifestFixture);
    assert.equal(viewState.phase, "intro");
  });
});

test("resolveInitialViewState falls back to the first scenario for unknown scenario ids", () => {
  withWindowSearch("?scenario=missing", () => {
    const viewState = resolveInitialViewState(devManifestFixture);
    assert.equal(viewState.scenarioId, "intro-default");
  });
});

test("resolveInitialViewState stays SSR-safe without a window global", () => {
  const viewState = resolveInitialViewState(devManifestFixture);
  assert.equal(viewState.scenarioId, "play-default");
  assert.equal(viewState.phase, "play");
});

test("resolveScenarioById returns the first scenario for unknown ids", () => {
  const scenario = resolveScenarioById(devManifestFixture.scenarios, "missing");
  assert.equal(scenario.id, "intro-default");
});
