import { takeoverLabel } from "@wingnight/surface";

// The choices under the host's answer: the key, with the right one ticked. The host knows the
// answer already, so this is no disclosure; it is the same row the TV and the phones read, with
// the spread's counts beside each once the question is locked.
export const root = "mt-4 flex flex-col gap-2";

export const label = takeoverLabel;

export const list = "grid grid-cols-2 gap-2";

const itemBase =
  "flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-[clamp(0.9rem,1.3vw,1.1rem)] font-semibold text-text";

export const item = `${itemBase} border-text/10 bg-bg/40`;

export const itemAnswer = `${itemBase} border-success/60 bg-success/15`;

export const letter = "flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-primary/15 text-sm font-black text-primary";

export const text = "min-w-0 flex-1 truncate";

export const mark = "flex-none text-success";

export const count = "flex-none font-score text-lg font-extrabold tabular-nums text-text";
