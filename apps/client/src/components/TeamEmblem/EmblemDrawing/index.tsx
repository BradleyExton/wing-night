import type { EmblemId } from "@wingnight/shared";

import * as styles from "./styles";

type EmblemDrawingProps = {
  emblem: EmblemId;
};

// The drawings, one per id, in a 64×64 box. Ported from the phase 1 mockup
// (public/mockups/team-identity/kit.js) with the colours moved onto classes.

const SkullHen = (): JSX.Element => (
  <g>
    <path className={styles.tint} d="M 6 34 L 16 22 L 12 34 L 20 30 L 14 44 Z" />
    <path className={styles.tint} d="M 58 34 L 48 22 L 52 34 L 44 30 L 50 44 Z" />
    <path className={styles.tint} d="M 26 12 L 29 4 L 32 10 L 35 2 L 38 10 L 41 5 L 42 13 Z" />
    <circle className={styles.light} cx={32} cy={30} r={17} />
    <rect className={styles.light} x={22} y={40} width={20} height={14} rx={3} />
    <rect className={styles.ink} x={26} y={44} width={2.5} height={8} />
    <rect className={styles.ink} x={31} y={44} width={2.5} height={8} />
    <rect className={styles.ink} x={36} y={44} width={2.5} height={8} />
    <circle className={styles.ink} cx={25} cy={29} r={5} />
    <circle className={styles.ink} cx={39} cy={29} r={5} />
    <path className={styles.accent} d="M 30 34 L 34 34 L 32 40 Z" />
  </g>
);

const StarMic = (): JSX.Element => (
  <g>
    <path
      className={styles.light}
      d="M 32 2 L 39 20 L 58 22 L 44 34 L 48 53 L 32 43 L 16 53 L 20 34 L 6 22 L 25 20 Z"
    />
    <rect className={styles.tint} x={24} y={14} width={16} height={24} rx={8} />
    <path className={styles.inkHairline} d="M 26 21 H 38 M 26 26 H 38 M 26 31 H 38" />
    <path className={styles.tintStrokeThin} d="M 20 32 C 20 46 44 46 44 32" />
    <rect className={styles.tint} x={29} y={42} width={6} height={18} rx={2} />
  </g>
);

const HatHorseshoe = (): JSX.Element => (
  <g>
    <path className={styles.tintStrokeWide} d="M 16 36 C 12 52 24 60 32 60 C 40 60 52 52 48 36" />
    <path
      className={styles.inkHairline}
      d="M 20 44 l 3 -1 M 44 44 l -3 -1 M 24 54 l 2 -3 M 40 54 l -2 -3"
    />
    <path
      className={styles.light}
      d="M 6 34 Q 32 44 58 34 Q 52 28 46 28 L 42 8 Q 32 4 22 8 L 18 28 Q 12 28 6 34 Z"
    />
    <rect className={styles.tint} x={20} y={24} width={24} height={6} />
  </g>
);

const Mirrorball = (): JSX.Element => (
  <g>
    <rect className={styles.light} x={30} y={0} width={4} height={8} />
    <circle className={styles.tint} cx={32} cy={34} r={24} />
    <path
      className={styles.inkHairline}
      d="M 8 34 H 56 M 12 22 H 52 M 12 46 H 52 M 32 10 V 58 M 20 12 V 56 M 44 12 V 56"
    />
    <rect className={styles.lightFlat} x={26} y={16} width={6} height={6} />
    <rect className={styles.lightFlat} x={38} y={28} width={6} height={6} />
    <rect className={styles.lightFlat} x={20} y={40} width={6} height={6} />
    <rect className={styles.lightFlat} x={32} y={46} width={6} height={6} />
    <path
      className={styles.lightFlat}
      d="M 56 8 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z"
    />
  </g>
);

const SafetyPin = (): JSX.Element => (
  <g>
    <path className={styles.lightStroke} d="M 14 50 L 50 14" />
    <path className={styles.tintStroke} d="M 14 50 C 6 44 10 32 20 30" />
    <circle className={styles.tint} cx={50} cy={14} r={8} />
    <path className={styles.lightStroke} d="M 20 30 L 46 22" />
  </g>
);

const Pick = (): JSX.Element => (
  <g>
    <path
      className={styles.tint}
      d="M 32 60 C 14 44 6 30 8 16 C 10 6 22 4 32 8 C 42 4 54 6 56 16 C 58 30 50 44 32 60 Z"
    />
    <path className={styles.lightFlat} d="M 24 16 C 20 20 20 28 24 34 C 20 26 22 20 24 16 Z" />
  </g>
);

const Boombox = (): JSX.Element => (
  <g>
    <rect className={styles.tint} x={4} y={20} width={56} height={34} rx={4} />
    <path className={styles.lightStrokeThin} d="M 20 20 V 12 H 44 V 20" />
    <circle className={styles.light} cx={18} cy={38} r={9} />
    <circle className={styles.light} cx={46} cy={38} r={9} />
    <circle className={styles.ink} cx={18} cy={38} r={3} />
    <circle className={styles.ink} cx={46} cy={38} r={3} />
    <rect className={styles.lightFlat} x={28} y={28} width={8} height={4} />
    <rect className={styles.lightFlat} x={28} y={36} width={8} height={12} />
  </g>
);

const WAVEFORM_PATH = "M 6 32 H 12 L 18 14 L 26 50 L 34 20 L 42 44 L 48 32 H 58";

const Waveform = (): JSX.Element => (
  <g>
    <path className={styles.tintStroke} d={WAVEFORM_PATH} />
    <path className={styles.lightHairline} d={WAVEFORM_PATH} />
  </g>
);

const Keys = (): JSX.Element => (
  <g>
    <rect className={styles.light} x={4} y={14} width={56} height={36} rx={2} />
    <path
      className={styles.inkHairline}
      d="M 14 14 V 50 M 24 14 V 50 M 34 14 V 50 M 44 14 V 50 M 54 14 V 50"
    />
    <rect className={styles.tintFlat} x={10} y={14} width={7} height={22} />
    <rect className={styles.tintFlat} x={20} y={14} width={7} height={22} />
    <rect className={styles.tintFlat} x={40} y={14} width={7} height={22} />
    <rect className={styles.tintFlat} x={50} y={14} width={7} height={22} />
  </g>
);

const DRAWINGS: Record<EmblemId, () => JSX.Element> = {
  "skull-hen": SkullHen,
  "star-mic": StarMic,
  "hat-horseshoe": HatHorseshoe,
  mirrorball: Mirrorball,
  "safety-pin": SafetyPin,
  pick: Pick,
  boombox: Boombox,
  waveform: Waveform,
  keys: Keys
};

export const EmblemDrawing = ({ emblem }: EmblemDrawingProps): JSX.Element => {
  const Drawing = DRAWINGS[emblem];

  return <Drawing />;
};
