import type {
  QueensHotelPalette,
  SouldiersSkateShopPalette,
  SpiritCatcherPalette,
  StorefrontsPalette,
  TownClusterPalette,
  WaterfrontCondosPalette
} from "@wingnight/scenery";

// The street at night (DESIGN.md §2.11's licence for scene art, on the house tokens). Every value
// is a custom property the scene's root sets from the theme (`styles.ts`), because the scenery
// takes its colours as presentation attributes and a class cannot reach one. Drawing content, not
// chrome: the goons have their own class-name palette (`Goons/palette.ts`) and the hen is the
// team's colour.
export const brawlNight = {
  wall: "var(--bn-wall)",
  wallDark: "var(--bn-wall-dark)",
  buff: "var(--bn-buff)",
  buffDark: "var(--bn-buff-dark)",
  trim: "var(--bn-trim)",
  pane: "var(--bn-pane)",
  awning: "var(--bn-awning)",
  sign: "var(--bn-sign)",
  signInk: "var(--bn-sign-ink)",
  signGreen: "var(--bn-sign-green)",
  signGreenLight: "var(--bn-sign-green-light)",
  flag: "var(--bn-flag)",
  town: "var(--bn-town)",
  townDark: "var(--bn-town-dark)",
  townGlass: "var(--bn-town-glass)",
  steel: "var(--bn-steel)",
  steelDark: "var(--bn-steel-dark)",
  mound: "var(--bn-mound)",
  sidewalk: "var(--bn-sidewalk)",
  joint: "var(--bn-joint)",
  kerb: "var(--bn-kerb)",
  road: "var(--bn-road)",
  lane: "var(--bn-lane)",
  plank: "var(--bn-plank)",
  sand: "var(--bn-sand)",
  chalk: "var(--bn-chalk)",
  water: "var(--bn-water)",
  glint: "var(--bn-glint)",
  lamp: "var(--bn-lamp)",
  lampGlow: "var(--bn-lamp-glow)",
  post: "var(--bn-post)",
  moon: "var(--bn-moon)",
  star: "var(--bn-star)",
  shadow: "var(--bn-shadow)"
} as const;

/** Dunlop's fronts across the road, lit from inside: dark brick, warm panes, red awnings. */
export const NIGHT_STOREFRONTS: StorefrontsPalette = {
  brick: brawlNight.wall,
  brickDark: brawlNight.wallDark,
  buff: brawlNight.buff,
  buffDark: brawlNight.buffDark,
  trim: brawlNight.trim,
  pane: brawlNight.pane,
  awning: brawlNight.awning,
  cornice: brawlNight.trim
};

export const NIGHT_SOULDIERS: SouldiersSkateShopPalette = {
  brick: brawlNight.wall,
  brickDark: brawlNight.wallDark,
  trim: brawlNight.trim,
  pane: brawlNight.pane,
  signGreen: brawlNight.signGreen,
  signGreenLight: brawlNight.signGreenLight,
  signInk: brawlNight.signInk,
  signLetter: brawlNight.lamp
};

export const NIGHT_QUEENS: QueensHotelPalette = {
  buff: brawlNight.buff,
  buffDark: brawlNight.buffDark,
  trim: brawlNight.wallDark,
  pane: brawlNight.pane,
  cornice: brawlNight.trim,
  signLetter: brawlNight.sign,
  flag: brawlNight.flag
};

/** Downtown's far slabs and the twin condos, hazed into the dark. */
export const NIGHT_TOWN: TownClusterPalette & WaterfrontCondosPalette & SpiritCatcherPalette = {
  wall: brawlNight.town,
  wallDark: brawlNight.townDark,
  glass: brawlNight.townGlass,
  tower: brawlNight.wall,
  towerDark: brawlNight.wallDark,
  towerGlass: brawlNight.pane,
  roof: brawlNight.trim,
  steel: brawlNight.steel,
  steelDark: brawlNight.steelDark,
  mound: brawlNight.mound
};
