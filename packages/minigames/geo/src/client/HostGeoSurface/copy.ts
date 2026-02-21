export const hostGeoSurfaceCopy = {
  description: "GEO is not implemented yet. Use this surface to validate shell behavior.",
  statusLabel: "Status",
  statusValue: "Unsupported (stub)",
  activeTeamLabel: (teamName: string): string => `Active Team: ${teamName}`
} as const;
