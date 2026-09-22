import { lazy, Suspense } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import { resolveContentAssetSrc, type GeoMinigameHostView } from "@wingnight/shared";
import { TakeoverCanvas } from "@wingnight/surface";

import { resolvePhotoNumber } from "../resolvePhotoNumber/index.js";
import { hostGeoSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// Leaflet touches window at module scope, so the map only loads in browsers.
const GeoGuessMap = lazy(() =>
  import("./GeoGuessMap/index.js").then((module) => ({
    default: module.GeoGuessMap
  }))
);

const isBrowser = typeof window !== "undefined";

const GeoPlate = ({
  currentPrompt,
  serverOrigin
}: {
  currentPrompt: NonNullable<GeoMinigameHostView["currentPrompt"]>;
  serverOrigin: string | null;
}): JSX.Element => (
  <div className={styles.plate}>
    <div className={styles.plateShot}>
      <img
        className={styles.platePhoto}
        src={resolveContentAssetSrc(currentPrompt.imageSrc, serverOrigin) ?? ""}
        alt={currentPrompt.title}
      />
      <span className={styles.plateEdge} aria-hidden="true" />
    </div>
    <div className={styles.plateCaption}>
      <span className={styles.plateEyebrow}>{hostGeoSurfaceCopy.eyebrow}</span>
      <p className={styles.plateTitle}>{currentPrompt.title}</p>
      {currentPrompt.hint !== undefined && (
        <p className={styles.plateHint}>
          {hostGeoSurfaceCopy.hintLabel(currentPrompt.hint)}
        </p>
      )}
    </div>
  </div>
);

// Two tiles, no box of their own: the layout's `readout` slot is the flex row
// that used to be `styles.verdict`, and it is the one that knows where the
// corner dock is.
const GeoVerdict = ({
  lastResult
}: {
  lastResult: NonNullable<GeoMinigameHostView["lastResult"]>;
}): JSX.Element => {
  const distance = hostGeoSurfaceCopy.distanceValue(lastResult.distanceKm);

  return (
    <>
      <div className={styles.distanceTile}>
        <div className={styles.tileLabel}>{hostGeoSurfaceCopy.distanceLabel}</div>
        <div className={styles.tileValue}>
          {distance.value}
          <span className={styles.tileUnit}>{distance.unit}</span>
        </div>
      </div>
      <div className={styles.pointsTile}>
        <div className={styles.tileLabel}>{hostGeoSurfaceCopy.pointsLabel}</div>
        <div className={styles.pointsTileValue}>
          {hostGeoSurfaceCopy.pointsValue(lastResult.pointsAwarded)}
        </div>
      </div>
    </>
  );
};

// GEO's host surface. At play it is a `<TakeoverCanvas>`
// (docs/takeover-layout-api.md §3, §5): the chart is the tablet, and every
// name in this file is one GEO invented and the Canvas generalised.
//
// It renders no rail and no team chip of its own — `rail` arrives filled with
// the shell's `<HostMiniRail />`, which already says the round, the sauce and
// whose turn it is — which is why the `resolveActiveTeamName` helper that all
// nine host surfaces had copied is no longer here. It also writes no z-index
// and no `isolate` on the body: the layout owns the bands, and `z-[1100]` is
// the corner dock's alone (§7).
export const HostGeoSurface = ({
  phase,
  minigameHostView,
  rail,
  clock,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const geoHostView =
    minigameHostView?.minigame === "GEO" ? minigameHostView : null;

  // The intro beat is a panel in the host's own control deck rather than a
  // takeover — `rail` and `clock` are both null on it — so a full-bleed chart
  // there would be nonsense and it gets the briefing note instead.
  if (phase !== "play") {
    return (
      <div className={styles.introContainer}>
        <p className={styles.statusNote}>
          {hostGeoSurfaceCopy.introDescription}
        </p>
      </div>
    );
  }

  const currentPrompt = geoHostView?.currentPrompt ?? null;
  const isSubmitted = geoHostView?.currentSubState === "submitted";
  const promptsPerTurn = geoHostView?.promptsPerTurn ?? 0;
  const promptsCompleted = geoHostView?.promptsCompletedThisTurn ?? 0;
  const isTurnComplete = isSubmitted && promptsCompleted >= promptsPerTurn;
  const photoNumber = resolvePhotoNumber({
    promptsCompletedThisTurn: promptsCompleted,
    promptsPerTurn,
    isSubmitted
  });
  const lastResult = geoHostView?.lastResult ?? null;
  const isGuessing = geoHostView !== null && !isSubmitted && currentPrompt !== null;
  const canSubmitGuess =
    canDispatchAction && geoHostView !== null && geoHostView.currentGuess !== null;

  // The answer only exists on the tablet once the guess is stamped, so the
  // reveal draws itself on the same chart the team just pinned rather than
  // swapping the canvas out from under them.
  const answer =
    isSubmitted && lastResult !== null && currentPrompt !== null
      ? { lat: currentPrompt.answerLat, lng: currentPrompt.answerLng }
      : null;

  return (
    <TakeoverCanvas
      rail={rail}
      clock={clock}
      counter={
        promptsPerTurn > 0 ? (
          <span className={styles.counter}>
            {hostGeoSurfaceCopy.photoCounter(photoNumber, promptsPerTurn)}
          </span>
        ) : null
      }
      actions={
        isGuessing ? (
          <>
            <button
              className={styles.submitButton}
              type="button"
              disabled={!canSubmitGuess}
              onClick={(): void => {
                onDispatchAction("submitGuess", {});
              }}
            >
              {hostGeoSurfaceCopy.submitButtonLabel}
            </button>
            <span className={styles.mapInstruction}>
              {hostGeoSurfaceCopy.mapInstructionLabel}
            </span>
          </>
        ) : isTurnComplete ? (
          <p className={styles.turnCompleteNote}>
            {hostGeoSurfaceCopy.turnCompleteLabel}
          </p>
        ) : isSubmitted ? (
          <button
            className={styles.nextPromptButton}
            type="button"
            disabled={!canDispatchAction}
            onClick={(): void => {
              onDispatchAction("nextPrompt", {});
            }}
          >
            {hostGeoSurfaceCopy.nextPromptButtonLabel}
          </button>
        ) : null
      }
      readout={
        isSubmitted && lastResult !== null ? (
          <GeoVerdict lastResult={lastResult} />
        ) : null
      }
    >
      {/* An empty bank, or a turn whose next photo has not landed yet. The
          note stands in for the chart rather than dropping the takeover, so
          the rail and the clock stay on the tablet through the gap. */}
      {geoHostView === null || currentPrompt === null ? (
        <p className={styles.mapFallback}>
          {hostGeoSurfaceCopy.waitingPromptLabel}
        </p>
      ) : (
        <>
          <div className={styles.map}>
            {isBrowser ? (
              <Suspense
                fallback={
                  <div className={styles.mapFallback}>
                    {hostGeoSurfaceCopy.mapLoadingLabel}
                  </div>
                }
              >
                <GeoGuessMap
                  guess={geoHostView.currentGuess}
                  answer={answer}
                  onSelectLocation={(lat, lng): void => {
                    onDispatchAction("setGuess", { lat, lng });
                  }}
                />
              </Suspense>
            ) : (
              <div className={styles.mapFallback}>
                {hostGeoSurfaceCopy.mapLoadingLabel}
              </div>
            )}
          </div>
          <GeoPlate currentPrompt={currentPrompt} serverOrigin={serverOrigin} />
        </>
      )}
    </TakeoverCanvas>
  );
};
