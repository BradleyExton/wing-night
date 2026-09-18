export const container =
  "pointer-events-none absolute inset-0 z-[1] overflow-hidden";

// The per-particle delay rides inside the `animation` shorthand rather than a separate
// `[animation-delay:...]` utility: the shorthand resets animation-delay, and Tailwind emits it
// after the standalone delay rule at equal specificity, so a split pair silently computes 0s and
// every ember rises in unison. Second <time> in the shorthand is the delay.
const particleBase =
  "absolute -bottom-[2vh] h-1 w-1 rounded-full bg-ember opacity-0 [box-shadow:0_0_8px_theme(colors.ember),0_0_16px_rgba(251,191,36,0.6)] motion-reduce:hidden motion-reduce:[animation:none] [animation:rise_var(--ember-duration,9s)_linear_var(--ember-delay,0s)_infinite]";

const particleSmall = "h-[3px] w-[3px]";

const particleLarge =
  "h-1.5 w-1.5 [box-shadow:0_0_10px_theme(colors.ember),0_0_22px_rgba(251,191,36,0.7)]";

// A few sparks near the core: white-hot, fast and short-lived.
const particleSpark =
  "h-[3px] w-[3px] bg-text [box-shadow:0_0_8px_theme(colors.text),0_0_18px_theme(colors.gold)]";

// One entry per rendered ember. Position, drift, duration and delay are authored constants,
// so each particle's geometry is a static utility class rather than a computed style prop.
// The middle of the field is denser, because that is where the flame is.
export const particles: readonly string[] = [
  `${particleBase} left-[5%] [--ember-drift:30px] [--ember-duration:9s] [--ember-delay:0s]`,
  `${particleBase} ${particleSmall} left-[12%] [--ember-drift:-20px] [--ember-duration:11s] [--ember-delay:1.5s]`,
  `${particleBase} left-[18%] [--ember-drift:40px] [--ember-duration:8s] [--ember-delay:3s]`,
  `${particleBase} ${particleLarge} left-[27%] [--ember-drift:15px] [--ember-duration:12s] [--ember-delay:0.8s]`,
  `${particleBase} ${particleSmall} left-[35%] [--ember-drift:-35px] [--ember-duration:10s] [--ember-delay:2.2s]`,
  `${particleBase} ${particleSpark} left-[40%] [--ember-drift:-18px] [--ember-duration:5.5s] [--ember-delay:1.1s]`,
  `${particleBase} left-[43%] [--ember-drift:25px] [--ember-duration:9s] [--ember-delay:4s]`,
  `${particleBase} ${particleSmall} left-[47%] [--ember-drift:-12px] [--ember-duration:7.5s] [--ember-delay:5.2s]`,
  `${particleBase} ${particleSpark} left-[50%] [--ember-drift:22px] [--ember-duration:6s] [--ember-delay:3.3s]`,
  `${particleBase} ${particleLarge} left-[52%] [--ember-drift:-10px] [--ember-duration:11s] [--ember-delay:1s]`,
  `${particleBase} ${particleSmall} left-[55%] [--ember-drift:34px] [--ember-duration:8.5s] [--ember-delay:6.1s]`,
  `${particleBase} ${particleSpark} left-[58%] [--ember-drift:-26px] [--ember-duration:5s] [--ember-delay:2.7s]`,
  `${particleBase} ${particleSmall} left-[61%] [--ember-drift:30px] [--ember-duration:13s] [--ember-delay:2.5s]`,
  `${particleBase} left-[70%] [--ember-drift:-25px] [--ember-duration:10s] [--ember-delay:3.5s]`,
  `${particleBase} ${particleLarge} left-[78%] [--ember-drift:20px] [--ember-duration:9s] [--ember-delay:0.4s]`,
  `${particleBase} ${particleSmall} left-[86%] [--ember-drift:-15px] [--ember-duration:12s] [--ember-delay:2s]`,
  `${particleBase} left-[93%] [--ember-drift:35px] [--ember-duration:11s] [--ember-delay:4.5s]`
];
