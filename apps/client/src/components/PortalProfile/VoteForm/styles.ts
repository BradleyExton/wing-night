// The vote form: three questions in one card, each a labelled group. The wishes are chips (on is
// lit `primary`, off is the dashed open slot) and the format a column of radio rows.
export const group = "flex flex-col gap-2 border-t border-ember/15 pt-3";

export const chips = "flex flex-wrap gap-1.5";

const chipBase =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[0.9rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow disabled:opacity-40";

export const chip = `${chipBase} border border-dashed border-mutedWarmDim text-mutedWarm`;

export const chipOn = `${chipBase} border border-primary bg-primary/15 text-text`;

export const chipGlyph = "h-4 w-4";

export const choices = "flex flex-col gap-1.5";

const choiceBase =
  "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 text-[0.95rem] font-semibold";

export const choice = `${choiceBase} border-ember/20 text-mutedWarm`;

export const choiceOn = `${choiceBase} border-primary bg-primary/12 text-text`;

// Drawn rather than native, so an unpicked one is a warm ring and not a white disc on the glass.
export const radio =
  "h-[18px] w-[18px] flex-none cursor-pointer appearance-none rounded-full border-2 border-mutedWarm checked:border-primary checked:bg-primary checked:[box-shadow:inset_0_0_0_3px_theme(colors.bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const empty = "m-0 text-[0.85rem] italic text-mutedWarmDim";
