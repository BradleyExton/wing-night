import type {
  MinigameDevManifest,
  MinigameDevScenario,
  MinigameSurfacePhase
} from "@wingnight/minigames-core";

import type { SandboxKnobsState } from "../types";

const parseIntegerSearchParam = (
  searchParams: URLSearchParams,
  key: string,
  fallback: number
): number => {
  const rawValue = searchParams.get(key);

  if (rawValue === null) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return parsedValue;
};

export const resolveScenarioById = (
  scenarios: MinigameDevScenario[],
  scenarioId: string
): MinigameDevScenario => {
  return scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
};

export const resolveInitialScenario = (
  devManifest: MinigameDevManifest
): MinigameDevScenario => {
  const searchParams = new URLSearchParams(window.location.search);
  const scenarioId = searchParams.get("scenario") ?? devManifest.defaultScenarioId;

  return resolveScenarioById(devManifest.scenarios, scenarioId);
};

export const resolveInitialKnobsState = (
  initialScenario: MinigameDevScenario
): SandboxKnobsState => {
  const searchParams = new URLSearchParams(window.location.search);
  const triviaHostView =
    initialScenario.minigameHostView?.minigame === "TRIVIA"
      ? initialScenario.minigameHostView
      : null;

  return {
    scenarioId: initialScenario.id,
    phase:
      (searchParams.get("phase") as MinigameSurfacePhase | null) ??
      initialScenario.phase,
    activeTeamName: searchParams.get("team") ?? initialScenario.activeTeamName ?? "",
    promptVisible:
      searchParams.get("prompt") === null
        ? triviaHostView?.currentPrompt !== null
        : searchParams.get("prompt") === "1",
    promptQuestion:
      searchParams.get("question") ?? triviaHostView?.currentPrompt?.question ?? "",
    promptAnswer:
      searchParams.get("answer") ?? triviaHostView?.currentPrompt?.answer ?? "",
    attemptsRemaining: parseIntegerSearchParam(
      searchParams,
      "attempts",
      triviaHostView?.attemptsRemaining ?? 0
    ),
    pendingPointsForActiveTeam: parseIntegerSearchParam(
      searchParams,
      "pending",
      triviaHostView?.pendingPointsByTeamId[triviaHostView.activeTurnTeamId ?? ""] ?? 0
    )
  };
};

export const syncSandboxSearchParams = (knobsState: SandboxKnobsState): void => {
  const nextSearchParams = new URLSearchParams(window.location.search);

  nextSearchParams.set("scenario", knobsState.scenarioId);
  nextSearchParams.set("phase", knobsState.phase);
  nextSearchParams.set("team", knobsState.activeTeamName);
  nextSearchParams.set("prompt", knobsState.promptVisible ? "1" : "0");
  nextSearchParams.set("question", knobsState.promptQuestion);
  nextSearchParams.set("answer", knobsState.promptAnswer);
  nextSearchParams.set("attempts", String(knobsState.attemptsRemaining));
  nextSearchParams.set("pending", String(knobsState.pendingPointsForActiveTeam));

  const nextUrl = `${window.location.pathname}?${nextSearchParams.toString()}`;
  window.history.replaceState(null, "", nextUrl);
};
