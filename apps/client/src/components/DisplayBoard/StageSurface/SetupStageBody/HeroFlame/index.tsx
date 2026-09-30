import * as styles from "./styles";

// The four tongues, outermost first. The glow is drawn from the same outlines, so the two
// can never disagree about where the fire is.
const OUTER_PATH =
  "M 100 380 C 30 360 0 300 10 230 C 20 180 40 150 50 110 C 55 80 50 60 60 30 C 70 60 90 70 100 50 C 110 70 130 60 140 30 C 150 60 145 80 150 110 C 160 150 180 180 190 230 C 200 300 170 360 100 380 Z";
const MID_PATH =
  "M 100 370 C 50 355 25 305 35 245 C 45 195 65 170 75 130 C 80 100 75 80 85 50 C 95 75 100 65 100 50 C 100 65 105 75 115 50 C 125 80 120 100 125 130 C 135 170 155 195 165 245 C 175 305 150 355 100 370 Z";
const INNER_PATH =
  "M 100 358 C 65 345 50 305 60 255 C 70 215 85 195 92 160 C 96 130 92 110 100 90 C 108 110 104 130 108 160 C 115 195 130 215 140 255 C 150 305 135 345 100 358 Z";
const CORE_PATH =
  "M 100 340 C 80 330 75 295 82 260 C 88 230 96 210 100 180 C 104 210 112 230 118 260 C 125 295 120 330 100 340 Z";

// The light the fire throws, in its own SVG under the flame and never animated, so it is
// rasterised once. It used to be a CSS drop-shadow on the flame itself, which re-blurred a
// panel-sized area on every frame the flame moved — the single biggest cost on the lobby.
//
// It is still those two drop-shadows (50px and 140px, the far one thrown by the flame AND
// the near glow, as CSS chains them), minus the flame itself. The outer SVG has no viewBox
// so its user units are CSS pixels, which is what keeps the glow the same width on a phone
// as on a TV; the flame is drawn in a nested SVG sized to it.
const FlameGlow = (): JSX.Element => (
  <svg className={styles.glowSvg}>
    <defs>
      <filter id="setup-glow" x="-50%" y="-30%" width="200%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation={25} result="nearBlur" />
        <feFlood className={styles.glowNear} />
        <feComposite in2="nearBlur" operator="in" result="near" />
        <feMerge result="lit">
          <feMergeNode in="near" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
        <feGaussianBlur in="lit" stdDeviation={70} result="farBlur" />
        <feFlood className={styles.glowFar} />
        <feComposite in2="farBlur" operator="in" result="far" />
        <feMerge>
          <feMergeNode in="far" />
          <feMergeNode in="near" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#setup-glow)">
      <svg width="100%" height="100%" viewBox="0 0 200 380" preserveAspectRatio="xMidYMax meet">
        <path fill="url(#setup-grad-outer)" d={OUTER_PATH} />
        <path fill="url(#setup-grad-mid)" d={MID_PATH} />
        <path fill="url(#setup-grad-inner)" d={INNER_PATH} />
        <path fill="url(#setup-grad-core)" d={CORE_PATH} />
      </svg>
    </g>
  </svg>
);

// Each tongue's edge is torn by its own turbulence. Only the core's churns: re-generating
// noise every frame is paid for in the area it covers, and the outer three span most of the
// stage. They still flicker (styles `layer*`, a transform), which is what reads as fire from
// the couch; the core is small and white-hot, where a churning edge is worth its cost.
export const HeroFlame = (): JSX.Element => {
  return (
    <div className={styles.container} aria-hidden>
      <FlameGlow />
      <svg
        className={styles.svg}
        viewBox="0 0 200 380"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="setup-grad-outer" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" className={styles.stopOuterBase} />
            <stop offset="0.55" className={styles.stopOuterMid} />
            <stop offset="1" className={styles.stopOuterTip} />
          </linearGradient>
          <linearGradient id="setup-grad-mid" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" className={styles.stopMidBase} />
            <stop offset="0.6" className={styles.stopMidMid} />
            <stop offset="1" className={styles.stopMidTip} />
          </linearGradient>
          <linearGradient id="setup-grad-inner" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" className={styles.stopInnerBase} />
            <stop offset="0.5" className={styles.stopInnerMid} />
            <stop offset="1" className={styles.stopInnerTip} />
          </linearGradient>
          <linearGradient id="setup-grad-core" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" className={styles.stopCoreBase} />
            <stop offset="0.5" className={styles.stopCoreMid} />
            <stop offset="1" className={styles.stopCoreTip} />
          </linearGradient>
          <filter id="setup-turb-outer" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.022"
              numOctaves={2}
              seed={2}
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={22} />
          </filter>
          <filter id="setup-turb-mid" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022 0.030"
              numOctaves={2}
              seed={5}
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={14} />
          </filter>
          <filter id="setup-turb-inner" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.030 0.038"
              numOctaves={2}
              seed={7}
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={9} />
          </filter>
          <filter id="setup-turb-core" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.040 0.048"
              numOctaves={2}
              seed={11}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="2.6s"
                values="0.040 0.048;0.046 0.040;0.040 0.048"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={5} />
          </filter>
        </defs>
        <g className={styles.layerOuter}>
          <path fill="url(#setup-grad-outer)" filter="url(#setup-turb-outer)" d={OUTER_PATH} />
        </g>
        <g className={styles.layerMid}>
          <path fill="url(#setup-grad-mid)" filter="url(#setup-turb-mid)" d={MID_PATH} />
        </g>
        <g className={styles.layerInner}>
          <path fill="url(#setup-grad-inner)" filter="url(#setup-turb-inner)" d={INNER_PATH} />
        </g>
        <g className={styles.layerCore}>
          <path fill="url(#setup-grad-core)" filter="url(#setup-turb-core)" d={CORE_PATH} />
        </g>
      </svg>
    </div>
  );
};
