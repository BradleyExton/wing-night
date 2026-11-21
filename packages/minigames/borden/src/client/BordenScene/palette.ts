// The base at night (DESIGN.md §2.11's licence for scene art, on the house tokens). Every value is a
// custom property the scene's root sets from the theme (`styles.ts`), because the drawings take
// their colours as presentation attributes and a class cannot reach one. The hens are their team's
// colour and the geese are Barrie's goose, each painted by its own table.
export const bordenNight = {
  far: "var(--bb-far)",
  farLine: "var(--bb-far-line)",
  window: "var(--bb-window)",
  fence: "var(--bb-fence)",
  wire: "var(--bb-wire)",
  ground: "var(--bb-ground)",
  groundLine: "var(--bb-ground-line)",
  paint: "var(--bb-paint)",
  steel: "var(--bb-steel)",
  steelDark: "var(--bb-steel-dark)",
  olive: "var(--bb-olive)",
  oliveDark: "var(--bb-olive-dark)",
  alarm: "var(--bb-alarm)",
  shot: "var(--bb-shot)",
  shell: "var(--bb-shell)",
  mild: "var(--bb-mild)",
  hot: "var(--bb-hot)",
  puddle: "var(--bb-puddle)",
  flag: "var(--bb-flag)",
  lamp: "var(--bb-lamp)",
  shadow: "var(--bb-shadow)",
  ink: "var(--bb-ink)",
  inkDark: "var(--bb-ink-dark)",
  gate: "var(--bb-gate)",
  stripe: "var(--bb-stripe)",
  spread: "var(--bb-spread)",
  long: "var(--bb-long)"
} as const;

export type BordenNight = typeof bordenNight;
