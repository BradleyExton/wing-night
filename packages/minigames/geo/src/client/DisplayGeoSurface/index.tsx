import { lazy, Suspense } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { GeoMinigameDisplayView } from "@wingnight/shared";

import { displayGeoSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Leaflet touches window at module scope, so the map only loads in browsers.
const GeoRevealMap = lazy(() =>
  import("./GeoRevealMap/index.js").then((module) => ({
    default: module.GeoRevealMap
  }))
);

const isBrowser = typeof window !== "undefined";

type GeoSubmittedView = Extract<GeoMinigameDisplayView, { status: "submitted" }>;

const GeoRevealSection = ({
  submittedView
}: {
  submittedView: GeoSubmittedView;
}): JSX.Element => {
  const result = submittedView.result;

  return (
    <>
      <div className={styles.mapShell}>
        {isBrowser && (
          <Suspense fallback={null}>
            <GeoRevealMap
              guess={{ lat: result.guessLat, lng: result.guessLng }}
              answer={{ lat: result.answerLat, lng: result.answerLng }}
            />
          </Suspense>
        )}
      </div>
      <div className={styles.pinLegend}>
        <span className={styles.pinLegendEntry}>
          <span className={styles.guessPinDot} aria-hidden="true" />
          {displayGeoSurfaceCopy.guessPinLabel}
        </span>
        <span className={styles.pinLegendEntry}>
          <span className={styles.answerPinDot} aria-hidden="true" />
          {displayGeoSurfaceCopy.answerPinLabel}
        </span>
      </div>
      <div className={styles.statsRow}>
        <div className={styles.statBlock}>
          <p className={styles.statLabel}>{displayGeoSurfaceCopy.distanceLabel}</p>
          <p className={styles.statValue}>
            {displayGeoSurfaceCopy.distanceValue(result.distanceKm)}
          </p>
        </div>
        <div className={styles.statBlock}>
          <p className={styles.statLabel}>{displayGeoSurfaceCopy.pointsLabel}</p>
          <p className={styles.statValue}>
            {displayGeoSurfaceCopy.pointsValue(result.pointsAwarded)}
          </p>
        </div>
      </div>
    </>
  );
};

export const DisplayGeoSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const geoDisplayView =
    minigameDisplayView?.minigame === "GEO" ? minigameDisplayView : null;
  const currentPrompt = geoDisplayView?.currentPrompt ?? null;
  const isPlayPhase = phase === "play";

  if (!isPlayPhase) {
    return (
      <div className={styles.introContainer}>
        <p className={styles.introText}>{displayGeoSurfaceCopy.introMessage}</p>
      </div>
    );
  }

  if (geoDisplayView === null || currentPrompt === null) {
    return (
      <div className={styles.introContainer}>
        <p className={styles.introText}>{displayGeoSurfaceCopy.waitingMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.title}>{currentPrompt.title}</p>
      {geoDisplayView.status === "submitted" ? (
        <GeoRevealSection submittedView={geoDisplayView} />
      ) : (
        <>
          <img
            className={styles.photo}
            src={currentPrompt.imageSrc}
            alt={currentPrompt.title}
          />
          {currentPrompt.hint !== undefined && (
            <p className={styles.hint}>
              {displayGeoSurfaceCopy.hintLabel(currentPrompt.hint)}
            </p>
          )}
          {activeTeamName !== null && (
            <p className={styles.statusRow}>
              <span className={styles.statusTeamName}>{activeTeamName}</span>
              <span className={styles.statusLabel}>
                {displayGeoSurfaceCopy.guessingStatus}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
};
