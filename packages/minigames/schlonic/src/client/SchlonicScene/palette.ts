// Scene materials for the zone (DESIGN.md §2.11): a summer morning on Dunlop Street, downtown
// Barrie, with the bay showing at the bottom of every cross street the way it does from the real
// one. Deliberately nothing like JOUST's dusk beach or FAPPY's corridor, because SCHLONIC is the
// one minigame that is supposed to look like a 16-bit platformer and the room should know which
// game it is looking at from the sofa before a word is read — and which STREET, because everyone
// on the sofa has walked it.
//
// The runner is the player's own cast hen and takes the TEAM's colour, so it is not in here.
// What IS in here is everything standing in its way: the zone is furnished with the cast's
// schlong (§2.8), in three readings the room has to tell apart at a glance and at speed —
//   pink with a FACE      = alive, an enemy, and squashable
//   crimson, stubby, many = a thorn bed, and it hurts however you arrive
//   pink with a PAD       = a springboard, and it is the only one that helps
// The collectible is deliberately none of those: an orange wing on a pale bone, the one shape in
// the zone that is not a schlong, because "grab this" and "avoid that" have to separate in the
// half-second an arc goes past.
// Drawing content, not UI chrome — exempt from the two-accent budget the way the drawing inks
// and the JOUST arena are.
export const schlonicPalette = {
  // The sidewalk the runner skates: poured concrete in slabs, a pale lip where the curb catches
  // the sun, and a darker line where each slab meets the next.
  concrete: "#cdc8bd",
  concreteLight: "#efebe2",
  concreteJoint: "#9c968a",
  curbShadow: "#6b655b",
  // Green Hill's checkerboard, laid as Dunlop's own red-brick pavers: two fired reds in mortar.
  // The checker is what makes the ground read 16-bit before anything moves; the brick is what
  // makes it read as downtown.
  paver: "#b9523b",
  paverDark: "#8e3a2a",
  mortar: "#5c2518",
  // What the pavers are laid on, down to the bottom of the box.
  subgrade: "#5a3126",
  // The dark under a trench: nothing down there, and it has to look it.
  pitShaft: "#22130a",
  // The Dunlop Street dig: an orange-and-white barrel either side of every trench, and the
  // sawhorse that closes the near one. Barrel orange is a road-works orange, redder and deeper
  // than a wing's sauce, and the white stripes are what say "barrel" rather than "another wing".
  barrel: "#e8581c",
  barrelDark: "#8f2f08",
  barrelStripe: "#fbf8f1",
  barrelLamp: "#ffd23f",
  // The street itself, behind the near sidewalk: asphalt and its yellow centre line, then the
  // far sidewalk the storefronts stand on, hazed like everything past the kerb.
  asphalt: "#5b6068",
  asphaltLight: "#737a83",
  laneLine: "#f2c94c",
  farSidewalk: "#c9ccc6",
  // The bay at the bottom of the hill: deep at the horizon, bright where it meets the town.
  bayFar: "#2b6ea6",
  bay: "#2f8fc4",
  bayNear: "#63b8de",
  bayGlitter: "#ffffff",
  // The far bank across the water — Oro's treeline, hazed by the distance.
  shoreFar: "#86aab0",
  shoreFarTrees: "#5b8a84",
  // Downtown's own slope down to the water, behind the fronts: the waterfront park, hazed.
  hillside: "#a8c8b2",
  // Downtown's slabs, City Hall and the spire, hazed so the eye reads them as far off rather
  // than as scenery to jump on.
  town: "#93abc6",
  townDark: "#6f89a7",
  townGlass: "#e2f0fb",
  // The twin condos at the foot of Bayfield: the one cream thing on the skyline, with the blue
  // glass balconies the room knows them by.
  condo: "#f0dcae",
  condoDark: "#cdb17c",
  condoGlass: "#2b6ea6",
  condoRoof: "#3d4b58",
  // Dunlop Street's fronts across the road, in the morning haze: red and buff brick, white sills,
  // dark glass and awnings, every one of them mixed toward the sky so the kit in front wins.
  streetBrick: "#b88c83",
  streetBrickDark: "#957975",
  streetBuff: "#d4cbaf",
  streetBuffDark: "#c1b79c",
  streetTrim: "#e5eef4",
  streetPane: "#6d7e88",
  streetAwning: "#b06d6e",
  streetCornice: "#659b7e",
  // Crossover's pole sign, hazed only half as much: the parody is the joke, so it has to read.
  crossoverRed: "#e25e57",
  crossoverYellow: "#f6e07c",
  crossoverInk: "#3a3230",
  crossoverBoard: "#eef2f5",
  // The two set pieces at the ends of the zone, near and at full strength: Souldiers' brick and
  // its green graffiti wordmark, and the Queen's buff brick under its dark green roof.
  brick: "#a8523d",
  brickDark: "#6f3325",
  trim: "#f4f6fa",
  pane: "#2b3a46",
  signGreen: "#3fa34d",
  signGreenLight: "#63c364",
  signInk: "#1c0d02",
  signLetter: "#fff7ed",
  buff: "#d8bb86",
  buffDark: "#b89a66",
  queensGreen: "#1f6b34",
  flag: "#e8453c",
  // The ink the backdrop's gulls are drawn in, far off in the sky.
  skyInk: "#55433a",
  // A grind rail: a galvanised handrail, pale steel with a sunlit top and a near-black edge, the
  // one long straight line in the zone and nothing like a schlong's pink or a barrel's orange.
  steel: "#aab5bf",
  steelLight: "#f4f8fb",
  steelInk: "#1f262c",
  // The runner's board: black grip on top, a maple edge, pale trucks and cream wheels, all edged
  // near-black so it reads on the pale sidewalk. Its underside is the team's colour, not in here.
  grip: "#26272b",
  ply: "#e3b774",
  boardInk: "#1c1714",
  truck: "#d3d9de",
  wheel: "#fff3d2",
  wheelHub: "#8b7355",
  deckFlash: "#fff7ed",
  // The grind's sparks: white-hot at the truck, yellow and orange as they fly.
  sparkHot: "#fffbe0",
  spark: "#ffd23f",
  sparkEmber: "#ff8a1c",
  cloud: "#f4fbff",
  sun: "#ffe066",
  // The collectible, and the night's own joke: a sauced party wing. Orange rather than the gold
  // a ring would be, because a hot orange separates from both the sky and the hazed street,
  // which are the two grounds it mostly hangs over. The edge is much darker than the sauce rather
  // than a shade of it: a wing crossing Souldiers' wall has to stay a wing, and that brick
  // (`#a8523d`) is all but the same hue as a merely-darker orange would be.
  wing: "#f5902b",
  wingDark: "#7a3105",
  wingGloss: "#ffce7a",
  wingBone: "#fff1d6",
  wingBoneDark: "#c9a273",
  // The schlong, in JOUST and FAPPY's own bubblegum: the one hue on a grey-and-brick street that
  // is neither its concrete nor its brick, so a row of them reads from the sofa.
  schlong: "#f9a3bc",
  schlongDark: "#8e2a52",
  schlongLight: "#ffe6ee",
  schlongVein: "#c4577f",
  // The other two skins a badnik comes in, FAPPY's own (§2.9), so the zone's enemies are a
  // line-up and not a fence: a big dark one and a pale one.
  ebony: "#4b2a20",
  ebonyDark: "#1a0a06",
  ebonyLight: "#8c5a46",
  ebonyVein: "#8a5443",
  ivory: "#f4e3d3",
  ivoryDark: "#a9735c",
  ivoryLight: "#ffffff",
  ivoryVein: "#cf9f8b",
  // The thorn bed: the same creature, angrier and lower, and never mistakeable for the pink.
  thorn: "#d81e5b",
  thornDark: "#6d0d2f",
  // The springboard's pad, borrowed straight off a Sonic spring so it means what it means.
  pad: "#e8453c",
  padStripe: "#fff7ed",
  padDark: "#9c1f1a",
  // The fall's punchline (§2.11): the dust a thud throws up out of the dig, and the raccoon that
  // lives down there — grey, a pale snout, the black mask with a bright eye in it — in the
  // roadworks' orange hard hat, a safety orange redder than a wing so the haul it hugs still reads.
  dust: "#d8caa9",
  dustShade: "#a8977a",
  pebble: "#6b5d4a",
  raccoonFur: "#8f9398",
  raccoonFurDark: "#5d6166",
  raccoonPale: "#e6e2da",
  raccoonMask: "#1b1c20",
  raccoonInk: "#2a2b30",
  raccoonEye: "#ffffff",
  hardHat: "#ff6f0f",
  hardHatDark: "#9e3f04",
  hardHatShine: "#ffc58f",
  post: "#f4f6fa",
  postPole: "#9aa6b5",
  shadow: "#2e2a26",
  eye: "#fff7ed",
  pupil: "#1c0d02",
  gloss: "#ffffff"
} as const;
