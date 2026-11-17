import type { BackRoomSettings } from "../backRoom";
import { brawlBackRoomLabCopy } from "../copy";
import * as styles from "./styles";

const copy = brawlBackRoomLabCopy.rules;

type Option<TValue> = { value: TValue; label: string };

type SegmentedProps<TValue> = {
  label: string;
  hint?: string;
  value: TValue;
  options: readonly Option<TValue>[];
  onChange: (value: TValue) => void;
};

const Segmented = <TValue extends string | number | boolean>({
  label,
  hint,
  value,
  options,
  onChange
}: SegmentedProps<TValue>): JSX.Element => {
  return (
    <div className={styles.controlBlock}>
      <span className={styles.controlLabel}>{label}</span>
      <div className={styles.segmented} role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={option.value === value}
            className={`${styles.segmentedOption} ${option.value === value ? styles.segmentedOptionActive : ""}`}
            onClick={(): void => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hint === undefined ? null : <p className={styles.controlHint}>{hint}</p>}
    </div>
  );
};

const COUNTS = [1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }));

type ControlsProps = {
  settings: BackRoomSettings;
  onChange: (settings: BackRoomSettings) => void;
};

/** PROTOTYPE — throwaway. The four things to try, and who is on the street. Any change starts again. */
export const Controls = ({ settings, onChange }: ControlsProps): JSX.Element => {
  return (
    <>
      <Segmented
        label={copy.modeLabel}
        hint={copy.modeHint}
        value={settings.mode}
        options={[
          { value: "carry", label: copy.mode.carry },
          { value: "herd", label: copy.mode.herd }
        ]}
        onChange={(mode): void => {
          onChange({ ...settings, mode });
        }}
      />
      <Segmented
        label={copy.dragLabel}
        value={settings.isDragOn}
        options={[
          { value: true, label: copy.drag.on },
          { value: false, label: copy.drag.off }
        ]}
        onChange={(isDragOn): void => {
          onChange({ ...settings, isDragOn });
        }}
      />
      <Segmented
        label={copy.clockLabel}
        hint={copy.clockHint}
        value={settings.clockSeconds}
        options={[
          { value: 90, label: copy.clock.short },
          { value: 120, label: copy.clock.long }
        ]}
        onChange={(clockSeconds): void => {
          onChange({ ...settings, clockSeconds });
        }}
      />
      <Segmented
        label={copy.chargeLabel}
        hint={copy.chargeHint}
        value={settings.isChargeOn}
        options={[
          { value: true, label: copy.charge.on },
          { value: false, label: copy.charge.off }
        ]}
        onChange={(isChargeOn): void => {
          onChange({ ...settings, isChargeOn });
        }}
      />
      <Segmented
        label={copy.crewLabel}
        value={settings.crew}
        options={COUNTS}
        onChange={(crew): void => {
          onChange({ ...settings, crew, humans: Math.min(settings.humans, crew) });
        }}
      />
      <Segmented
        label={copy.humansLabel}
        hint={copy.humansHint}
        value={settings.humans}
        options={COUNTS.slice(0, Math.min(2, settings.crew))}
        onChange={(humans): void => {
          onChange({ ...settings, humans });
        }}
      />
    </>
  );
};
