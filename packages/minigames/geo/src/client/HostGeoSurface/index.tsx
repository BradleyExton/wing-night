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

const GeoPromptRow = ({
  currentPrompt
}: {
  currentPrompt: NonNullable<GeoMinigameHostView["currentPrompt"]>;
}): JSX.Element => {
  return (
    <div className={styles.promptRow}>
      <div className={styles.polaroid}>
        <img
          className={styles.polaroidPhoto}
          src={currentPrompt.imageSrc}
          alt={currentPrompt.title}
        />
        <p className={styles.polaroidCaption}>{currentPrompt.title}</p>
      </div>
      {currentPrompt.hint !== undefined && (
        <div className={styles.promptDetails}>
          <p className={styles.promptHint}>
            {hostGeoSurfaceCopy.hintLabel(currentPrompt.hint)}
          </p>
        </div>
      )}
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
      <div className={styles.mapFrame}>
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
      <header className={styles.header}>
        <p className={styles.headerTitle}>{hostGeoSurfaceCopy.logTitle}</p>
        {isPlayPhase && promptsPerTurn > 0 && (
          <p className={styles.headerMeta}>
            {hostGeoSurfaceCopy.exhibitLabel(promptNumber, promptsPerTurn)}
          </p>
        )}
      </header>
      <p className={styles.teamLine}>
        {hostGeoSurfaceCopy.teamPrefix}
        <span className={styles.teamName}>{resolvedActiveTeamName}</span>
      </p>
      {!isPlayPhase && (
        <p className={styles.statusNote}>{hostGeoSurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && currentPrompt === null && (
        <p className={styles.statusNote}>{hostGeoSurfaceCopy.waitingPromptLabel}</p>
      )}
      {isPlayPhase && currentPrompt !== null && (
        <GeoPromptRow currentPrompt={currentPrompt} />
      )}
      {shouldRenderGuessSection && geoHostView !== null && (
        <GeoGuessSection
          geoHostView={geoHostView}
          canDispatchAction={canDispatchAction}
          onDispatchAction={onDispatchAction}
        />
      )}
      {isPlayPhase && isSubmitted && geoHostView?.lastResult != null && (
        <div className={styles.resultRow}>
          <span className={styles.distanceStamp}>
            {hostGeoSurfaceCopy.distanceStamp(geoHostView.lastResult.distanceKm)}
          </span>
          <span className={styles.pointsSeal}>
            <span className={styles.pointsSealValue}>
              {hostGeoSurfaceCopy.pointsSealValue(
                geoHostView.lastResult.pointsAwarded
              )}
            </span>
            <span className={styles.pointsSealLabel}>
              {hostGeoSurfaceCopy.pointsSealLabel}
            </span>
          </span>
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
