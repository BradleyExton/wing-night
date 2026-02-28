export const setupRoot =
  "grid h-full grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 [@media(max-height:850px)]:gap-2";

export const setupTitle = "m-0 text-4xl font-black leading-tight text-text md:text-5xl";

export const setupSubtitle =
  "mt-2 text-base text-text/85 md:text-lg [@media(max-height:850px)]:hidden";

export const contentGrid =
  "grid min-h-0 gap-3 xl:grid-cols-[1.2fr_1fr] [@media(max-height:850px)]:gap-2";

export const heroBand =
  "min-h-0 rounded-xl border border-primary/35 bg-gradient-to-br from-primary/15 via-surfaceAlt to-surface p-3 [@media(max-height:850px)]:p-2.5";

export const heroIllustrationSlot =
  "flex h-full min-h-[130px] items-center justify-center rounded-lg border border-dashed border-primary/65 bg-bg/50 px-4 text-center text-sm font-semibold uppercase tracking-[0.16em] text-primary md:min-h-[150px] [@media(max-height:850px)]:min-h-[92px] [@media(max-height:850px)]:text-xs";

export const heroIllustrationMedia = "h-full w-full rounded-md object-cover";

export const textureSlot =
  "mt-2 flex min-h-[42px] items-center justify-center rounded-lg border border-dashed border-text/25 bg-surface px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted [@media(max-height:850px)]:hidden";

export const textureIllustrationMedia = "h-full w-full rounded-md object-cover";

export const setupStatusBand =
  "px-1 py-1";

export const sectionTitle = "m-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted";

export const statusChipRow = "mt-2 flex flex-wrap gap-2";

export const primaryStatusChip =
  "rounded-full border border-primary/60 bg-primary/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary [@media(max-height:850px)]:py-1";

export const statusChip =
  "rounded-full border border-text/15 bg-surfaceAlt px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-text/85 [@media(max-height:850px)]:py-1";

export const flowBand = "min-h-0 px-1 py-1";

export const flowGrid = "mt-2 grid gap-1";

export const flowCard = "grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2 border-b border-text/10 pb-1.5";

export const flowIllustrationSlot =
  "flex h-[42px] items-center justify-center rounded-md bg-surfaceAlt px-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-primary [@media(max-height:850px)]:h-[34px]";

export const flowIllustrationMedia = "h-full w-full rounded-sm object-cover";

export const flowStepLabel = "text-left text-sm font-semibold text-text/90";

export const bottomBand = "px-1 py-1";

export const lineupGrid = "mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3";

export const roundCard = "grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 border-b border-text/10 pb-1.5";

export const roundIconSlot =
  "flex h-[32px] items-center justify-center rounded-md bg-surfaceAlt px-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-primary [@media(max-height:850px)]:h-[30px]";

export const roundIconMedia = "h-[22px] w-[22px] object-contain";

export const roundCardTitle = "m-0 text-sm font-bold text-text";

export const roundMetaLine = "mt-1 m-0 text-xs text-text/85";

export const extraRoundsLabel = "mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted";

export const expectationList = "mt-2 grid gap-1";

export const expectationItem = "text-sm text-text/90 [@media(max-height:850px)]:text-xs";
