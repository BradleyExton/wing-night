import type { MinigameDevManifest } from "@wingnight/minigames-core";
import type {
  GeoMinigameDisplayPrompt,
  GeoMinigameHostPrompt
} from "@wingnight/shared";

const TEAM_NAME_BY_TEAM_ID = {
  "team-alpha": "Team Alpha",
  "team-beta": "Team Beta"
} as const;

const PENDING_POINTS_BY_TEAM_ID = {
  "team-alpha": 4,
  "team-beta": 2
};

const HOST_PROMPT: GeoMinigameHostPrompt = {
  id: "geo-eiffel-tower",
  title: "Eiffel Tower",
  imageSrc: "/sample-assets/geo/eiffel-tower.svg",
  hint: "Iron lady of a European capital",
  answerLat: 48.85837,
  answerLng: 2.294481
};

const DISPLAY_PROMPT: GeoMinigameDisplayPrompt = {
  id: HOST_PROMPT.id,
  title: HOST_PROMPT.title,
  imageSrc: HOST_PROMPT.imageSrc,
  hint: HOST_PROMPT.hint
};

const SAMPLE_GUESS = { lat: 48.5, lng: 2.6 };

const SAMPLE_RESULT = {
  promptId: HOST_PROMPT.id,
  guessLat: SAMPLE_GUESS.lat,
  guessLng: SAMPLE_GUESS.lng,
  distanceKm: 45.7,
  pointsAwarded: 1
};

export const geoDevManifest: MinigameDevManifest = {
  defaultScenarioId: "play-guessing",
  scenarios: [
    {
      id: "intro-default",
      label: "Intro",
      phase: "intro",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: TEAM_NAME_BY_TEAM_ID,
      minigameHostView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { ...PENDING_POINTS_BY_TEAM_ID },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 0,
        currentSubState: "guessing",
        currentGuess: null,
        currentPrompt: HOST_PROMPT,
        lastResult: null
      },
      minigameDisplayView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { ...PENDING_POINTS_BY_TEAM_ID },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 0,
        currentPrompt: DISPLAY_PROMPT,
        status: "guessing"
      }
    },
    {
      id: "play-guessing",
      label: "Play (Guessing)",
      phase: "play",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: TEAM_NAME_BY_TEAM_ID,
      minigameHostView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { ...PENDING_POINTS_BY_TEAM_ID },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 0,
        currentSubState: "guessing",
        currentGuess: null,
        currentPrompt: HOST_PROMPT,
        lastResult: null
      },
      minigameDisplayView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { ...PENDING_POINTS_BY_TEAM_ID },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 0,
        currentPrompt: DISPLAY_PROMPT,
        status: "guessing"
      }
    },
    {
      id: "play-guess-placed",
      label: "Play (Guess Placed)",
      phase: "play",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: TEAM_NAME_BY_TEAM_ID,
      minigameHostView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { ...PENDING_POINTS_BY_TEAM_ID },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 1,
        currentSubState: "guessing",
        currentGuess: { ...SAMPLE_GUESS },
        currentPrompt: HOST_PROMPT,
        lastResult: null
      },
      minigameDisplayView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { ...PENDING_POINTS_BY_TEAM_ID },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 1,
        currentPrompt: DISPLAY_PROMPT,
        status: "guessing"
      }
    },
    {
      id: "play-submitted",
      label: "Play (Submitted)",
      phase: "play",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: TEAM_NAME_BY_TEAM_ID,
      minigameHostView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { "team-alpha": 5, "team-beta": 2 },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 1,
        currentSubState: "submitted",
        currentGuess: { ...SAMPLE_GUESS },
        currentPrompt: HOST_PROMPT,
        lastResult: { ...SAMPLE_RESULT }
      },
      minigameDisplayView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { "team-alpha": 5, "team-beta": 2 },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 1,
        currentPrompt: DISPLAY_PROMPT,
        status: "submitted",
        result: {
          guessLat: SAMPLE_RESULT.guessLat,
          guessLng: SAMPLE_RESULT.guessLng,
          answerLat: HOST_PROMPT.answerLat,
          answerLng: HOST_PROMPT.answerLng,
          distanceKm: SAMPLE_RESULT.distanceKm,
          pointsAwarded: SAMPLE_RESULT.pointsAwarded
        }
      }
    },
    {
      id: "play-turn-complete",
      label: "Play (Turn Complete)",
      phase: "play",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: TEAM_NAME_BY_TEAM_ID,
      minigameHostView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { "team-alpha": 8, "team-beta": 2 },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 3,
        currentSubState: "submitted",
        currentGuess: { ...SAMPLE_GUESS },
        currentPrompt: HOST_PROMPT,
        lastResult: { ...SAMPLE_RESULT }
      },
      minigameDisplayView: {
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: { "team-alpha": 8, "team-beta": 2 },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 3,
        currentPrompt: DISPLAY_PROMPT,
        status: "submitted",
        result: {
          guessLat: SAMPLE_RESULT.guessLat,
          guessLng: SAMPLE_RESULT.guessLng,
          answerLat: HOST_PROMPT.answerLat,
          answerLng: HOST_PROMPT.answerLng,
          distanceKm: SAMPLE_RESULT.distanceKm,
          pointsAwarded: SAMPLE_RESULT.pointsAwarded
        }
      }
    }
  ]
};
