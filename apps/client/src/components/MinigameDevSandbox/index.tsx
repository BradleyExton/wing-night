import { useState } from "react";
import type {
  MinigameDevManifest,
  MinigameRuntimePlugin,
  MinigameSurfacePhase,
  SerializableValue
} from "@wingnight/minigames-core";
import { resolveMinigameDefinition, type MinigameType } from "@wingnight/shared";

import {
  resolveMinigameDevManifest,
  resolveMinigameRendererBundle,
  resolveMinigameRuntimePlugin
} from "../../minigames/registry";
import { useServerOrigin } from "../../utils/useServerOrigin";
import { SandboxControls } from "./SandboxControls";
import { minigameDevSandboxCopy } from "./copy";
import * as styles from "./styles";

type MinigameDevSandboxProps = {
  minigameType: MinigameType;
};

// The app has no router — App.tsx reads window.location.pathname once — so
// switching games is a real navigation. The reload is the point: it re-seeds
// the runtime from the target game's dev fixture.
const navigateToMinigameSandbox = (minigameType: MinigameType): void => {
  const { slug } = resolveMinigameDefinition(minigameType);

  window.location.assign(`/dev/minigame/${slug}`);
};

// Boots the same pure runtime plugin the server drives during a real game,
// seeded with the package's dev fixture (fake teams + sample content).
const initializeRuntimeState = (
  runtimePlugin: MinigameRuntimePlugin,
  devManifest: MinigameDevManifest,
  activeRoundTeamId: string | null
): SerializableValue => {
  return runtimePlugin.initialize({
    teamIds: [...devManifest.teamIds],
    players: devManifest.players.map((player) => ({ ...player })),
    teams: devManifest.teams.map((team) => ({ ...team, playerIds: [...team.playerIds] })),
    activeRoundTeamId,
    pointsMax: devManifest.pointsMax,
    pendingPointsByTeamId: { ...devManifest.pendingPointsByTeamId },
    rules: devManifest.rules,
    content: devManifest.content
  });
};

export const MinigameDevSandbox = ({
  minigameType
}: MinigameDevSandboxProps): JSX.Element => {
  const devManifest = resolveMinigameDevManifest(minigameType);
  const rendererBundle = resolveMinigameRendererBundle(minigameType);
  const runtimePlugin = resolveMinigameRuntimePlugin(minigameType);

  const serverOrigin = useServerOrigin();
  const [phase, setPhase] = useState<MinigameSurfacePhase>("play");
  // Whose turn the sandbox is playing. A turn-based game hands each team its own content — JOUST
  // picks its lane by the team's slot in the turn order — so this is how the sandbox reaches any
  // of it without a full game running.
  const [activeTeamId, setActiveTeamId] = useState<string | null>(
    devManifest?.activeRoundTeamId ?? null
  );
  const [runtimeState, setRuntimeState] = useState<SerializableValue>(() => {
    if (devManifest === null || runtimePlugin === null) {
      return null;
    }

    return initializeRuntimeState(runtimePlugin, devManifest, devManifest.activeRoundTeamId);
  });

  if (devManifest === null || rendererBundle === null || runtimePlugin === null) {
    return (
      <main className={styles.container}>
        <div className={styles.headingBlock}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <p className={styles.description}>
            {rendererBundle === null
              ? minigameDevSandboxCopy.noRendererLabel
              : minigameDevSandboxCopy.noRuntimeLabel}
          </p>
        </div>
      </main>
    );
  }

  const handleDispatchAction = (
    actionType: string,
    actionPayload: SerializableValue
  ): void => {
    setRuntimeState((previousState) =>
      runtimePlugin.reduceAction({
        state: previousState,
        // The sandbox is its own server, so it stamps receipt the way the
        // real one does; a timing-aware reducer runs the same here as there.
        envelope: { actionType, actionPayload, receivedAtMs: Date.now() },
        pointsMax: devManifest.pointsMax,
        rules: devManifest.rules,
        content: devManifest.content
      }).state
    );
  };

  const selectorInput = {
    state: runtimeState,
    rules: devManifest.rules,
    content: devManifest.content
  };
  const minigameHostView = runtimePlugin.selectHostView(selectorInput);
  const minigameDisplayView = runtimePlugin.selectDisplayView(selectorInput);
  const activeTeamName =
    activeTeamId === null ? null : (devManifest.teamNameByTeamId[activeTeamId] ?? null);
  const teamOptions = devManifest.teamIds.map((teamId) => ({
    teamId,
    label: devManifest.teamNameByTeamId[teamId] ?? teamId
  }));
  const teamNameByTeamId = new Map(Object.entries(devManifest.teamNameByTeamId));
  const { HostSurface, DisplaySurface } = rendererBundle;

  return (
    <main className={styles.container}>
      <div className={styles.headingBlock}>
        <div className={styles.headingRow}>
          <h1 className={styles.heading}>{minigameDevSandboxCopy.title}</h1>
          <a
            className={styles.devIndexLink}
            href={minigameDevSandboxCopy.devIndexLinkHref}
          >
            {minigameDevSandboxCopy.devIndexLinkLabel}
          </a>
        </div>
        <p className={styles.description}>{minigameDevSandboxCopy.description}</p>
      </div>

      <SandboxControls
        minigameType={minigameType}
        phase={phase}
        onMinigameTypeChange={navigateToMinigameSandbox}
        onPhaseChange={setPhase}
        teamOptions={teamOptions}
        activeTeamId={activeTeamId}
        onActiveTeamChange={(teamId): void => {
          // Switching team re-seeds the runtime, the same way the server does at the top of that
          // team's turn — a half-played turn is not that team's turn.
          setActiveTeamId(teamId);
          setRuntimeState(initializeRuntimeState(runtimePlugin, devManifest, teamId));
        }}
        onReset={(): void => {
          setRuntimeState(initializeRuntimeState(runtimePlugin, devManifest, activeTeamId));
        }}
      />

      <section className={styles.previewGrid}>
        <div className={`${styles.previewCard} ${styles.hostPreviewCard}`}>
          <header className={styles.previewHeader}>
            <span className={styles.previewHeaderLabel}>
              {minigameDevSandboxCopy.hostPreviewLabel}
            </span>
            <span className={styles.previewHeaderMeta}>
              {minigameDevSandboxCopy.hostPreviewMetaLabel}
            </span>
          </header>
          <div className={styles.hostViewport}>
            <div className={styles.hostViewportSurface}>
              <HostSurface
                phase={phase}
                minigameType={minigameType}
                minigameHostView={minigameHostView}
                activeTeamName={activeTeamName}
                teamNameByTeamId={teamNameByTeamId}
                canDispatchAction
                onDispatchAction={handleDispatchAction}
                serverOrigin={serverOrigin}
              />
            </div>
          </div>
        </div>
        <div className={`${styles.previewCard} ${styles.displayPreviewCard}`}>
          <header className={styles.previewHeader}>
            <span className={styles.previewHeaderLabel}>
              {minigameDevSandboxCopy.displayPreviewLabel}
            </span>
            <span className={styles.previewHeaderMeta}>
              {minigameDevSandboxCopy.displayPreviewMetaLabel}
            </span>
          </header>
          <div className={styles.displayViewport}>
            <div className={styles.displayViewportSurface}>
              <DisplaySurface
                phase={phase}
                minigameType={minigameType}
                minigameDisplayView={minigameDisplayView}
                activeTeamName={activeTeamName}
                serverOrigin={serverOrigin}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
