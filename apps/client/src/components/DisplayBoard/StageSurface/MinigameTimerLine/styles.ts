// The lit half of the TV's turn clock: the length of tube still burning in
// the marquee's glass track (DESIGN.md §2.2D). Gold at the live end through
// `primary` to `heat` at the spent end, with a white-hot tip; all `heat` and
// pulsing in the last ten seconds; nothing at all at zero. Time is space here
// — the room reads the line, and the digits next door are the footnote.
const litBase =
  "absolute inset-y-[2px] left-[2px] max-w-[calc(100%-4px)] rounded-full transition-[width] duration-1000 ease-linear";

export const lit = `${litBase} bg-gradient-to-r from-heat via-primary via-30% to-gold shadow-[0_0_8px_theme(colors.primary),0_0_22px_theme(colors.primary),0_0_44px_theme(colors.primary/50%)]`;

export const litUrgent = `${litBase} bg-heat shadow-[0_0_10px_theme(colors.heat),0_0_30px_theme(colors.heat)] motion-safe:animate-[heatpulse_0.65s_ease-in-out_infinite]`;

// Rides the lit length's right edge, so only the width ever moves.
export const tip =
  "absolute -bottom-[4px] -right-[4px] -top-[4px] w-[8px] rounded-[4px] bg-text shadow-[0_0_10px_theme(colors.text),0_0_26px_theme(colors.text),0_0_40px_theme(colors.primary)]";

// The width tracks the countdown continuously, so it cannot be a static
// utility class. Applied through a ref so the declaration stays here with
// the rest of the styling rather than becoming an inline style prop in the
// entry file — the same mechanism as `EatingStageBody`'s heat fill.
export const applyLitWidth =
  (percent: number) =>
  (element: HTMLDivElement | null): void => {
    if (element === null) {
      return;
    }

    element.style.width = `${percent}%`;
  };
