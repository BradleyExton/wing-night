import type { MinigameDevManifest } from "@wingnight/minigames-core";

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

export const geoDevManifest: MinigameDevManifest = {
  teamIds: ["team-alpha", "team-beta"],
  teamNameByTeamId: {
    "team-alpha": "Team Alpha",
    "team-beta": "Team Beta"
  },
  activeRoundTeamId: "team-alpha",
  pointsMax: 15,
  pendingPointsByTeamId: {
    "team-alpha": 0,
    "team-beta": 0
  },
  rules: { promptsPerTurn: 3 },
  content: DEV_CONTENT
};
