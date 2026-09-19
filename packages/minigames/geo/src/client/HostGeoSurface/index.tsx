import { lazy, Suspense } from "react";
import type { MinigameHostRendererProps } from "@wingnight/minigames-core";
import { resolveContentAssetSrc, type GeoMinigameHostView } from "@wingnight/shared";

import { resolveExhibitNumber } from "../resolveExhibitNumber/index.js";
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

const GeoDossier = ({
  currentPrompt,
  serverOrigin
}: {
  currentPrompt: NonNullable<GeoMinigameHostView["currentPrompt"]>;
  serverOrigin: string | null;
}): JSX.Element => {
  return (
    <>
      <div className={styles.polaroid}>
        <img
          className={styles.polaroidPhoto}
          src={resolveContentAssetSrc(currentPrompt.imageSrc, serverOrigin) ?? ""}
          alt={currentPrompt.title}
        />
        <p className={styles.polaroidCaption}>{currentPrompt.title}</p>
      </div>
      {currentPrompt.hint !== undefined && (
        <p className={styles.promptHint}>
          {hostGeoSurfaceCopy.hintLabel(currentPrompt.hint)}
        </p>
      )}
    </>
  );
};

const GeoChart = ({
  geoHostView,
  onDispatchAction
}: Pick<MinigameHostRendererProps, "onDispatchAction"> & {
  geoHostView: GeoMinigameHostView;
}): JSX.Element => {
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
    </>
  );
};

const GeoResult = ({
  lastResult
}: {
  lastResult: NonNullable<GeoMinigameHostView["lastResult"]>;
}): JSX.Element => {
  return (
    <div className={styles.resultPanel}>
      <span className={styles.distanceStamp}>
        {hostGeoSurfaceCopy.distanceStamp(lastResult.distanceKm)}
      </span>
      <span className={styles.pointsSeal}>
        <span className={styles.pointsSealValue}>
          {hostGeoSurfaceCopy.pointsSealValue(lastResult.pointsAwarded)}
        </span>
        <span className={styles.pointsSealLabel}>
          {hostGeoSurfaceCopy.pointsSealLabel}
        </span>
      </span>
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
  const promptNumber = resolveExhibitNumber({
    promptsCompletedThisTurn: promptsCompleted,
    promptsPerTurn,
    isSubmitted
  });
  const lastResult = geoHostView?.lastResult ?? null;
  const isGuessing =
    isPlayPhase && geoHostView !== null && !isSubmitted && currentPrompt !== null;
  const canSubmitGuess =
    canDispatchAction && geoHostView !== null && geoHostView.currentGuess !== null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.headerTitle}>{hostGeoSurfaceCopy.logTitle}</p>
        <p className={styles.teamLine}>
          {hostGeoSurfaceCopy.teamPrefix}
          <span className={styles.teamName}>{resolvedActiveTeamName}</span>
        </p>
        {isPlayPhase && promptsPerTurn > 0 && (
          <p className={styles.headerMeta}>
            {hostGeoSurfaceCopy.exhibitLabel(promptNumber, promptsPerTurn)}
          </p>
        )}
      </header>

      {!isPlayPhase && (
        <p className={styles.statusNote}>{hostGeoSurfaceCopy.introDescription}</p>
      )}
      {isPlayPhase && currentPrompt === null && (
        <p className={styles.statusNote}>{hostGeoSurfaceCopy.waitingPromptLabel}</p>
      )}

      {/* Landscape pairing: the dossier holds still on the left while the chart
          — the thing a player actually works in — takes the rest of the tablet,
          so a turn never needs a scroll. */}
      {isPlayPhase && currentPrompt !== null && (
        <div className={styles.playBody}>
          <div className={styles.dossierColumn}>
            <GeoDossier currentPrompt={currentPrompt} serverOrigin={serverOrigin} />
            {isGuessing && (
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
            )}
            {isSubmitted && !isTurnComplete && (
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
            {isTurnComplete && (
              <p className={styles.dossierNote}>
                {hostGeoSurfaceCopy.turnCompleteLabel}
              </p>
            )}
          </div>
          <div className={styles.chartColumn}>
            {isGuessing && geoHostView !== null && (
              <GeoChart
                geoHostView={geoHostView}
                onDispatchAction={onDispatchAction}
              />
            )}
            {isSubmitted && lastResult !== null && (
              <GeoResult lastResult={lastResult} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
