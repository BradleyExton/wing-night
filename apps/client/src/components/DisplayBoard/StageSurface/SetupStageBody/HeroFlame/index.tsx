import * as styles from "./styles";

export const HeroFlame = (): JSX.Element => {
  return (
    <div className={styles.container} aria-hidden>
      <svg
        className={styles.svg}
        viewBox="0 0 200 380"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <filter id="setup-turb-outer" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.022"
              numOctaves={2}
              seed={2}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="9s"
                values="0.015 0.022;0.020 0.018;0.015 0.022"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={22} />
          </filter>
          <filter id="setup-turb-mid" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022 0.030"
              numOctaves={2}
              seed={5}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="6s"
                values="0.022 0.030;0.028 0.024;0.022 0.030"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={14} />
          </filter>
          <filter id="setup-turb-inner" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.030 0.038"
              numOctaves={2}
              seed={7}
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="4s"
                values="0.030 0.038;0.036 0.032;0.030 0.038"
                repeatCount="indefinite"
              />
            </feTurbulence>
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
        <path
          className={styles.flameOuter}
          filter="url(#setup-turb-outer)"
          d="M 100 380 C 30 360 0 300 10 230 C 20 180 40 150 50 110 C 55 80 50 60 60 30 C 70 60 90 70 100 50 C 110 70 130 60 140 30 C 150 60 145 80 150 110 C 160 150 180 180 190 230 C 200 300 170 360 100 380 Z"
        />
        <path
          className={styles.flameMid}
          filter="url(#setup-turb-mid)"
          d="M 100 370 C 50 355 25 305 35 245 C 45 195 65 170 75 130 C 80 100 75 80 85 50 C 95 75 100 65 100 50 C 100 65 105 75 115 50 C 125 80 120 100 125 130 C 135 170 155 195 165 245 C 175 305 150 355 100 370 Z"
        />
        <path
          className={styles.flameInner}
          filter="url(#setup-turb-inner)"
          d="M 100 358 C 65 345 50 305 60 255 C 70 215 85 195 92 160 C 96 130 92 110 100 90 C 108 110 104 130 108 160 C 115 195 130 215 140 255 C 150 305 135 345 100 358 Z"
        />
        <path
          className={styles.flameCore}
          filter="url(#setup-turb-core)"
          d="M 100 340 C 80 330 75 295 82 260 C 88 230 96 210 100 180 C 104 210 112 230 118 260 C 125 295 120 330 100 340 Z"
        />
      </svg>
    </div>
  );
};
