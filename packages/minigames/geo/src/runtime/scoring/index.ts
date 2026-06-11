import type { GeoCoordinates, GeoScoreBand } from "@wingnight/shared";

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

export const haversineDistanceKm = (
  from: GeoCoordinates,
  to: GeoCoordinates
): number => {
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const halfChordSquared =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(deltaLng / 2) ** 2;

  const angularDistance =
    2 * Math.atan2(Math.sqrt(halfChordSquared), Math.sqrt(1 - halfChordSquared));

  return EARTH_RADIUS_KM * angularDistance;
};

export const resolvePointsForDistance = (
  distanceKm: number,
  scoreBandsKm: GeoScoreBand[]
): number => {
  for (const band of scoreBandsKm) {
    if (distanceKm <= band.maxKm) {
      return band.points;
    }
  }

  return 0;
};
