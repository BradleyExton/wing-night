import {
  SETUP_PREVIEW_ROUND_SLOTS_MAX,
  type GameConfigRound,
  type RoomState
} from "@wingnight/shared";

import { setupStageCopy } from "./copy";
import { Embers } from "./Embers";
import { HeroFlame } from "./HeroFlame";
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

const resolveRevealDelay = (index: number): string => {
  const lastIndex = styles.roundRevealDelays.length - 1;
  return styles.roundRevealDelays[Math.min(index, lastIndex)] ?? "";
};

export const SetupStageBody = ({
  gameConfig
}: SetupStageBodyProps): JSX.Element => {
  const previewRoundSlotCount = resolveSetupPreviewRoundSlotCount(gameConfig);
  const configuredRounds = gameConfig?.rounds ?? [];
  const visibleRounds = configuredRounds.slice(0, previewRoundSlotCount);
  const fillerRoundCount = Math.max(previewRoundSlotCount - visibleRounds.length, 0);
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
      <span className={styles.heatBloom} aria-hidden />
      <HeroFlame />
      <Embers />
      <span className={styles.vignette} aria-hidden />
      <span className={styles.grain} aria-hidden />

      <div className={styles.header}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrowRuleLeft} aria-hidden />
          <span className={styles.eyebrow}>{setupStageCopy.eyebrow}</span>
          <span className={styles.eyebrowRuleRight} aria-hidden />
        </div>
        <div className={styles.headingGlow}>
          <h2 className={styles.heading}>{setupStageCopy.brandLabel}</h2>
        </div>
        <p className={styles.packName}>
          <span className={styles.packNameDot} aria-hidden />
          {packName}
        </p>
      </div>

      <div className={styles.rounds}>
        {roundSlots.map((slot, index) => {
          const revealDelay = resolveRevealDelay(index);

          if (slot.type === "round") {
            const { round } = slot;
            return (
              <article
                key={`round-${round.round}`}
                className={`${styles.round} ${revealDelay}`}
              >
                <span className={styles.roundWatermark} aria-hidden>
                  {setupStageCopy.formatRoundNumber(round.round)}
                </span>
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
                  <span className={styles.minigameDot} aria-hidden />
                  {setupStageCopy.formatMinigame(round.minigame)}
                </p>
              </article>
            );
          }
          return (
            <article
              key={`placeholder-${slot.roundNumber}`}
              className={`${styles.roundPlaceholder} ${revealDelay}`}
            >
              <span className={styles.roundWatermark} aria-hidden>
                {setupStageCopy.formatRoundNumber(slot.roundNumber)}
              </span>
              <span className={styles.roundNum}>
                {setupStageCopy.placeholderRoundNumber(slot.roundNumber)}
                {setupStageCopy.placeholderRoundSeparator}{" "}
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
        <span className={styles.waitingBeacon} aria-hidden>
          <span className={styles.waitingRing} />
          <span className={styles.waitingDot} />
        </span>
        {setupStageCopy.waitingForTeamsLabel}
      </p>
    </div>
  );
};
