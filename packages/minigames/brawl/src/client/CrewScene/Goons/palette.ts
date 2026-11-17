// What the street's goons are painted in (DESIGN.md §2.8, §2.11). Every value is a CLASS NAME on
// the house tokens, never a hex: a goon is drawn content like the cast, and it takes its colours
// the way the cast hen takes its team colour, from one table a scene can swap whole — a night
// street hands in this one, and a sandbox can hand in another without touching a drawing.
//
// Tailwind only generates a class it can read whole in the source, so every one is written out.
//
// The swan's legs and the dropped wing's colours live beside their drawings (`Swan/palette.ts`,
// `../Pickups/Wing/palette.ts`) and are merged in here, so the scene hands every drawing on the
// street one palette and each colour is written once.
import { brawlWingPalette, type BrawlWingPalette } from "../Pickups/Wing/palette.js";
import { brawlSwanPalette, type BrawlSwanPalette } from "./Swan/palette.js";

type BrawlGoonBasePalette = {
  /** The goose's (and the boss's) body: Canada goose grey-brown. */
  feather: string;
  /** The goose's darker back and folded wing, and the gull's mantle. */
  featherDark: string;
  /** The black neck and head every Barrie goose has, the gull's wing tips. */
  neck: string;
  /** The goose's chin strap and the gull's white body. */
  plumage: string;
  /** The goose's bill and legs: the house goose is orange-billed in every game. */
  beak: string;
  /** The goose's legs, as a stroke. */
  legs: string;
  /** White marks drawn as strokes: the honk's lines and a KO'd goon's crossed-out eyes. */
  mark: string;
  /** The gull's yellow bill, and its stroke-drawn legs. */
  gullBeak: string;
  gullLegs: string;
  /** The eye, and the pupil inside an eye big enough to have one. */
  eye: string;
  pupil: string;
  /** The boss's eye, and the chain it wears: the only things that say "boss" before its size does. */
  rage: string;
  chain: string;
  /** The raccoon: grey fur, its darker legs and tail rings, the bandit mask. */
  fur: string;
  furDark: string;
  mask: string;
  /** The outline every goon is cut out with. */
  stroke: string;
  /**
   * The edge on the black parts — a goose's neck and head, a gull's wing tips — which the dark
   * outline would lose against a night sky: a warm dim rim, so a goose at night keeps its head.
   */
  rim: string;
  /** The stars a stunned or KO'd goon sees. */
  stars: string;
  /** The soft pool under a goon on the ground, so it stands on the street rather than floats. */
  shadow: string;
};

export type BrawlGoonPalette = BrawlGoonBasePalette & BrawlSwanPalette & BrawlWingPalette;

export const brawlGoonPalette: BrawlGoonPalette = {
  feather: "fill-mutedWarm",
  featherDark: "fill-mutedWarmDim",
  neck: "fill-bg",
  plumage: "fill-text",
  beak: "fill-primary",
  legs: "stroke-primary",
  mark: "stroke-text",
  gullBeak: "fill-gold",
  gullLegs: "stroke-gold",
  eye: "fill-text",
  pupil: "fill-bg",
  rage: "fill-heat",
  chain: "fill-gold",
  fur: "fill-muted",
  furDark: "fill-mutedWarmDim",
  mask: "fill-bg",
  stroke: "stroke-bg",
  rim: "stroke-mutedWarmDim",
  stars: "fill-gold",
  shadow: "fill-shade/40",
  ...brawlSwanPalette,
  ...brawlWingPalette
};
