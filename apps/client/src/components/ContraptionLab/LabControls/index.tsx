import type { AttemptVariation } from "../labRun";
import type { ReadabilityAids } from "../RunCanvas";
import { LAB_PIECE_SETS } from "../pieceSets";
import { contraptionLabCopy } from "../copy";
import * as styles from "../styles";

export type LabSettings = {
  pieceSetId: string;
  aids: ReadabilityAids;
  attempts: number;
  variation: AttemptVariation;
  seed: number;
  durationSeconds: number;
  keyframeHz: number;
  playbackRate: number;
};

type SegmentedProps<TValue extends string> = {
  label: string;
  hint?: string;
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
      {hint === undefined ? null : <p className={styles.controlHint}>{hint}</p>}
    </div>
  );
};

type LabControlsProps = {
  settings: LabSettings;
  onSettingsChange: (settings: LabSettings) => void;
  onReroll: () => void;
  onReplay: () => void;
};

export const LabControls = ({
  settings,
  onSettingsChange,
  onReroll,
  onReplay
}: LabControlsProps): JSX.Element => {
  const patch = (changes: Partial<LabSettings>): void => {
    onSettingsChange({ ...settings, ...changes });
  };

  return (
    <div className={styles.controlsList}>
      <Segmented
        label={contraptionLabCopy.aidsLabel}
        hint={contraptionLabCopy.aidsHint}
        value={settings.aids}
        options={[
          { value: "bare", label: contraptionLabCopy.aidsBareLabel },
          { value: "trail", label: contraptionLabCopy.aidsTrailLabel },
          { value: "annotated", label: contraptionLabCopy.aidsAnnotatedLabel }
        ]}
        onChange={(aids): void => {
          patch({ aids });
        }}
      />

      <div className={styles.controlBlock}>
        <span className={styles.controlLabel}>{contraptionLabCopy.pieceSetLabel}</span>
        <select
          className={styles.input}
          value={settings.pieceSetId}
          aria-label={contraptionLabCopy.pieceSetLabel}
          onChange={(event): void => {
            patch({ pieceSetId: event.target.value });
          }}
        >
          {LAB_PIECE_SETS.map((pieceSet) => (
            <option key={pieceSet.id} value={pieceSet.id}>
              {pieceSet.label}
            </option>
          ))}
        </select>
        <p className={styles.controlHint}>{contraptionLabCopy.pieceSetHint}</p>
      </div>

      <Segmented
        label={contraptionLabCopy.attemptsLabel}
        hint={contraptionLabCopy.attemptsHint}
        value={String(settings.attempts)}
        options={[
          { value: "1", label: "One shot" },
          { value: "2", label: "Best of 2" },
          { value: "3", label: "Best of 3" }
        ]}
        onChange={(attempts): void => {
          patch({ attempts: Number(attempts) });
        }}
      />

      <Segmented
        label={contraptionLabCopy.variationLabel}
        hint={contraptionLabCopy.variationHint}
        value={settings.variation}
        options={[
          { value: "seed", label: contraptionLabCopy.variationSeedLabel },
          { value: "rebuild", label: contraptionLabCopy.variationRebuildLabel }
        ]}
        onChange={(variation): void => {
          patch({ variation });
        }}
      />

      <div className={styles.controlBlock}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>{contraptionLabCopy.durationLabel}</span>
          <span className={styles.controlValue}>{settings.durationSeconds.toFixed(1)}s</span>
        </div>
        <input
          type="range"
          className={styles.slider}
          min={1}
          max={8}
          step={0.5}
          value={settings.durationSeconds}
          aria-label={contraptionLabCopy.durationLabel}
          onChange={(event): void => {
            patch({ durationSeconds: Number(event.target.value) });
          }}
        />
        <p className={styles.controlHint}>{contraptionLabCopy.durationHint}</p>
      </div>

      <Segmented
        label={contraptionLabCopy.keyframeHzLabel}
        hint={contraptionLabCopy.keyframeHzHint}
        value={String(settings.keyframeHz)}
        options={[
          { value: "20", label: "20 Hz" },
          { value: "30", label: "30 Hz" },
          { value: "60", label: "60 Hz" }
        ]}
        onChange={(keyframeHz): void => {
          patch({ keyframeHz: Number(keyframeHz) });
        }}
      />

      <Segmented
        label={contraptionLabCopy.playbackLabel}
        hint={contraptionLabCopy.playbackHint}
        value={String(settings.playbackRate)}
        options={[
          { value: "0.25", label: "0.25×" },
          { value: "0.5", label: "0.5×" },
          { value: "1", label: "1×" }
        ]}
        onChange={(playbackRate): void => {
          patch({ playbackRate: Number(playbackRate) });
        }}
      />

      <div className={styles.controlBlock}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>{contraptionLabCopy.seedLabel}</span>
          <span className={styles.controlValue}>{settings.seed}</span>
        </div>
        <div className={styles.buttonRow}>
          <input
            type="number"
            className={styles.input}
            value={settings.seed}
            aria-label={contraptionLabCopy.seedLabel}
            onChange={(event): void => {
              patch({ seed: Number(event.target.value) });
            }}
          />
          <button type="button" className={styles.button} onClick={onReroll}>
            {contraptionLabCopy.rerollLabel}
          </button>
          <button type="button" className={styles.button} onClick={onReplay}>
            {contraptionLabCopy.replayLabel}
          </button>
        </div>
      </div>

      <p className={styles.noteBlock}>{contraptionLabCopy.bodyContactNote}</p>
    </div>
  );
};
