import { useState } from "react";
import type {
  MinigameDevManifest,
  MinigameRendererBundle,
  MinigameRuntimePlugin,
  MinigameSurfacePhase,
  SerializableValue
} from "@wingnight/minigames-core";
import { Phase, resolveMinigameDefinition, type MinigameType } from "@wingnight/shared";

import { hostCopy } from "../../../copy/host";
import { HostActionBarSurface } from "../../HostControlPanel/HostActionBarSurface";
import { HostTakeoverDock } from "../../HostControlPanel/HostTakeoverDock";
import { MinigameSurface } from "../../HostControlPanel/MinigameSurface";
import { SandboxControls } from "../SandboxControls";
import { SandboxDeviceFrame } from "../SandboxDeviceFrame";
import { minigameDevSandboxCopy } from "../copy";
import * as styles from "./styles";

type SandboxStageProps = {
  minigameType: MinigameType;
  devManifest: MinigameDevManifest;
  rendererBundle: MinigameRendererBundle;
  runtimePlugin: MinigameRuntimePlugin;
  serverOrigin: string | null;
};

// The app has no router — App.tsx reads window.location.pathname once — so
// switching games is a real navigation. The reload is the point: it re-seeds
// the runtime from the target game's manifest.
const navigateToMinigameSandbox = (minigameType: MinigameType): void => {
  const { slug } = resolveMinigameDefinition(minigameType);

  window.location.assign(`/dev/minigame/${slug}`);
};

// What each preview stands in for, in CSS pixels. The host is a 4:3 tablet in
// landscape (an iPad's 1024×768 logical points); the display is a 1080p TV.
const HOST_DEVICE = { width: 1024, height: 768 } as const;
const DISPLAY_DEVICE = { width: 1920, height: 1080 } as const;

// The frame shows the CTA the real shell pins under this phase, so the
// minigame is judged against the canvas it actually gets. The sandbox has no
// game to advance, so the button is inert.
const HOST_SHELL_PHASE_BY_SURFACE_PHASE: Record<MinigameSurfacePhase, Phase> = {
  intro: Phase.MINIGAME_INTRO,
  play: Phase.MINIGAME_PLAY
};

// The sandbox has no game to advance, so the shell's host controls are inert.
const noop = (): void => {};

const resolveHostShellCtaLabel = (phase: MinigameSurfacePhase): string => {
  return hostCopy.primaryActionLabel(HOST_SHELL_PHASE_BY_SURFACE_PHASE[phase], {
    hasNextRoundTurn: false,
    hasAdditionalRounds: false
  });
};

// Boots the same pure runtime plugin the server drives during a real game,
// seeded with the manifest the sandbox resolved — the live content pack when
// the server could be reached, the package's bundled fixture otherwise.
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

// The seeded half of the sandbox: everything downstream of one manifest.
// Mounted under a key that changes when the manifest source does, so a pack
// arriving mid-session re-seeds the runtime the way a fresh navigation would
// — team ids differ between the fixture and the pack, and a half-played turn
// belongs to neither.
export const SandboxStage = ({
  minigameType,
  devManifest,
  rendererBundle,
  runtimePlugin,
  serverOrigin
}: SandboxStageProps): JSX.Element => {
  const [phase, setPhase] = useState<MinigameSurfacePhase>("play");
  // Whose turn the sandbox is playing. A turn-based game hands each team its own content — JOUST
  // picks its lane by the team's slot in the turn order — so this is how the sandbox reaches any
  // of it without a full game running.
  const [activeTeamId, setActiveTeamId] = useState<string | null>(
    devManifest.activeRoundTeamId
  );
  const [runtimeState, setRuntimeState] = useState<SerializableValue>(() => {
    return initializeRuntimeState(
      runtimePlugin,
      devManifest,
      devManifest.activeRoundTeamId
    );
  });

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
  const { DisplaySurface } = rendererBundle;

  return (
    <>
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
        <div className={styles.previewCard}>
          <header className={styles.previewHeader}>
            <span className={styles.previewHeaderLabel}>
              {minigameDevSandboxCopy.hostPreviewLabel}
            </span>
            <span className={styles.previewHeaderMeta}>
              {minigameDevSandboxCopy.hostPreviewMetaLabel}
            </span>
          </header>
          <SandboxDeviceFrame
            frameClassName={styles.hostViewport}
            deviceWidth={HOST_DEVICE.width}
            deviceHeight={HOST_DEVICE.height}
          >
            <div className={styles.hostShell}>
              <div className={styles.hostCanvas}>
                <MinigameSurface
                  phase={phase}
                  minigameType={minigameType}
                  minigameHostView={minigameHostView}
                  activeTeamName={activeTeamName}
                  teamNameByTeamId={teamNameByTeamId}
                  canDispatchAction
                  onDispatchAction={handleDispatchAction}
                />
              </div>
              {phase === "play" ? (
                <HostTakeoverDock
                  primaryActionLabel={resolveHostShellCtaLabel(phase)}
                  primaryActionDisabled
                  showOverridesAction={false}
                  overridesNeedAttention={false}
                  onOpenOverrides={noop}
                />
              ) : (
                <HostActionBarSurface
                  nextPhaseDisabled
                  primaryButtonLabel={resolveHostShellCtaLabel(phase)}
                />
              )}
            </div>
          </SandboxDeviceFrame>
        </div>
        <div className={styles.previewCard}>
          <header className={styles.previewHeader}>
            <span className={styles.previewHeaderLabel}>
              {minigameDevSandboxCopy.displayPreviewLabel}
            </span>
            <span className={styles.previewHeaderMeta}>
              {minigameDevSandboxCopy.displayPreviewMetaLabel}
            </span>
          </header>
          <SandboxDeviceFrame
            frameClassName={styles.displayViewport}
            deviceWidth={DISPLAY_DEVICE.width}
            deviceHeight={DISPLAY_DEVICE.height}
          >
            <div className={styles.displayShell}>
              <DisplaySurface
                phase={phase}
                minigameType={minigameType}
                minigameDisplayView={minigameDisplayView}
                activeTeamName={activeTeamName}
                serverOrigin={serverOrigin}
              />
            </div>
          </SandboxDeviceFrame>
        </div>
      </section>
    </>
  );
};
