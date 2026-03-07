export const setupRoot =
  "relative isolate grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-[clamp(0.5rem,1vh,1.5rem)] overflow-hidden [@media(max-height:850px)]:gap-1.5";
export const setupHeader =
  "relative z-10 flex items-center gap-[clamp(0.5rem,0.8vw,1rem)] px-4 pt-[clamp(0.5rem,1vh,1.25rem)] md:px-8 2xl:px-12";
export const brandMark =
  "h-[clamp(1.7rem,1.9vw,3rem)] w-[clamp(1.7rem,1.9vw,3rem)] rounded-md bg-bg/70 p-1 ring-1 ring-primary/40";
export const setupTitle =
  "m-0 text-[clamp(2.1rem,2.1vw,3.5rem)] font-black leading-[1] tracking-[0.06em] text-primary/85";
export const titleAccentLine =
  "h-px w-[clamp(2rem,4vw,5rem)] flex-1 bg-gradient-to-r from-transparent via-primary/45 to-transparent [animation:pulse_8.5s_ease-in-out_infinite] [animation-delay:500ms] motion-reduce:[animation:none]";
export const titleAccentIcon =
  "h-[clamp(0.95rem,1.2vw,1.75rem)] w-[clamp(0.95rem,1.2vw,1.75rem)] self-center text-primary/75 [animation:pulse_7s_ease-in-out_infinite] motion-reduce:[animation:none]";
export const titleAccentIconTrailing = "[animation-delay:1500ms]";
export const titleGlow =
  "pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[clamp(1.5rem,2.2vw,2.8rem)] -translate-y-1/2 rounded-full bg-primary/10 blur-md [animation:pulse_9.5s_ease-in-out_infinite] motion-reduce:[animation:none]";
export const contentGrid =
  "relative z-10 grid min-h-0 content-center gap-[clamp(0.5rem,0.9vh,1.25rem)] [@media(max-height:850px)]:gap-1.5";
export const sectionTitle = "m-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted";
export const roundLineupTitle =
  "m-0 text-center text-[clamp(1.125rem,1.25vw,2.5rem)] font-black uppercase leading-none tracking-[0.1em] text-primary";
export const flowBand = "min-h-0 px-4 py-0.5 md:px-8 2xl:px-12";
export const flowLayout =
  "grid min-h-0 items-start gap-[clamp(0.5rem,0.9vh,1.25rem)] lg:items-end";
export const flowPhase =
  "grid min-h-0 content-start justify-items-center gap-[clamp(0.65rem,1.05vh,1.6rem)] [@media(max-height:850px)]:gap-[clamp(0.45rem,0.75vh,0.95rem)]";
export const flowLoopShell =
  "grid min-h-0 content-start gap-[clamp(0.5rem,0.9vh,1.25rem)] px-[clamp(0.5rem,1.3vw,1.5rem)] pb-[clamp(0.5rem,0.9vh,1.2rem)]";
export const flowLoopTitle =
  "m-0 text-center text-[clamp(1.125rem,1.25vw,2.5rem)] font-black uppercase leading-none tracking-[0.1em] text-primary";
export const flowLoopTitleRow =
  "relative mx-auto flex w-full max-w-[42ch] items-center justify-center gap-[clamp(0.4rem,0.8vw,1rem)] pb-[clamp(0.8rem,1.35vh,2rem)]";
export const roundLineupSubtitle =
  "mx-auto mt-[clamp(0.35rem,0.65vh,0.9rem)] mb-[clamp(0.7rem,1vh,1.45rem)] max-w-[80ch] text-center text-[clamp(0.95rem,0.85vw,1.5rem)] leading-[1.45] text-muted/95";
export const roundLineupTitleRow =
  "relative mx-auto flex w-full max-w-[38ch] items-center justify-center gap-[clamp(0.4rem,0.8vw,1rem)] pb-[clamp(0.35rem,0.7vh,0.95rem)]";
export const flowLoopSteps =
  "grid min-h-0 items-start gap-[clamp(0.5rem,0.85vw,1.2rem)] md:grid-cols-2 xl:grid-cols-4";
export const flowLoopStepSlot = "contents";
export const flowIllustrationSlot =
  "relative flex h-[clamp(9.6rem,22vh,26rem)] w-full items-center justify-center overflow-hidden";
export const sparkField =
  "pointer-events-none absolute inset-x-[7%] bottom-[calc(18%+45px)] z-30 h-[46%]";
export const sparkGlow =
  "absolute left-1/2 bottom-[10%] h-[clamp(0.8rem,1.4vw,1.8rem)] w-[clamp(4.2rem,10vw,11.5rem)] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-primary/25 to-transparent blur-[2px] opacity-45 motion-reduce:opacity-20";
export const spark =
  "absolute rounded-full bg-primary/80 opacity-75 shadow-[0_0_8px_rgba(249,115,22,0.3)] [will-change:transform,opacity] motion-reduce:[animation:none] motion-reduce:opacity-30";
export const sparkOne =
  "left-[32%] bottom-[12%] h-[clamp(0.24rem,0.4vw,0.58rem)] w-[clamp(0.24rem,0.4vw,0.58rem)] [--spark-drift:-0.45rem] [--spark-rise:4.2rem] [animation:sparkFloat_3.4s_cubic-bezier(0.24,0.66,0.25,1)_0ms_infinite]";
export const sparkTwo =
  "left-[50%] bottom-[16%] h-[clamp(0.2rem,0.34vw,0.5rem)] w-[clamp(0.2rem,0.34vw,0.5rem)] [--spark-drift:0.35rem] [--spark-rise:4.6rem] [animation:sparkFloat_3s_cubic-bezier(0.24,0.66,0.25,1)_700ms_infinite]";
export const sparkThree =
  "left-[68%] bottom-[10%] h-[clamp(0.2rem,0.34vw,0.5rem)] w-[clamp(0.2rem,0.34vw,0.5rem)] [--spark-drift:-0.25rem] [--spark-rise:4.9rem] [animation:sparkFloat_3.8s_cubic-bezier(0.24,0.66,0.25,1)_1300ms_infinite]";
export const sparkTrail =
  "absolute w-[2px] rounded-full bg-gradient-to-t from-primary/0 via-primary/55 to-primary/0 opacity-48 shadow-[0_0_8px_rgba(249,115,22,0.3)] [will-change:transform,opacity] motion-reduce:[animation:none] motion-reduce:opacity-25";
export const sparkTrailOne =
  "left-[41%] bottom-[15%] h-[clamp(0.68rem,1.05vw,1.25rem)] -rotate-[16deg] [--spark-drift:0.4rem] [--spark-rise:5.1rem] [animation:sparkTrailFloat_4.1s_cubic-bezier(0.28,0.68,0.3,1)_320ms_infinite]";
export const sparkTrailTwo =
  "left-[59%] bottom-[18%] h-[clamp(0.6rem,0.95vw,1.15rem)] rotate-[12deg] [--spark-drift:-0.35rem] [--spark-rise:4.8rem] [animation:sparkTrailFloat_4.2s_cubic-bezier(0.28,0.68,0.3,1)_1500ms_infinite]";
export const flowLoopIllustrationMedia = "relative z-10 h-[136%] w-[136%] max-w-none object-contain";
export const flowLoopIllustrationMediaMinigameIntro =
  "h-[133%] w-[133%] translate-y-[1%]";
export const flowLoopIllustrationMediaEatWings =
  "h-[122%] w-[122%] translate-y-[0.5%]";
export const flowLoopIllustrationMediaMinigamePlay =
  "h-[130%] w-[130%] translate-y-[3.5%]";
export const flowLoopIllustrationMediaTurnResults =
  "h-[166%] w-[166%] translate-y-[2%]";
export const flowStepLabel =
  "m-0 text-center text-[clamp(0.95rem,0.8vw,1.6rem)] font-bold uppercase tracking-[0.12em] text-text/95";
export const bottomBand = "relative z-10 px-4 pt-1 pb-0.5 md:px-8 2xl:px-12";
export const sectionDivider =
  "relative z-10 mx-auto h-px w-[86%] bg-gradient-to-r from-transparent via-primary/30 to-transparent [animation:pulse_12s_ease-in-out_infinite] motion-reduce:[animation:none]";
export const lineupGrid =
  "mt-[clamp(0.7rem,1.05vh,1.55rem)] grid gap-[clamp(0.5rem,0.8vw,1rem)] sm:grid-cols-2 xl:grid-cols-4";
export const roundCard =
  "relative grid grid-cols-[clamp(5rem,7.8vw,9rem)_minmax(0,1fr)] items-center gap-[clamp(0.5rem,0.95vw,1.25rem)] overflow-hidden rounded-[clamp(0.375rem,0.8vw,0.9rem)] border border-primary/25 bg-surfaceAlt/35 px-[clamp(0.5rem,1vw,1rem)] py-[clamp(0.5rem,0.95vh,1.1rem)]";
export const roundCardPlaceholder = "border-primary/20 bg-surface/35";
export const roundCardShine =
  "pointer-events-none absolute top-0 right-[-24px] h-full w-16 rotate-12 bg-gradient-to-l from-transparent to-primary/25 opacity-0 [animation:pulse_12s_ease-in-out_infinite] motion-reduce:[animation:none]";
export const roundCardShineTimingByIndex = [
  "[animation-delay:0ms] [animation-duration:12s]",
  "[animation-delay:2200ms] [animation-duration:13.5s]",
  "[animation-delay:4100ms] [animation-duration:12.8s]"
] as const;
export const roundArtworkShell =
  "row-span-2 flex h-[clamp(3.5rem,4.9vw,5.9rem)] w-[clamp(5rem,7.4vw,8.8rem)] items-center justify-center overflow-visible";
export const roundArtworkShellPlaceholder =
  "rounded-[clamp(0.5rem,0.7vw,0.9rem)] bg-primary/6";
export const roundArtwork =
  "h-full w-full object-contain drop-shadow-[0_12px_26px_rgba(15,23,42,0.18)]";
export const roundPlaceholderIcon =
  "h-[clamp(1.9rem,2.6vw,3.3rem)] w-[clamp(1.9rem,2.6vw,3.3rem)] text-primary/70";
export const roundCardTitle =
  "m-0 pr-[clamp(0.4rem,0.7vw,1rem)] text-[clamp(0.95rem,0.9vw,1.85rem)] font-bold leading-tight text-text";
export const roundMetaLine =
  "col-start-2 mt-0.5 m-0 text-[clamp(0.78rem,0.7vw,1.35rem)] leading-tight text-text/88";
export const extraRoundsLabel = "mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted";
export const expectationList = "mt-2 grid gap-1";
export const expectationItem = "text-sm text-text/90 [@media(max-height:850px)]:text-xs";
