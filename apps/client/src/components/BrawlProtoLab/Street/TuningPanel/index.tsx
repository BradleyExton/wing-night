import { brawlProtoLabCopy } from "../../copy";
import type { StreetTuning } from "../../streetSim";
import * as styles from "./styles";

const copy = brawlProtoLabCopy.tuning;

/** The rules under test, plus the knobs that only change what the page shows or how late it hears. */
export type LabSettings = StreetTuning & {
  inputDelayMs: number;
  showReach: boolean;
  teamColours: boolean;
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

      <div className={styles.block}>
        <span className={styles.label}>{copy.depthMode}</span>
        <div className={styles.segmented} role="group" aria-label={copy.depthMode}>
          {(["free", "lanes"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={settings.depthMode === mode}
              className={`${styles.segmentedOption} ${settings.depthMode === mode ? styles.segmentedOptionActive : ""}`}
              onClick={(): void => {
                patch({ depthMode: mode });
              }}
            >
              {mode === "free" ? copy.depthModeFree : copy.depthModeLanes}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label={copy.depthBand(settings.depthBand)}
        value={settings.depthBand}
        min={1}
        max={14}
        step={1}
        onChange={(depthBand): void => {
          patch({ depthBand });
        }}
      />
      <Toggle
        label={copy.autoAlign}
        value={settings.autoAlign}
        onChange={(autoAlign): void => {
          patch({ autoAlign });
        }}
      />
      <Toggle
        label={copy.goonLineUp}
        value={settings.goonLineUp}
        onChange={(goonLineUp): void => {
          patch({ goonLineUp });
        }}
      />
      <Slider
        label={copy.depthSpeed(settings.depthSpeedShare)}
        value={settings.depthSpeedShare}
        min={0.3}
        max={1}
        step={0.05}
        onChange={(depthSpeedShare): void => {
          patch({ depthSpeedShare });
        }}
      />
      <Slider
        label={copy.geese(settings.geeseAtOnce)}
        value={settings.geeseAtOnce}
        min={0}
        max={8}
        step={1}
        onChange={(geeseAtOnce): void => {
          patch({ geeseAtOnce });
        }}
      />
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
      <Toggle
        label={copy.showReach}
        value={settings.showReach}
        onChange={(showReach): void => {
          patch({ showReach });
        }}
      />
      <Toggle
        label={copy.teamColours}
        value={settings.teamColours}
        onChange={(teamColours): void => {
          patch({ teamColours });
        }}
      />
    </div>
  );
};
