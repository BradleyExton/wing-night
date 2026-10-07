// Every word in Brad's head gallery.
export const adminHeadGalleryCopy = {
  eyebrow: (count: number): string => (count === 1 ? "1 head" : `${count} heads`),
  title: "Heads",
  body: "Pick the head every new one is painted to match. Until you pick, each is painted on its own.",
  empty: "Nobody has kept a head yet.",
  birdLabel: (name: string): string => `${name}'s head on their bird`,
  styleReference: "Style",
  useAsStyle: "Use as style",
  picking: "Picking…",
  failed: "That didn't take. Try again."
} as const;
