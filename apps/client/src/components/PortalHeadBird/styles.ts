// A guest's head where it will be on the night: on a bird, standing in a pool of the hearth's
// heat. The bird box is the cast's 80×72, sized by height — and capped by the screen's, so a
// phone turned on its side still shows the buttons under the bird on its first screen.
export const stage =
  "relative flex items-end justify-center overflow-hidden rounded-xl bg-[radial-gradient(ellipse_at_50%_100%,theme(colors.primary/22%)_0%,transparent_70%)]";

export const stageLarge = `${stage} h-[min(13rem,38svh)] pb-3`;

export const stageSmall = `${stage} h-[5.5rem] pb-1`;

export const birdLarge = "block h-[min(11rem,32svh)]";

export const birdSmall = "block h-[4.75rem]";
