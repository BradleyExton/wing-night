export const hostGeoSurfaceCopy = {
  introDescription: "Confirm the active team and hand off for the GEO challenge.",
  playDescription:
    "GEO gameplay module is scaffolded. Use this surface to wire GEO host controls next.",
  activeTeamLabel: (teamName: string): string => `Active Team: ${teamName}`,
  statusLabel: "Status",
  statusValue: "GEO host controls coming next"
} as const;
