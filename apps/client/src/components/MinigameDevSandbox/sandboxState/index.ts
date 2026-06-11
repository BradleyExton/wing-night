import type {
  MinigameDevManifest,
  MinigameDevScenario,
  MinigameSurfacePhase
} from "@wingnight/minigames-core";

import type { SandboxViewState } from "../types";

const resolvePhaseSearchParam = (
  searchParams: URLSearchParams,
  fallback: MinigameSurfacePhase
): MinigameSurfacePhase => {
  const phaseSearchParam = searchParams.get("phase");

  if (phaseSearchParam === "intro" || phaseSearchParam === "play") {
    return phaseSearchParam;
  }

  return fallback;
};

export const resolveScenarioById = (
  scenarios: MinigameDevScenario[],
  scenarioId: string
): MinigameDevScenario => {
  return scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
};

export const resolveInitialViewState = (
  devManifest: MinigameDevManifest
): SandboxViewState => {
  const search = typeof window === "undefined" ? "" : window.location.search;
  const searchParams = new URLSearchParams(search);
  const initialScenario = resolveScenarioById(
    devManifest.scenarios,
    searchParams.get("scenario") ?? devManifest.defaultScenarioId
  );

  return {
    scenarioId: initialScenario.id,
    phase: resolvePhaseSearchParam(searchParams, initialScenario.phase)
  };
};

export const syncSandboxSearchParams = (viewState: SandboxViewState): void => {
  if (typeof window === "undefined") {
    return;
  }

  const nextSearchParams = new URLSearchParams(window.location.search);

  nextSearchParams.set("scenario", viewState.scenarioId);
  nextSearchParams.set("phase", viewState.phase);

  const nextUrl = `${window.location.pathname}?${nextSearchParams.toString()}`;
  window.history.replaceState(null, "", nextUrl);
};
