export const container =
  "flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-bg text-text";

export const setupAtmosphere =
  "pointer-events-none fixed inset-0 z-0 h-screen w-screen bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-50 blur-3xl [animation:spin_90s_linear_infinite] motion-reduce:[animation:none]";

export const main =
  "flex min-h-0 flex-1 items-stretch px-4 py-3 md:px-8 md:py-4 [@media(max-height:850px)]:py-2";

export const content = "h-full w-full";

export const stageShell = "relative h-full w-full overflow-hidden";
