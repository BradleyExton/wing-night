// The reveal beat's ruling pad. It used to be the third card down a 330px
// deck column; it is now an item in the takeover's foot row, so it lays its
// two rulings out side by side and takes the row's height rather than setting
// a column's.
export const card =
  "flex shrink-0 flex-col justify-center rounded-xl border-2 border-gold bg-gradient-to-b from-surface to-bg px-3 py-2";

export const title =
  "mb-1.5 block text-[0.62rem] font-extrabold uppercase tracking-[0.28em] text-gold";

export const rows = "flex items-center gap-3";

export const row = "flex items-center gap-2";

export const rowLabel =
  "text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-mutedWarm";

export const markButton =
  "min-h-[52px] w-[clamp(52px,5vw,64px)] rounded-lg border border-ember/20 bg-surface text-lg font-extrabold text-text transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40";

export const markButtonCorrect =
  "min-h-[52px] w-[clamp(52px,5vw,64px)] rounded-lg border-2 border-success bg-success text-lg font-extrabold text-bg transition disabled:cursor-not-allowed disabled:opacity-40";

export const markButtonIncorrect =
  "min-h-[52px] w-[clamp(52px,5vw,64px)] rounded-lg border-2 border-danger bg-danger text-lg font-extrabold text-text transition disabled:cursor-not-allowed disabled:opacity-40";
