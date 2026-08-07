import type { LegibilityCurve, ProjectionModel } from "../anamorphCloud";
import { LAB_SILHOUETTES } from "../silhouettes";
import { anamorphLabCopy } from "../copy";
import * as styles from "../styles";

export type ControlIdiom = "dials" | "orbit";

export type LabSettings = {
  silhouetteId: string;
  seed: number;
  jitter: number;
  curve: LegibilityCurve;
  projection: ProjectionModel;
  idiom: ControlIdiom;
  showPreview: boolean;
  showTelemetry: boolean;
};

type SegmentedProps<TValue extends string> = {
  label: string;
  hint: string;
  value: TValue;
  options: readonly { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
};

const Segmented = <TValue extends string>({
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
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            className={`${styles.segmentedOption} ${
              option.value === value ? styles.segmentedOptionActive : ""
            }`}
            onClick={(): void => {
              onChange(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className={styles.controlHint}>{hint}</p>
    </div>
  );
};

type LabControlsProps = {
  settings: LabSettings;
  onSettingsChange: (settings: LabSettings) => void;
  onReroll: () => void;
};

export const LabControls = ({
  settings,
  onSettingsChange,
  onReroll
}: LabControlsProps): JSX.Element => {
  const patch = (changes: Partial<LabSettings>): void => {
    onSettingsChange({ ...settings, ...changes });
  };

  return (
    <div className={styles.controlsList}>
      <div className={styles.controlBlock}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>{anamorphLabCopy.jitterLabel}</span>
          <span className={styles.controlValue}>{settings.jitter.toFixed(2)}</span>
        </div>
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={1.5}
          step={0.01}
          value={settings.jitter}
          aria-label={anamorphLabCopy.jitterLabel}
          onChange={(event): void => {
            patch({ jitter: Number(event.target.value) });
          }}
        />
        <p className={styles.controlHint}>{anamorphLabCopy.jitterHint}</p>
      </div>

      <Segmented
        label={anamorphLabCopy.curveLabel}
        hint={anamorphLabCopy.curveHint}
        value={settings.curve}
        options={[
          { value: "linear", label: anamorphLabCopy.curveLinearLabel },
          { value: "snap", label: anamorphLabCopy.curveSnapLabel }
        ]}
        onChange={(curve): void => {
          patch({ curve });
        }}
      />

      <Segmented
        label={anamorphLabCopy.mirrorLabel}
        hint={anamorphLabCopy.mirrorHint}
        value={settings.projection}
        options={[
          { value: "parallel", label: anamorphLabCopy.mirrorOnLabel },
          { value: "eyeRay", label: anamorphLabCopy.mirrorOffLabel }
        ]}
        onChange={(projection): void => {
          patch({ projection });
        }}
      />

      <Segmented
        label={anamorphLabCopy.idiomLabel}
        hint={anamorphLabCopy.idiomHint}
        value={settings.idiom}
        options={[
          { value: "dials", label: anamorphLabCopy.idiomDialsLabel },
          { value: "orbit", label: anamorphLabCopy.idiomOrbitLabel }
        ]}
        onChange={(idiom): void => {
          patch({ idiom });
        }}
      />

      <Segmented
        label={anamorphLabCopy.previewToggleLabel}
        hint={anamorphLabCopy.previewHint}
        value={settings.showPreview ? "on" : "off"}
        options={[
          { value: "off", label: anamorphLabCopy.previewOffLabel },
          { value: "on", label: anamorphLabCopy.previewOnLabel }
        ]}
        onChange={(value): void => {
          patch({ showPreview: value === "on" });
        }}
      />

      <div className={styles.controlBlock}>
        <span className={styles.controlLabel}>{anamorphLabCopy.silhouetteLabel}</span>
        <select
          className={styles.input}
          value={settings.silhouetteId}
          aria-label={anamorphLabCopy.silhouetteLabel}
          onChange={(event): void => {
            patch({ silhouetteId: event.target.value });
          }}
        >
          {LAB_SILHOUETTES.map((silhouette) => (
            <option key={silhouette.id} value={silhouette.id}>
              {silhouette.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.controlBlock}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>{anamorphLabCopy.seedLabel}</span>
          <span className={styles.controlValue}>{settings.seed}</span>
        </div>
        <div className={styles.buttonRow}>
          <input
            type="number"
            className={styles.input}
            value={settings.seed}
            aria-label={anamorphLabCopy.seedLabel}
            onChange={(event): void => {
              patch({ seed: Number(event.target.value) });
            }}
          />
          <button type="button" className={styles.button} onClick={onReroll}>
            {anamorphLabCopy.rerollLabel}
          </button>
        </div>
      </div>

      <Segmented
        label={anamorphLabCopy.telemetryLabel}
        hint={anamorphLabCopy.telemetryHint}
        value={settings.showTelemetry ? "on" : "off"}
        options={[
          { value: "off", label: anamorphLabCopy.hideLabel },
          { value: "on", label: anamorphLabCopy.showLabel }
        ]}
        onChange={(value): void => {
          patch({ showTelemetry: value === "on" });
        }}
      />
    </div>
  );
};
