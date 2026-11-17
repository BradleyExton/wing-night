import { runGunLabCopy } from "../../copy";
import type { YardTuning } from "../../yardSim";
import * as styles from "./styles";

const copy = runGunLabCopy.tuning;

/** The rules under test, plus the knobs that only change what the page shows or how late it hears. */
export type LabSettings = YardTuning & {
  inputDelayMs: number;
  showBoxes: boolean;
};

type ToggleProps = { label: string; value: boolean; onChange: (value: boolean) => void };

const Toggle = ({ label, value, onChange }: ToggleProps): JSX.Element => (
  <label className={styles.toggleRow}>
    <input
      className={styles.checkbox}
      type="checkbox"
      checked={value}
      onChange={(event): void => {
        onChange(event.target.checked);
      }}
    />
    <span className={styles.label}>{label}</span>
  </label>
);

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

const Slider = ({ label, value, min, max, step, onChange }: SliderProps): JSX.Element => (
  <label className={styles.block}>
    <span className={styles.label}>{label}</span>
    <input
      className={styles.slider}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event): void => {
        onChange(Number(event.target.value));
      }}
    />
  </label>
);

type TuningPanelProps = {
  settings: LabSettings;
  onChange: (settings: LabSettings) => void;
};

export const TuningPanel = ({ settings, onChange }: TuningPanelProps): JSX.Element => {
  const patch = (changes: Partial<LabSettings>): void => {
    onChange({ ...settings, ...changes });
  };

  return (
    <div className={styles.panel}>
      <p className={styles.heading}>{copy.heading}</p>

      <Slider
        label={copy.inputDelay(settings.inputDelayMs)}
        value={settings.inputDelayMs}
        min={0}
        max={300}
        step={10}
        onChange={(inputDelayMs): void => {
          patch({ inputDelayMs });
        }}
      />
      <Slider
        label={copy.shotSpeed(settings.shotSpeed)}
        value={settings.shotSpeed}
        min={30}
        max={150}
        step={5}
        onChange={(shotSpeed): void => {
          patch({ shotSpeed });
        }}
      />
      <Slider
        label={copy.telegraph(settings.telegraphMs)}
        value={settings.telegraphMs}
        min={0}
        max={1200}
        step={50}
        onChange={(telegraphMs): void => {
          patch({ telegraphMs });
        }}
      />
      <Slider
        label={copy.rest(settings.restMs)}
        value={settings.restMs}
        min={200}
        max={2000}
        step={100}
        onChange={(restMs): void => {
          patch({ restMs });
        }}
      />
      <Slider
        label={copy.forgiveness(settings.forgiveness)}
        value={settings.forgiveness}
        min={0}
        max={3}
        step={0.5}
        onChange={(forgiveness): void => {
          patch({ forgiveness });
        }}
      />
      <Toggle
        label={copy.stickAim}
        value={settings.stickAim}
        onChange={(stickAim): void => {
          patch({ stickAim });
        }}
      />
      <Toggle
        label={copy.showBoxes}
        value={settings.showBoxes}
        onChange={(showBoxes): void => {
          patch({ showBoxes });
        }}
      />
    </div>
  );
};
