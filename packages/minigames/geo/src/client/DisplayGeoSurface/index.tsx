import { lazy, Suspense, type ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";
import { resolveContentAssetSrc, type GeoMinigameDisplayView } from "@wingnight/shared";

import { resolvePhotoNumber } from "../resolvePhotoNumber/index.js";
import { useGeoSounds } from "../useGeoSounds/index.js";
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
  counterLabel,
  clock,
  clockLine
}: {
  activeTeamName: string | null;
  pendingPoints: number | null;
  counterLabel: string | null;
  clock: ReactNode;
  clockLine: ReactNode;
}): JSX.Element => (
  <NeonMarquee
    title={displayGeoSurfaceCopy.title}
    teamName={activeTeamName}
    pending={pendingPoints}
    readout={counterLabel}
    clock={clock}
    clockLine={clockLine}
  />
);

const GeoResultReadout = ({ result }: { result: GeoDisplayResult }): ReactNode => {
  const distance = displayGeoSurfaceCopy.distanceValue(result.distanceKm);
  // With more than one pin in, the plaque says whose pin the team scored.
  const bestPin = result.pins.length > 1 ? result.pins.find((pin) => pin.isBest) : undefined;

  return (
    <>
      <ResultPlaque
        tone={result.pointsAwarded > 0 ? "hit" : "miss"}
        kicker={
          bestPin === undefined
            ? displayGeoSurfaceCopy.distanceLabel
            : displayGeoSurfaceCopy.bestPinLabel(bestPin.name)
        }
        title={displayGeoSurfaceCopy.distanceTitle(distance.value, distance.unit)}
        points={displayGeoSurfaceCopy.pointsValue(result.pointsAwarded)}
        pointsCaption={displayGeoSurfaceCopy.pointsLabel}
      />
      <div className={styles.legendRow}>
        <span className={styles.legendEntry}>
          <span className={styles.legendGuessDot} aria-hidden="true" />
          {result.pins.length > 1 ? displayGeoSurfaceCopy.teamPinsLabel : displayGeoSurfaceCopy.guessPinLabel}
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
  clock,
  clockLine,
  serverOrigin
}: MinigameDisplayRendererProps): JSX.Element => {
  const geoDisplayView =
    minigameDisplayView?.minigame === "GEO" ? minigameDisplayView : null;

  useGeoSounds(geoDisplayView);

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
          clock={clock}
          clockLine={clockLine}
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
        clock={clock}
        clockLine={clockLine}
      />

      <div className={styles.arena}>
        <div className={styles.mapLayer}>
          {isBrowser && (
            <Suspense fallback={null}>
              <GeoTheatreMap
                guess={guess}
                answer={answer}
                pins={result?.pins}
                offlineNote={displayGeoSurfaceCopy.offlineNote}
              />
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
                <span
                  className={styles.status}
                  data-geo-phone-tally={
                    geoDisplayView.phoneAnswers === null
                      ? undefined
                      : `${geoDisplayView.phoneAnswers.answeredCount}/${geoDisplayView.phoneAnswers.seatedCount}`
                  }
                >
                  <span className={styles.statusDot} aria-hidden="true" />
                  {geoDisplayView.phoneAnswers === null
                    ? displayGeoSurfaceCopy.plottingStatus(activeTeamName)
                    : displayGeoSurfaceCopy.phonePinsStatus(
                        activeTeamName,
                        geoDisplayView.phoneAnswers.answeredCount,
                        geoDisplayView.phoneAnswers.seatedCount
                      )}
                </span>
              )
            : <GeoResultReadout result={result} />}
        </div>
      </div>
    </div>
  );
};
