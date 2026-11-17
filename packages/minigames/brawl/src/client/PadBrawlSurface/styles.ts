export const root = "relative h-full w-full overflow-hidden bg-bg text-text";

// The strip across the top in the player's own colour: whose pad this is, and her hearts.
export const header = "pointer-events-none absolute inset-x-0 top-0 block h-10";

export const headerText = "fill-bg font-score text-lg font-bold";

export const card = "absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center";

export const stepOutButton =
  "min-h-[5rem] rounded-2xl bg-primary px-10 font-score text-4xl font-black uppercase tracking-[0.1em] text-bg active:translate-y-[2px]";

export const title = "m-0 font-score text-5xl font-black tracking-[0.1em] text-danger";

export const line = "m-0 max-w-[32ch] text-base text-text/80";

// Over the pad while she is down or sat out: it dims the thumbs without taking them away, because
// a held stick still walks her the moment she is up.
export const veil = "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-bg/80 text-center";
