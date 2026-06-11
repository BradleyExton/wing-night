import { lazy, Suspense } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import type { GeoMinigameHostView } from "@wingnight/shared";

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

const GeoPromptCard = ({
  currentPrompt
}: {
  currentPrompt: NonNullable<GeoMinigameHostView["currentPrompt"]>;
}): JSX.Element => {
  return (
    <div className={styles.promptShell}>
      <img
        className={styles.promptImage}
        src={currentPrompt.imageSrc}
        alt={currentPrompt.title}
      />
      <div className={styles.promptBody}>
        <p className={styles.promptTitle}>{currentPrompt.title}</p>
        {currentPrompt.hint !== undefined && (
          <p className={styles.promptHint}>
            {hostGeoSurfaceCopy.hintLabel(currentPrompt.hint)}
          </p>
        )}
      </div>
    </div>
  );
};

const GeoGuessSection = ({
  geoHostView,
  canDispatchAction,
  onDispatchAction
}: Pick<MinigameHostRendererProps, "canDispatchAction" | "onDispatchAction"> & {
  geoHostView: GeoMinigameHostView;
}): JSX.Element => {
  const canSubmitGuess = canDispatchAction && geoHostView.currentGuess !== null;
  const mapFallback = (
    <div className={styles.mapFallback}>{hostGeoSurfaceCopy.mapLoadingLabel}</div>
  );

  return (
    <>
      <div className={styles.mapShell}>
        {isBrowser ? (
          <Suspense fallback={mapFallback}>
            <GeoGuessMap
              guess={geoHostView.currentGuess}
              onSelectLocation={(lat, lng): void => {
                onDispatchAction("setGuess", { lat, lng });
              }}
            />
          </Suspense>
        ) : (
          mapFallback
        )}
      </div>
      <p className={styles.mapInstruction}>
        {hostGeoSurfaceCopy.mapInstructionLabel}
      </p>
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
    </>
  );
};

export const HostGeoSurface = ({
  phase,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  canDispatchAction,
  onDispatchAction
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
  const promptNumber = Math.min(promptsCompleted + 1, promptsPerTurn);
  const shouldRenderGuessSection =
    isPlayPhase && geoHostView !== null && !isSubmitted && currentPrompt !== null;

  return (
    <div className={styles.container}>
      <div>
        <p className={styles.description}>
          {isPlayPhase
            ? hostGeoSurfaceCopy.playDescription
            : hostGeoSurfaceCopy.introDescription}
        </p>
        <div className={styles.meta}>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>
              {hostGeoSurfaceCopy.activeTeamMetaLabel}
            </p>
            <p className={styles.metaValue}>{resolvedActiveTeamName}</p>
          </div>
          {isPlayPhase && promptsPerTurn > 0 && (
            <div className={styles.metaBlock}>
              <p className={styles.metaLabel}>
                {hostGeoSurfaceCopy.promptProgressMetaLabel}
              </p>
              <p className={styles.metaValue}>
                {hostGeoSurfaceCopy.promptProgressLabel(
                  promptNumber,
                  promptsPerTurn
                )}
              </p>
            </div>
          )}
        </div>
      </div>
      {isPlayPhase && currentPrompt === null && (
        <p className={styles.statusNote}>{hostGeoSurfaceCopy.waitingPromptLabel}</p>
      )}
      {isPlayPhase && currentPrompt !== null && (
        <GeoPromptCard currentPrompt={currentPrompt} />
      )}
      {shouldRenderGuessSection && geoHostView !== null && (
        <GeoGuessSection
          geoHostView={geoHostView}
          canDispatchAction={canDispatchAction}
          onDispatchAction={onDispatchAction}
        />
      )}
      {isPlayPhase && isSubmitted && geoHostView?.lastResult != null && (
        <div className={styles.resultCard}>
          <div className={styles.resultBlock}>
            <p className={styles.resultLabel}>
              {hostGeoSurfaceCopy.resultDistanceLabel}
            </p>
            <p className={styles.resultValue}>
              {hostGeoSurfaceCopy.resultDistanceValue(
                geoHostView.lastResult.distanceKm
              )}
            </p>
          </div>
          <div className={styles.resultBlock}>
            <p className={styles.resultLabel}>
              {hostGeoSurfaceCopy.resultPointsLabel}
            </p>
            <p className={styles.resultValue}>
              {hostGeoSurfaceCopy.resultPointsValue(
                geoHostView.lastResult.pointsAwarded
              )}
            </p>
          </div>
        </div>
      )}
      {isPlayPhase && isSubmitted && !isTurnComplete && (
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
      )}
      {isPlayPhase && isTurnComplete && (
        <p className={styles.statusNote}>{hostGeoSurfaceCopy.turnCompleteLabel}</p>
      )}
    </div>
  );
};
