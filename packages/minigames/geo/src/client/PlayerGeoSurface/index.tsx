import { lazy, Suspense } from "react";
import type { MinigamePlayerRendererProps } from "@wingnight/minigames-core";
import type { GeoMinigamePlayerView } from "@wingnight/shared";

import { playerGeoSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Leaflet touches window at module scope, so the map only loads in browsers.
const GeoGuessMap = lazy(() =>
  import("../HostGeoSurface/GeoGuessMap/index.js").then((module) => ({
    default: module.GeoGuessMap
  }))
);

const isBrowser = typeof window !== "undefined";

const LockedCard = ({ view }: { view: GeoMinigamePlayerView }): JSX.Element => {
  const result = view.result;
  const distance = result === null ? null : playerGeoSurfaceCopy.distanceValue(result.distanceKm);
  const stamp =
    result === null
      ? null
      : result.isBest && result.pointsAwarded > 0
        ? playerGeoSurfaceCopy.bestStamp
        : result.pointsAwarded > 0
          ? playerGeoSurfaceCopy.scoredStamp
          : playerGeoSurfaceCopy.missStamp;

  return (
    <section
      className={result !== null && result.pointsAwarded > 0 ? styles.cardHot : styles.card}
      data-phone-answer="GEO"
      data-phone-answer-status="locked"
    >
      <p className={styles.eyebrow}>{playerGeoSurfaceCopy.lockedEyebrow(view.photoNumber, view.promptsPerTurn)}</p>
      {stamp !== null && (
        <p className={result !== null && result.pointsAwarded > 0 ? styles.stampWon : styles.stampLost}>{stamp}</p>
      )}
      <p className={styles.bigTitle}>{playerGeoSurfaceCopy.lockedTitle}</p>
      {result !== null && distance !== null ? (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{playerGeoSurfaceCopy.distanceLabel}</span>
            <span className={styles.statValue}>
              {distance.value}
              <span className={styles.statUnit}>{distance.unit}</span>
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{playerGeoSurfaceCopy.pointsLabel}</span>
            <span className={styles.statValue}>{playerGeoSurfaceCopy.pointsValue(result.pointsAwarded)}</span>
          </div>
        </div>
      ) : (
        view.pin === null && <p className={styles.voice}>{playerGeoSurfaceCopy.noPinVoice}</p>
      )}
      <p className={styles.voice}>{playerGeoSurfaceCopy.waitingVoice}</p>
    </section>
  );
};

// A playing-team phone answering a GEO photo: its own chart, its own pin, dropped and moved with a
// tap until the host locks the photo; then how it measured. The same chart the tablet pins on, at
// phone scale, so a phone with no route to the tile server still has the graticule to tap.
export const PlayerGeoSurface = ({ minigamePlayerView, onDispatchAction }: MinigamePlayerRendererProps): JSX.Element => {
  if (minigamePlayerView.minigame !== "GEO") {
    return <></>;
  }

  const view = minigamePlayerView;

  if (view.status === "locked") {
    return <LockedCard view={view} />;
  }

  return (
    <section
      className={styles.cardHot}
      data-phone-answer="GEO"
      data-phone-answer-status="open"
      data-phone-answer-pinned={view.pin !== null}
    >
      <p className={styles.eyebrow}>{playerGeoSurfaceCopy.eyebrow(view.photoNumber, view.promptsPerTurn)}</p>
      <p className={styles.title}>{view.promptTitle}</p>
      <div className={styles.map}>
        {isBrowser ? (
          <Suspense fallback={<div className={styles.mapFallback}>{playerGeoSurfaceCopy.mapLoadingLabel}</div>}>
            {/* Keyed by the photo, so the next photo opens on the whole world rather than where
                this one was zoomed. */}
            <GeoGuessMap
              key={view.promptId}
              guess={view.pin}
              answer={null}
              layout="phone"
              offlineNote={playerGeoSurfaceCopy.offlineNote}
              onSelectLocation={(lat, lng): void => {
                onDispatchAction("placePin", { lat, lng });
              }}
            />
          </Suspense>
        ) : (
          <div className={styles.mapFallback}>{playerGeoSurfaceCopy.mapLoadingLabel}</div>
        )}
      </div>
      {view.pin === null ? (
        <p className={styles.voice}>{playerGeoSurfaceCopy.noPinYet}</p>
      ) : (
        <span className={styles.pill}>
          <span className={styles.pillDot} aria-hidden="true" />
          {playerGeoSurfaceCopy.pinIn}
        </span>
      )}
      <p className={styles.voice}>{playerGeoSurfaceCopy.openVoice}</p>
    </section>
  );
};
