import { lazy, Suspense, type ReactNode } from "react";
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

type GeoDisplayResult = Extract<
  GeoMinigameDisplayView,
  { status: "submitted" }
>["result"];

const DossierShell = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className={styles.stage}>
    <div className={styles.frame}>
      <header className={styles.header}>
        <p className={styles.headerTitle}>{displayGeoSurfaceCopy.dossierTitle}</p>
        <p className={styles.headerMeta}>{displayGeoSurfaceCopy.dossierSubtitle}</p>
      </header>
      {children}
    </div>
  </div>
);

const GeoRevealNotes = ({ result }: { result: GeoDisplayResult }): JSX.Element => (
  <>
    <div className={styles.resultRow}>
      <span className={styles.distanceStamp}>
        {displayGeoSurfaceCopy.distanceStamp(result.distanceKm)}
      </span>
      <span className={styles.pointsSeal}>
        <span className={styles.pointsSealValue}>
          {displayGeoSurfaceCopy.pointsSealValue(result.pointsAwarded)}
        </span>
        <span className={styles.pointsSealLabel}>
          {displayGeoSurfaceCopy.pointsSealLabel}
        </span>
      </span>
    </div>
    <div className={styles.legendRow}>
      <span className={styles.legendEntry}>
        <span className={styles.legendGuessDot} aria-hidden="true" />
        {displayGeoSurfaceCopy.guessPinLabel}
      </span>
      <span className={styles.legendEntry}>
        <span className={styles.legendAnswerDot} aria-hidden="true" />
        {displayGeoSurfaceCopy.answerPinLabel}
      </span>
    </div>
  </>
);

export const DisplayGeoSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName
}: MinigameDisplayRendererProps): JSX.Element => {
  const geoDisplayView =
    minigameDisplayView?.minigame === "GEO" ? minigameDisplayView : null;
  const currentPrompt = geoDisplayView?.currentPrompt ?? null;
  const isPlayPhase = phase === "play";
  const result =
    geoDisplayView?.status === "submitted" ? geoDisplayView.result : null;

  if (!isPlayPhase || currentPrompt === null) {
    return (
      <DossierShell>
        <div className={styles.idleBody}>
          <p className={styles.idleText}>
            {isPlayPhase
              ? displayGeoSurfaceCopy.waitingMessage
              : displayGeoSurfaceCopy.introMessage}
          </p>
        </div>
      </DossierShell>
    );
  }

  return (
    <DossierShell>
      <div className={styles.body}>
        <div className={styles.postcard}>
          {result === null ? (
            <img
              className={styles.postcardPhoto}
              src={currentPrompt.imageSrc}
              alt={currentPrompt.title}
            />
          ) : (
            <div className={styles.postcardMap}>
              {isBrowser && (
                <Suspense fallback={null}>
                  <GeoRevealMap
                    guess={{ lat: result.guessLat, lng: result.guessLng }}
                    answer={{ lat: result.answerLat, lng: result.answerLng }}
                  />
                </Suspense>
              )}
            </div>
          )}
          <span className={styles.postmark}>
            {displayGeoSurfaceCopy.postmarkLabel}
          </span>
        </div>
        <div className={styles.notes}>
          <p className={styles.noteTitle}>{currentPrompt.title}</p>
          <span className={styles.noteRule} aria-hidden="true" />
          {result === null ? (
            <>
              {currentPrompt.hint !== undefined && (
                <p className={styles.noteHint}>
                  {displayGeoSurfaceCopy.hintLabel(currentPrompt.hint)}
                </p>
              )}
              {activeTeamName !== null && (
                <p className={styles.noteTeam}>
                  {displayGeoSurfaceCopy.plottingStatus(activeTeamName)}
                </p>
              )}
            </>
          ) : (
            <GeoRevealNotes result={result} />
          )}
        </div>
      </div>
    </DossierShell>
  );
};
