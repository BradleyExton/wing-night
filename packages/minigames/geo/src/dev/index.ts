import type {
  MinigameDevManifest,
  MinigameRuntimeActionEnvelope
} from "@wingnight/minigames-core";

const TEAM_NAME_BY_TEAM_ID = {
  "team-alpha": "Team Alpha",
  "team-beta": "Team Beta"
} as const;

const PENDING_POINTS_BY_TEAM_ID = {
  "team-alpha": 4,
  "team-beta": 2
};

// Mirrors content/sample/minigames/geo.json so sandbox play matches a real
// night; images resolve from the client's public sample assets.
const DEV_CONTENT = {
  prompts: [
    {
      id: "geo-eiffel-tower",
      title: "Eiffel Tower",
      imageSrc: "/sample-assets/geo/eiffel-tower.svg",
      hint: "Iron lady of a European capital",
      answer: { lat: 48.85837, lng: 2.294481 }
    },
    {
      id: "geo-statue-of-liberty",
      title: "Statue of Liberty",
      imageSrc: "/sample-assets/geo/statue-of-liberty.svg",
      hint: "A harbor gift from France",
      answer: { lat: 40.689247, lng: -74.044502 }
    },
    {
      id: "geo-sydney-opera-house",
      title: "Sydney Opera House",
      imageSrc: "/sample-assets/geo/sydney-opera-house.svg",
      hint: "Sails by a southern harbour",
      answer: { lat: -33.856784, lng: 151.215297 }
    }
  ]
};

const SAMPLE_GUESS_ACTION: MinigameRuntimeActionEnvelope = {
  actionType: "setGuess",
  actionPayload: { lat: 48.5, lng: 2.6 }
};

const SUBMIT_GUESS_ACTION: MinigameRuntimeActionEnvelope = {
  actionType: "submitGuess",
  actionPayload: {}
};

const NEXT_PROMPT_ACTION: MinigameRuntimeActionEnvelope = {
  actionType: "nextPrompt",
  actionPayload: {}
};

export const geoDevManifest: MinigameDevManifest = {
  defaultScenarioId: "play-guessing",
  live: {
    teamIds: ["team-alpha", "team-beta"],
    teamNameByTeamId: TEAM_NAME_BY_TEAM_ID,
    activeRoundTeamId: "team-alpha",
    pointsMax: 15,
    pendingPointsByTeamId: PENDING_POINTS_BY_TEAM_ID,
    rules: { promptsPerTurn: 3 },
    content: DEV_CONTENT
  },
  scenarios: [
    {
      id: "intro-default",
      label: "Intro",
      phase: "intro"
    },
    {
      id: "play-guessing",
      label: "Play (Guessing)",
      phase: "play"
    },
    {
      id: "play-guess-placed",
      label: "Play (Guess Placed)",
      phase: "play",
      setupActions: [SAMPLE_GUESS_ACTION]
    },
    {
      id: "play-submitted",
      label: "Play (Submitted)",
      phase: "play",
      setupActions: [SAMPLE_GUESS_ACTION, SUBMIT_GUESS_ACTION]
    },
    {
      id: "play-turn-complete",
      label: "Play (Turn Complete)",
      phase: "play",
      setupActions: [
        SAMPLE_GUESS_ACTION,
        SUBMIT_GUESS_ACTION,
        NEXT_PROMPT_ACTION,
        SAMPLE_GUESS_ACTION,
        SUBMIT_GUESS_ACTION,
        NEXT_PROMPT_ACTION,
        SAMPLE_GUESS_ACTION,
        SUBMIT_GUESS_ACTION
      ]
    }
  ]
};
