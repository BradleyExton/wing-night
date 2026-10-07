import type { GeoCoordinates, GeoPinResult } from "@wingnight/shared";

import type { GeoScoreBand } from "../types/index.js";

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

// A pin in at the lock: the tablet's (no player) or a playing-team phone's.
export type GeoPinCandidate = GeoCoordinates & {
  playerId: string | null;
  name: string | null;
};

// Measures every pin that was in when the host locked the photo and marks the team's BEST one:
// the most points, then the shorter distance, then the earlier pin in the list (the tablet's first,
// then the phones in roster order) — so a tie never depends on the order answers arrived in.
export const resolveGeoPinResults = (
  candidates: readonly GeoPinCandidate[],
  answer: GeoCoordinates,
  scoreBandsKm: GeoScoreBand[]
): GeoPinResult[] => {
  const measured = candidates.map((candidate) => {
    const distanceKm = haversineDistanceKm(candidate, answer);

    return {
      playerId: candidate.playerId,
      name: candidate.name,
      lat: candidate.lat,
      lng: candidate.lng,
      distanceKm,
      pointsAwarded: resolvePointsForDistance(distanceKm, scoreBandsKm),
      isBest: false
    };
  });
  let bestIndex = -1;

  measured.forEach((pin, index) => {
    const best = measured[bestIndex];

    if (
      best === undefined ||
      pin.pointsAwarded > best.pointsAwarded ||
      (pin.pointsAwarded === best.pointsAwarded && pin.distanceKm < best.distanceKm)
    ) {
      bestIndex = index;
    }
  });

  return measured.map((pin, index) => ({ ...pin, isBest: index === bestIndex }));
};
