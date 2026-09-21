// Scene materials for the zone (DESIGN.md §2.11): a summer morning on Kempenfelt Bay, looking
// east down the water the way the whole city does. Deliberately nothing like JOUST's dusk desert
// or FAPPY's corridor, because SCHLONIC is the one minigame that is supposed to look like a
// 16-bit platformer and the room should know which game it is looking at from the sofa before a
// word is read — and now it should also know which CITY, because everyone on the sofa is from it.
//
// The runner is the player's own cast hen and takes the TEAM's colour, so it is not in here.
// What IS in here is everything standing in its way: the zone is furnished with the cast's
// schlong (§2.8), in three readings the room has to tell apart at a glance and at speed —
//   pink with a FACE      = alive, an enemy, and squashable
//   crimson, stubby, many = a thorn bed, and it hurts however you arrive
//   pink with a PAD       = a springboard, and it is the only one that helps
// Drawing content, not UI chrome — exempt from the two-accent budget the way the drawing inks
// and the JOUST arena are.
export const schlonicPalette = {
  // The shoreline the runner runs: park turf over the bay's sandy bluff.
  turf: "#3fa34d",
  turfLight: "#63c364",
  turfDark: "#1f6b34",
  bluffSand: "#d8bb86",
  soil: "#8a5a2b",
  soilDark: "#5b3a1a",
  soilEdge: "#3a2410",
  // Kempenfelt itself: deep down the middle, shallow and bright at the near shore.
  bayFar: "#2b6ea6",
  bay: "#2f8fc4",
  bayNear: "#63b8de",
  bayGlitter: "#ffffff",
  // The far bank across the water — Oro's treeline, hazed by the distance.
  shoreFar: "#86aab0",
  shoreFarTrees: "#5b8a84",
  // Downtown, across the west end: the waterfront towers, City Hall and a church spire, hazed
  // the same way so the eye reads them as far off rather than as scenery to jump on.
  town: "#93abc6",
  townDark: "#6f89a7",
  townGlass: "#e2f0fb",
  // The Spirit Catcher, in weathered steel. It is a bird, which is the joke the city got to
  // first — the one on the hill is just smaller.
  steel: "#aebccb",
  steelDark: "#5f6e7d",
  // Allandale Station and the marina below it.
  brick: "#a8523d",
  brickDark: "#6f3325",
  roof: "#3d4b58",
  beach: "#f0dcae",
  beachDark: "#cdb17c",
  dock: "#9a6b3c",
  dockDark: "#5f4022",
  sail: "#fdfdfd",
  hull: "#2b3a46",
  park: "#4fb87c",
  cloud: "#f4fbff",
  sun: "#ffe066",
  ring: "#ffc300",
  ringCore: "#fff3bf",
  // The schlong, in JOUST and FAPPY's own bubblegum: the one hue on a green shore that is
  // neither its turf nor its bay, so a row of them reads from the sofa.
  schlong: "#f9a3bc",
  schlongDark: "#8e2a52",
  schlongLight: "#ffe6ee",
  // The thorn bed: the same creature, angrier and lower, and never mistakeable for the pink.
  thorn: "#d81e5b",
  thornDark: "#6d0d2f",
  // The springboard's pad, borrowed straight off a Sonic spring so it means what it means.
  pad: "#e8453c",
  padStripe: "#fff7ed",
  padDark: "#9c1f1a",
  post: "#f4f6fa",
  postPole: "#9aa6b5",
  shadow: "#173a22",
  eye: "#fff7ed",
  pupil: "#1c0d02",
  gloss: "#ffffff"
} as const;
