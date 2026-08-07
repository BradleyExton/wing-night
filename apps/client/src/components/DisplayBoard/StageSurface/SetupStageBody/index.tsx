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

const hasConfiguredSetupPreviewRoundSlots = (
  gameConfig: RoomState["gameConfig"]
): boolean => {
  return (
    typeof gameConfig?.setupPreviewRoundSlots === "number" &&
    Number.isInteger(gameConfig.setupPreviewRoundSlots) &&
    gameConfig.setupPreviewRoundSlots > 0
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
        <span className={styles.waitingDot} aria-hidden />
        {setupStageCopy.waitingForTeamsLabel}
      </p>
    </div>
  );
};
