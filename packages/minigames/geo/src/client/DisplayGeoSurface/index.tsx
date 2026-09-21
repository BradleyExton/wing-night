import { lazy, Suspense, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { resolveContentAssetSrc, type GeoMinigameDisplayView } from "@wingnight/shared";

import { resolvePhotoNumber } from "../resolvePhotoNumber/index.js";
import { displayGeoSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Leaflet touches window at module scope, so the map only loads in browsers.
const GeoTheatreMap = lazy(() =>
  import("./GeoTheatreMap/index.js").then((module) => ({
    default: module.GeoTheatreMap
  }))
);

const isBrowser = typeof window !== "undefined";

type GeoDisplayResult = Extract<
  GeoMinigameDisplayView,
  { status: "submitted" }
>["result"];

const Marquee = ({
  activeTeamName,
  pendingPoints,
  counterLabel
}: {
  activeTeamName: string | null;
  pendingPoints: number | null;
  counterLabel: string | null;
}): JSX.Element => (
  <header className={styles.marquee}>
    <span className={styles.marqueeBulbs} aria-hidden="true" />
    <div className={styles.marqueeTeam}>
      {activeTeamName !== null && (
        <p className={styles.marqueeTeamName}>{activeTeamName}</p>
      )}
      {pendingPoints !== null && (
        <span className={styles.marqueeTeamPoints}>{pendingPoints}</span>
      )}
    </div>
    <div className={styles.marqueeTitle}>{displayGeoSurfaceCopy.showTitle}</div>
    <div className={styles.marqueeCounter}>{counterLabel}</div>
  </header>
);

const GeoResultReadout = ({ result }: { result: GeoDisplayResult }): ReactNode => {
  const distance = displayGeoSurfaceCopy.distanceValue(result.distanceKm);

  return (
    <>
      <div className={styles.resultRow}>
        <div className={styles.distanceTile}>
          <div className={styles.tileLabel}>
            {displayGeoSurfaceCopy.distanceLabel}
          </div>
          <div className={styles.tileValue}>
            {distance.value}
            <span className={styles.tileUnit}>{distance.unit}</span>
          </div>
        </div>
        <div className={styles.pointsTile}>
          <div className={styles.tileLabel}>
            {displayGeoSurfaceCopy.pointsLabel}
          </div>
          <div className={styles.pointsTileValue}>
            {displayGeoSurfaceCopy.pointsValue(result.pointsAwarded)}
          </div>
        </div>
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
};

export const DisplayGeoSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const geoDisplayView =
    minigameDisplayView?.minigame === "GEO" ? minigameDisplayView : null;
  const currentPrompt = geoDisplayView?.currentPrompt ?? null;
  const isPlayPhase = phase === "play";
  const result =
    geoDisplayView?.status === "submitted" ? geoDisplayView.result : null;
  const activeTurnTeamId = geoDisplayView?.activeTurnTeamId ?? null;
  const pendingPoints =
    activeTurnTeamId === null
      ? null
      : (geoDisplayView?.pendingPointsByTeamId[activeTurnTeamId] ?? null);
  const promptsPerTurn = geoDisplayView?.promptsPerTurn ?? 0;
  const counterLabel =
    isPlayPhase && promptsPerTurn > 0
      ? displayGeoSurfaceCopy.photoCounter(
          resolvePhotoNumber({
            promptsCompletedThisTurn: geoDisplayView?.promptsCompletedThisTurn ?? 0,
            promptsPerTurn,
            isSubmitted: result !== null
          }),
          promptsPerTurn
        )
      : null;

  if (!isPlayPhase || currentPrompt === null || geoDisplayView === null) {
    return (
      <div className={styles.stage}>
        <Marquee
          activeTeamName={activeTeamName}
          pendingPoints={pendingPoints}
          counterLabel={counterLabel}
        />
        <div className={styles.idleBody}>
          <p className={styles.idleText}>
            {isPlayPhase
              ? displayGeoSurfaceCopy.waitingMessage
              : displayGeoSurfaceCopy.introMessage}
          </p>
        </div>
      </div>
    );
  }

  // Before the guess is stamped the TV knows the team's pin but not the answer,
  // so the theatre map draws one pin and holds the world. Both arrive together
  // at the reveal and it closes on them.
  const guess =
    result === null
      ? geoDisplayView.currentGuess
      : { lat: result.guessLat, lng: result.guessLng };
  const answer =
    result === null ? null : { lat: result.answerLat, lng: result.answerLng };

  return (
    <div className={styles.stage}>
      <Marquee
        activeTeamName={activeTeamName}
        pendingPoints={pendingPoints}
        counterLabel={counterLabel}
      />

      <div className={styles.arena}>
        <div className={styles.mapLayer}>
          {isBrowser && (
            <Suspense fallback={null}>
              <GeoTheatreMap guess={guess} answer={answer} />
            </Suspense>
          )}
        </div>
        <div className={styles.vignette} aria-hidden="true" />

        <div className={styles.plate}>
          <div className={styles.plateShot}>
            <img
              className={styles.platePhoto}
              // Party photos live in the content pack and are served by the
              // server; the sample pack's placeholder art is served by Vite and
              // passes through untouched.
              src={resolveContentAssetSrc(currentPrompt.imageSrc, serverOrigin) ?? ""}
              alt={currentPrompt.title}
            />
            <span className={styles.plateEdge} aria-hidden="true" />
          </div>
          <div className={styles.plateCaption}>
            <span className={styles.plateEyebrow}>
              {displayGeoSurfaceCopy.eyebrow}
            </span>
            <p className={styles.plateTitle}>{currentPrompt.title}</p>
            {currentPrompt.hint !== undefined && (
              <p className={styles.plateHint}>
                {displayGeoSurfaceCopy.hintLabel(currentPrompt.hint)}
              </p>
            )}
          </div>
        </div>

        <div className={styles.readout}>
          {result === null
            ? activeTeamName !== null && (
                <span className={styles.status}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {displayGeoSurfaceCopy.plottingStatus(activeTeamName)}
                </span>
              )
            : <GeoResultReadout result={result} />}
        </div>
      </div>
    </div>
  );
};
