export const container =
  "pointer-events-none absolute inset-0 z-[1] overflow-hidden";

const particleBase =
  "absolute -bottom-[2vh] h-1 w-1 rounded-full bg-ember opacity-0 [box-shadow:0_0_8px_theme(colors.ember),0_0_16px_rgba(251,191,36,0.6)] motion-reduce:hidden motion-reduce:[animation:none] [animation:rise_var(--ember-duration,9s)_linear_infinite] [animation-delay:var(--ember-delay,0s)]";

const particleSmall = "h-[3px] w-[3px]";

const particleLarge =
  "h-1.5 w-1.5 [box-shadow:0_0_10px_theme(colors.ember),0_0_22px_rgba(251,191,36,0.7)]";

// One entry per rendered ember. Position, drift, duration and delay are authored constants,
// so each particle's geometry is a static utility class rather than a computed style prop.
export const particles: readonly string[] = [
  `${particleBase} left-[5%] [--ember-drift:30px] [--ember-duration:9s] [--ember-delay:0s]`,
  `${particleBase} ${particleSmall} left-[12%] [--ember-drift:-20px] [--ember-duration:11s] [--ember-delay:1.5s]`,
  `${particleBase} left-[18%] [--ember-drift:40px] [--ember-duration:8s] [--ember-delay:3s]`,
  `${particleBase} ${particleLarge} left-[27%] [--ember-drift:15px] [--ember-duration:12s] [--ember-delay:0.8s]`,
  `${particleBase} ${particleSmall} left-[35%] [--ember-drift:-35px] [--ember-duration:10s] [--ember-delay:2.2s]`,
  `${particleBase} left-[43%] [--ember-drift:25px] [--ember-duration:9s] [--ember-delay:4s]`,
  `${particleBase} ${particleLarge} left-[52%] [--ember-drift:-10px] [--ember-duration:11s] [--ember-delay:1s]`,
  `${particleBase} ${particleSmall} left-[61%] [--ember-drift:30px] [--ember-duration:13s] [--ember-delay:2.5s]`,
  `${particleBase} left-[70%] [--ember-drift:-25px] [--ember-duration:10s] [--ember-delay:3.5s]`,
  `${particleBase} ${particleLarge} left-[78%] [--ember-drift:20px] [--ember-duration:9s] [--ember-delay:0.4s]`,
  `${particleBase} ${particleSmall} left-[86%] [--ember-drift:-15px] [--ember-duration:12s] [--ember-delay:2s]`,
  `${particleBase} left-[93%] [--ember-drift:35px] [--ember-duration:11s] [--ember-delay:4.5s]`
];
