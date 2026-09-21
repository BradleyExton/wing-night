import { lazy, Suspense } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import { resolveContentAssetSrc, type GeoMinigameHostView } from "@wingnight/shared";

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

const resolveActiveTeamName = ({
  minigameHostView,
  teamNameByTeamId,
  activeTeamName
}: Pick<
  MinigameHostRendererProps,
  "minigameHostView" | "teamNameByTeamId" | "activeTeamName"
>): string => {
  if (minigameHostView?.activeTurnTeamId) {
    return (
      teamNameByTeamId.get(minigameHostView.activeTurnTeamId) ??
      hostGeoSurfaceCopy.noAssignedTeamLabel
    );
  }

  return activeTeamName ?? hostGeoSurfaceCopy.noAssignedTeamLabel;
};

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

const GeoVerdict = ({
  lastResult
}: {
  lastResult: NonNullable<GeoMinigameHostView["lastResult"]>;
}): JSX.Element => {
  const distance = hostGeoSurfaceCopy.distanceValue(lastResult.distanceKm);

  return (
    <div className={styles.verdict}>
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
    </div>
  );
};

export const HostGeoSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction,
  serverOrigin
}: MinigameHostRendererProps): JSX.Element => {
  const geoHostView =
    minigameHostView?.minigame === "GEO" ? minigameHostView : null;
  const resolvedActiveTeamName = resolveActiveTeamName({
    minigameHostView,
    teamNameByTeamId,
    activeTeamName
  });
  const isPlayPhase = phase === "play";
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
  const isGuessing =
    isPlayPhase && geoHostView !== null && !isSubmitted && currentPrompt !== null;
  const canSubmitGuess =
    canDispatchAction && geoHostView !== null && geoHostView.currentGuess !== null;

  if (!isPlayPhase || currentPrompt === null || geoHostView === null) {
    return (
      <div className={styles.introContainer}>
        <p className={styles.statusNote}>
          {isPlayPhase
            ? hostGeoSurfaceCopy.waitingPromptLabel
            : hostGeoSurfaceCopy.introDescription}
        </p>
      </div>
    );
  }

  // The answer only exists on the tablet once the guess is stamped, so the
  // reveal draws itself on the same chart the team just pinned rather than
  // swapping the canvas out from under them.
  const answer =
    isSubmitted && lastResult !== null
      ? { lat: currentPrompt.answerLat, lng: currentPrompt.answerLng }
      : null;

  return (
    <div className={styles.container}>
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

      <div className={styles.rail}>
        <span className={styles.teamChip}>
          <span className={styles.teamChipDot} aria-hidden="true" />
          {resolvedActiveTeamName}
        </span>
        {promptsPerTurn > 0 && (
          <span className={styles.counterChip}>
            {hostGeoSurfaceCopy.photoCounter(photoNumber, promptsPerTurn)}
          </span>
        )}
      </div>

      <GeoPlate currentPrompt={currentPrompt} serverOrigin={serverOrigin} />

      {isGuessing && (
        <div className={styles.actionBar}>
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
        </div>
      )}

      {isSubmitted && !isTurnComplete && (
        <div className={styles.actionBar}>
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
        </div>
      )}

      {isTurnComplete && (
        <p className={styles.turnCompleteNote}>
          {hostGeoSurfaceCopy.turnCompleteLabel}
        </p>
      )}

      {isSubmitted && lastResult !== null && (
        <GeoVerdict lastResult={lastResult} />
      )}
    </div>
  );
};
