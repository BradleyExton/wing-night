import { MINIGAME_DEVICE_MODES, type MinigameDeviceMode } from "@wingnight/shared";

import { deviceModeSurfaceCopy } from "./copy";
import type { DeviceModeRound } from "./selectDeviceModeRounds";
import * as styles from "./styles";

const DEVICE_MODE_OPTIONS: readonly MinigameDeviceMode[] = [
  MINIGAME_DEVICE_MODES.TABLET,
  MINIGAME_DEVICE_MODES.PHONES
];

type DeviceModeSurfaceProps = {
  // `selectDeviceModeRounds`: the arcade rounds the host can still set from here.
  rounds: DeviceModeRound[];
  // The mode this team's turn locked at its briefing, during a turn; null outside one.
  lockedDeviceMode: MinigameDeviceMode | null;
  onSetRoundDeviceMode?: (round: number, deviceMode: MinigameDeviceMode) => void;
};

// Where each arcade round's relay is played: on the tablet, passed hand to hand, or leg by leg on
// each contestant's own phone. Set before the night for every arcade round, and between turns for
// the teams still to come — a turn locks the round's choice when its briefing opens.
export const DeviceModeSurface = ({
  rounds,
  lockedDeviceMode,
  onSetRoundDeviceMode
}: DeviceModeSurfaceProps): JSX.Element | null => {
  if (rounds.length === 0) {
    return null;
  }

  const inHand = rounds.length === 1 ? rounds[0] : undefined;

  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <span>{deviceModeSurfaceCopy.title}</span>
      </div>
      {rounds.map(({ round, minigame, deviceMode }) => (
        <div key={round} className={styles.row} data-device-mode-round={round} data-device-mode={deviceMode}>
          <span className={styles.name}>{deviceModeSurfaceCopy.roundLabel(round, minigame)}</span>
          <span className={styles.chips}>
            {DEVICE_MODE_OPTIONS.map((option) => {
              const isActive = option === deviceMode;

              return (
                <button
                  key={option}
                  className={isActive ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={deviceModeSurfaceCopy.optionAriaLabel(round, option)}
                  disabled={onSetRoundDeviceMode === undefined}
                  onClick={(): void => {
                    onSetRoundDeviceMode?.(round, option);
                  }}
                >
                  {deviceModeSurfaceCopy.optionLabel(option)}
                </button>
              );
            })}
          </span>
        </div>
      ))}
      <p className={styles.note}>
        {lockedDeviceMode !== null && inHand !== undefined
          ? deviceModeSurfaceCopy.lockedNote(lockedDeviceMode, inHand.deviceMode)
          : deviceModeSurfaceCopy.phonesNote}
      </p>
    </section>
  );
};
