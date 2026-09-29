// Scene materials for the corridor (DESIGN.md §2.9): downtown Barrie on a
// golden August afternoon, flown at rooftop height. Deliberately neither
// SCHLONIC's pale summer morning on the bay nor JOUST's purple dusk on the
// beach: a deep blue sky going to honey at the horizon, the sun high on the
// right, and the city warm in it — so the room knows which game it is from
// the sofa, and which city.
//
// The city is backdrop and never a hazard, so it is hazed toward the horizon
// and kept to middling values: everything the bird has to read — the champs,
// the eagle, the globs — is either lighter or darker than anything behind it.
// The champs come in three skins — bubblegum pink (the Genital Jousting joke,
// and the one hue on the street that is neither its brick nor its sky, so a
// row of them reads from the sofa), a big dark one and a pale one, so the row
// is a line-up and not a fence; the eagle is a bald one, because it is
// funnier. A spitter's open mouth is a dark wet red inside, and what it spits
// is off-white with a faint edge so it holds against the sky. Drawing
// content, not UI chrome — exempt from the two-accent budget the way the
// drawing inks and the JOUST arena are.
export const fappyPalette = {
  champ: "#f9a3bc",
  champDark: "#8e2a52",
  champLight: "#ffe6ee",
  champVein: "#c4577f",
  ebony: "#4b2a20",
  ebonyDark: "#1a0a06",
  ebonyLight: "#8c5a46",
  ebonyVein: "#8a5443",
  ivory: "#f4e3d3",
  ivoryDark: "#a9735c",
  ivoryLight: "#ffffff",
  ivoryVein: "#cf9f8b",
  mouth: "#5a1230",
  spit: "#fbf7f0",
  spitEdge: "#d8cbb6",
  // What a champ casts on the asphalt.
  shadow: "#1f1a17",
  eye: "#fff7ed",
  pupil: "#1c0d02",
  eagle: "#3b2314",
  eagleDark: "#1c0d02",
  eagleFeather: "#5a3a22",
  eagleHead: "#f5efe6",
  eagleBeak: "#f9a51a",
  // The afternoon sun, high over the bay: a white-gold core in a glow that
  // fades into the sky rather than ringing it.
  sun: "#fff3cf",
  sunGlow: "#f7c35f",
  // Kempenfelt Bay, glimpsed down the side streets: pale where it carries
  // the horizon's haze at the far bank, bluer toward the street, and the
  // sun's glitter across it.
  bayFar: "#b9c9bf",
  bay: "#7fa6b8",
  bayGlitter: "#fff4d6",
  // The haze that settles over the far bank, the horizon's own honey.
  haze: "#f1d49a",
  // The roofs the legs take off from and land on. Each is a building on
  // Dunlop Street seen from its neighbour's roof: a red-brick block to leave
  // from, a buff one to land on — the two bricks the street is made of — and
  // past the landing roof a tall concrete tower that closes the sky. Coping
  // along every roofline says where the roof is; the windows below it say it
  // is a building and not a wall of clay. Outlined in the same dark ink the
  // champs are, so a roof is as solid as a champ is.
  brick: "#9a4b3a",
  brickLight: "#b8634c",
  brickDark: "#6b3024",
  buff: "#c9a26c",
  buffLight: "#dcbb88",
  buffDark: "#8f6d42",
  tower: "#6f675f",
  towerLight: "#877e74",
  towerDark: "#4a433d",
  towerGlass: "#535a5f",
  coping: "#e4ddcf",
  copingShade: "#a39b8e",
  ledgeEdge: "#2e1c14",
  window: "#34434f",
  windowGlint: "#9cc0d6",
  sill: "#e4ddcf",
  // Rooftop plant on the start roof: a galvanised unit and its vent stack.
  plant: "#b7b2a9",
  plantDark: "#77726a",
  pole: "#6b4423",
  flag: "#fbbf24",
  flagEdge: "#8a4b06",
  strip: "#fbbf24",
  // The kerb along the street the champs stand in.
  kerbLine: "#2f2a27",
  // The skyline across the bay, at a fifth of the scroll: downtown's slabs,
  // City Hall and its spire, and the twin condos on the water — all hazed
  // into the afternoon's gold, warm and pale, so they read as far off. The
  // condos keep their cream and the blue down their corners, because that is
  // how the room knows them.
  farSkyline: {
    wall: "#b9a4a1",
    wallDark: "#9d8a8d",
    glass: "#f8e6bd",
    tower: "#dccab0",
    towerDark: "#b8a593",
    towerGlass: "#91aebd",
    roof: "#a7958a",
    shore: "#98a58a"
  },
  // Dunlop Street, at nearly half the scroll: the brick fronts and the
  // Queen's Hotel with its green roof, its sign and its flags. Hazed less
  // than the far bank — it is nearer — but still a step quieter than the
  // roofs the bird stands on, and on a concrete promenade of its own.
  nearSkyline: {
    brick: "#a8695c",
    brickDark: "#86534b",
    buff: "#c9b38f",
    buffDark: "#a8927a",
    trim: "#e5dccb",
    pane: "#62788a",
    awning: "#5b806c",
    cornice: "#4e6a5c",
    signLetter: "#efe2c2",
    flag: "#c35b50",
    promenade: "#a39a8f",
    promenadeDark: "#857c72"
  }
} as const;
