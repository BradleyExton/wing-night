export type GeoDistanceReadout = {
  value: string;
  unit: string;
};

// The number and its unit are split because they are sized differently on both
// surfaces: "5,904" wants to be the biggest thing on the tile and "km" does
// not. Both surfaces read the same way, so the rule lives here rather than in
// either copy deck.
export const formatGeoDistance = (distanceKm: number): GeoDistanceReadout => {
  if (distanceKm < 1) {
    return { value: `${Math.round(distanceKm * 1000)}`, unit: "m" };
  }

  if (distanceKm < 100) {
    return { value: distanceKm.toFixed(1), unit: "km" };
  }

  // Four digits of kilometres is the usual outcome of a wild guess, and "5904"
  // is genuinely harder to read from across a room than "5,904". The locale is
  // pinned so the TV and the tablet never disagree about the separator.
  return {
    value: Math.round(distanceKm).toLocaleString("en-CA"),
    unit: "km"
  };
};
