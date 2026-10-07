import {
  phoneBigTitle,
  phoneCard,
  phoneCardHot,
  phoneEyebrow,
  phoneStampLost,
  phoneStampWon,
  phoneVoice
} from "@wingnight/surface";

// A playing-team phone's TRIVIA card (mockups/phone-answers): the house phone answer card
// (`@wingnight/surface`), the question, and ONE column of choices — a thumb's reach each, the
// pick lit `primary`, the rest glass.
export const card = phoneCard;

export const cardHot = phoneCardHot;

export const eyebrow = phoneEyebrow;

export const voice = phoneVoice;

export const bigTitle = phoneBigTitle;

export const stampWon = phoneStampWon;

export const stampLost = phoneStampLost;

export const question = "m-0 break-words text-[1.45rem] font-black leading-[1.1] text-text";

export const choices = "flex flex-col gap-2.5";

const choiceBase =
  "flex min-h-[4rem] w-full cursor-pointer items-center gap-3.5 rounded-2xl px-4 text-left text-[1.15rem] font-extrabold leading-tight transition-transform active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow";

export const choice = `${choiceBase} border border-ember/35 bg-surface/60 text-text`;

export const choiceOn = `${choiceBase} border border-primary bg-primary text-bg [box-shadow:inset_0_-4px_0_theme(colors.shade/28%),0_10px_24px_-14px_theme(colors.primary/70%)]`;

const letterBase = "flex h-9 w-9 flex-none items-center justify-center rounded-xl text-base font-black";

export const letter = `${letterBase} bg-primary/15 text-primary`;

export const letterOn = `${letterBase} bg-shade/20 text-bg`;
