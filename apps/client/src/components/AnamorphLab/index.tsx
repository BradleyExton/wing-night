import { useMemo, useState } from "react";

import { AngleDials } from "./AngleDials";
import { CloudCanvas } from "./CloudCanvas";
import { LabControls, type LabSettings } from "./LabControls";
import {
  angularErrorRadians,
  antipodeOf,
  buildAnamorphCloud,
  clampPitch,
  type ViewAngle
} from "./anamorphCloud";
import { anamorphLabCopy } from "./copy";
import { resolveSilhouette } from "./silhouettes";
import * as styles from "./styles";

// Dense enough that the resolved silhouette reads as a shape rather than as
// grain — at ~2.5k the edges are too ragged to judge the emergence curve, which
// is the one thing this lab exists to judge. Still one flat fillRect loop.
const POINT_COUNT = 6500;

const DEFAULT_SETTINGS: LabSettings = {
  silhouetteId: "bat",
  seed: 20260807,
  jitter: 0.55,
  curve: "linear",
  projection: "parallel",
  idiom: "dials",
  showPreview: false,
  showTelemetry: false
};

const toDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

const formatAngle = ({ yaw, pitch }: ViewAngle): string => {
  return `${toDegrees(yaw).toFixed(1)} / ${toDegrees(pitch).toFixed(1)}`;
};

export const AnamorphLab = (): JSX.Element => {
  const [settings, setSettings] = useState<LabSettings>(DEFAULT_SETTINGS);
  const [viewAngle, setViewAngle] = useState<ViewAngle>({ yaw: 0, pitch: 0 });
  const cloud = useMemo(() => {
    return buildAnamorphCloud({
      silhouette: resolveSilhouette(settings.silhouetteId),
      seed: settings.seed,
      pointCount: POINT_COUNT
    });
  }, [settings.silhouetteId, settings.seed]);
  const orbit =
    settings.idiom === "orbit"
      ? (deltaYaw: number, deltaPitch: number): void => {
          setViewAngle((previous) => ({
            yaw: previous.yaw + deltaYaw,
            pitch: clampPitch(previous.pitch + deltaPitch)
          }));
        }
      : undefined;
  const errorDegrees = toDegrees(angularErrorRadians(viewAngle, cloud.trueAngle));

  return (
    <main className={styles.container}>
      <div className={styles.headingBlock}>
        <h1 className={styles.heading}>{anamorphLabCopy.title}</h1>
        <p className={styles.description}>{anamorphLabCopy.description}</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.stageColumn}>
          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <span className={styles.cardHeaderLabel}>{anamorphLabCopy.cloudLabel}</span>
              <span className={styles.cardHeaderMeta}>
                {settings.idiom === "orbit" ? anamorphLabCopy.orbitHint : ""}
              </span>
            </header>
            <div className={styles.stageViewport}>
              <CloudCanvas
                cloud={cloud}
                yaw={viewAngle.yaw}
                pitch={viewAngle.pitch}
                jitter={settings.jitter}
                curve={settings.curve}
                projection={settings.projection}
                onOrbit={orbit}
              />
            </div>
          </section>

          {settings.showPreview ? (
            <section className={styles.previewCard}>
              <header className={styles.cardHeader}>
                <span className={styles.cardHeaderLabel}>{anamorphLabCopy.previewLabel}</span>
              </header>
              <div className={styles.previewViewport}>
                <CloudCanvas
                  cloud={cloud}
                  yaw={viewAngle.yaw}
                  pitch={viewAngle.pitch}
                  jitter={settings.jitter}
                  curve={settings.curve}
                  projection={settings.projection}
                />
              </div>
            </section>
          ) : null}

          {settings.idiom === "dials" ? (
            <section className={styles.controlsCard}>
              <AngleDials viewAngle={viewAngle} onViewAngleChange={setViewAngle} />
            </section>
          ) : null}

          {settings.showTelemetry ? (
            <section className={styles.controlsCard}>
              <div className={styles.telemetryGrid}>
                <span className={styles.telemetryKey}>{anamorphLabCopy.angularErrorLabel}</span>
                <span>{errorDegrees.toFixed(2)}</span>
                <span className={styles.telemetryKey}>{anamorphLabCopy.trueAngleLabel}</span>
                <span>{formatAngle(cloud.trueAngle)}</span>
              </div>
              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={(): void => {
                    setViewAngle(cloud.trueAngle);
                  }}
                >
                  {anamorphLabCopy.snapToTrueLabel}
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={(): void => {
                    setViewAngle(antipodeOf(cloud.trueAngle));
                  }}
                >
                  {anamorphLabCopy.snapToMirrorLabel}
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.controlsCard}>
          <span className={styles.cardHeaderLabel}>{anamorphLabCopy.controlsLabel}</span>
          <LabControls
            settings={settings}
            onSettingsChange={setSettings}
            onReroll={(): void => {
              setSettings((previous) => ({ ...previous, seed: previous.seed + 1 }));
            }}
          />
        </aside>
      </div>
    </main>
  );
};
