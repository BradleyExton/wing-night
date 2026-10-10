// One member on the board: their bird, their name, and the move menu on the right. Rows are
// divided by the hearth's hairline, not boxed.
export const row = "flex items-center gap-2 border-t border-ember/15 py-1.5 first:border-t-0 first:pt-0 last:pb-0";

export const bird = "block w-[3.4rem] flex-none";

export const name = "min-w-0 flex-1 truncate text-[0.95rem] font-extrabold text-text";

// A native <select>, dressed as the row's quiet action so the phone's own picker does the menu.
export const move =
  "min-h-[40px] max-w-[7.5rem] flex-none rounded-lg border border-ember/30 bg-surface/60 px-2 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-text disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";
