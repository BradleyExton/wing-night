import {
  SETUP_PREVIEW_ROUND_SLOTS_MAX,
  type GameConfigRound,
  type RoomState
} from "@wingnight/shared";

import { setupStageCopy } from "./copy";
import * as styles from "./styles";

type SetupStageBodyProps = {
  gameConfig: RoomState["gameConfig"];
};

const DEFAULT_SETUP_PREVIEW_ROUND_SLOTS = 8;

const resolveSetupPreviewRoundSlotCount = (
  gameConfig: RoomState["gameConfig"]
): number => {
  const configuredPreviewRoundSlots = gameConfig?.setupPreviewRoundSlots;
  if (
    typeof configuredPreviewRoundSlots === "number" &&
    Number.isInteger(configuredPreviewRoundSlots) &&
    configuredPreviewRoundSlots > 0
  ) {
    return Math.min(configuredPreviewRoundSlots, SETUP_PREVIEW_ROUND_SLOTS_MAX);
  }
  return DEFAULT_SETUP_PREVIEW_ROUND_SLOTS;
};

const hasConfiguredSetupPreviewRoundSlots = (
  gameConfig: RoomState["gameConfig"]
): boolean => {
  return (
    typeof gameConfig?.setupPreviewRoundSlots === "number" &&
    Number.isInteger(gameConfig.setupPreviewRoundSlots) &&
    gameConfig.setupPreviewRoundSlots > 0
  );
};

const EMBER_PARTICLES: ReadonlyArray<{
  leftPercent: number;
  driftPx: number;
  durationSeconds: number;
  delaySeconds: number;
  size: "default" | "small" | "large";
}> = [
  { leftPercent: 5, driftPx: 30, durationSeconds: 9, delaySeconds: 0, size: "default" },
  { leftPercent: 12, driftPx: -20, durationSeconds: 11, delaySeconds: 1.5, size: "small" },
  { leftPercent: 18, driftPx: 40, durationSeconds: 8, delaySeconds: 3, size: "default" },
  { leftPercent: 27, driftPx: 15, durationSeconds: 12, delaySeconds: 0.8, size: "large" },
  { leftPercent: 35, driftPx: -35, durationSeconds: 10, delaySeconds: 2.2, size: "small" },
  { leftPercent: 43, driftPx: 25, durationSeconds: 9, delaySeconds: 4, size: "default" },
  { leftPercent: 52, driftPx: -10, durationSeconds: 11, delaySeconds: 1, size: "large" },
  { leftPercent: 61, driftPx: 30, durationSeconds: 13, delaySeconds: 2.5, size: "small" },
  { leftPercent: 70, driftPx: -25, durationSeconds: 10, delaySeconds: 3.5, size: "default" },
  { leftPercent: 78, driftPx: 20, durationSeconds: 9, delaySeconds: 0.4, size: "large" },
  { leftPercent: 86, driftPx: -15, durationSeconds: 12, delaySeconds: 2, size: "small" },
  { leftPercent: 93, driftPx: 35, durationSeconds: 11, delaySeconds: 4.5, size: "default" }
];

const HeroFlame = (): JSX.Element => {
  return (
    <div className={styles.heroFlame} aria-hidden>
      <svg
        className={styles.heroFlameSvg}
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

const Embers = (): JSX.Element => {
  return (
    <div className={styles.embers} aria-hidden>
      {EMBER_PARTICLES.map((particle, index) => {
        const sizeClassName =
          particle.size === "small"
            ? styles.emberSmall
            : particle.size === "large"
              ? styles.emberLarge
              : "";
        const inlineStyle = {
          left: `${particle.leftPercent}%`,
          ["--ember-drift" as string]: `${particle.driftPx}px`,
          ["--ember-duration" as string]: `${particle.durationSeconds}s`,
          ["--ember-delay" as string]: `${particle.delaySeconds}s`
        } as React.CSSProperties;

        return (
          <span
            key={`ember-${index}`}
            className={`${styles.ember} ${sizeClassName}`.trim()}
            style={inlineStyle}
          />
        );
      })}
    </div>
  );
};

type RoundSlot =
  | { type: "round"; round: GameConfigRound }
  | { type: "placeholder"; roundNumber: number };

const buildRoundSlots = (
  visibleRounds: GameConfigRound[],
  fillerRoundCount: number
): RoundSlot[] => {
  const slots: RoundSlot[] = visibleRounds.map((round) => ({
    type: "round",
    round
  }));
  for (let index = 0; index < fillerRoundCount; index += 1) {
    slots.push({
      type: "placeholder",
      roundNumber: visibleRounds.length + index + 1
    });
  }
  return slots;
};

export const SetupStageBody = ({
  gameConfig
}: SetupStageBodyProps): JSX.Element => {
  const shouldRenderRoundFillers = hasConfiguredSetupPreviewRoundSlots(gameConfig);
  const previewRoundSlotCount = resolveSetupPreviewRoundSlotCount(gameConfig);
  const configuredRounds = gameConfig?.rounds ?? [];
  const visibleRounds = configuredRounds.slice(0, previewRoundSlotCount);
  const fillerRoundCount = shouldRenderRoundFillers
    ? Math.max(previewRoundSlotCount - visibleRounds.length, 0)
    : Math.max(previewRoundSlotCount - visibleRounds.length, 0);
  const hiddenRoundCount = Math.max(
    configuredRounds.length - visibleRounds.length,
    0
  );
  const roundSlots = buildRoundSlots(visibleRounds, fillerRoundCount);
  const packName =
    typeof gameConfig?.name === "string" && gameConfig.name.length > 0
      ? setupStageCopy.packNameValue(gameConfig.name)
      : setupStageCopy.fallbackPackName;

  return (
    <div className={styles.container}>
      <span className={styles.ambient} aria-hidden />
      <HeroFlame />
      <Embers />

      <div className={styles.header}>
        <span className={styles.eyebrow}>{setupStageCopy.eyebrow}</span>
        <h2 className={styles.heading}>{setupStageCopy.brandLabel}</h2>
        <p className={styles.packName}>{packName}</p>
      </div>

      <div className={styles.rounds}>
        {roundSlots.map((slot) => {
          if (slot.type === "round") {
            const { round } = slot;
            return (
              <article key={`round-${round.round}`} className={styles.round}>
                <span className={styles.roundNum}>
                  {setupStageCopy.placeholderRoundNumber(round.round)}
                </span>
                <p className={styles.roundLabel}>
                  {setupStageCopy.formatRoundLabel(round.label)}
                </p>
                <p className={styles.sauce}>
                  {setupStageCopy.formatSauce(round.sauce)}
                </p>
                <p className={styles.minigame}>
                  <span className={styles.minigameLabel}>
                    {setupStageCopy.minigameArrow}
                  </span>
                  {setupStageCopy.formatMinigame(round.minigame)}
                </p>
              </article>
            );
          }
          return (
            <article
              key={`placeholder-${slot.roundNumber}`}
              className={styles.round}
            >
              <span className={styles.roundNum}>
                {setupStageCopy.placeholderRoundNumber(slot.roundNumber)}:{" "}
                {setupStageCopy.placeholderRoundLabel}
              </span>
              <p className={styles.roundLabel}>
                {setupStageCopy.placeholderRoundSummary}
              </p>
              <p className={styles.sauceMuted}>
                {setupStageCopy.placeholderRoundDash}
              </p>
            </article>
          );
        })}
      </div>

      {hiddenRoundCount > 0 && (
        <p className={styles.additionalRounds}>
          {setupStageCopy.additionalRoundsLabel(hiddenRoundCount)}
        </p>
      )}

      <p className={styles.waiting}>
        <span className={styles.waitingDot} aria-hidden />
        {setupStageCopy.waitingForTeamsLabel}
      </p>
    </div>
  );
};
