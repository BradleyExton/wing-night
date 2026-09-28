import type {
  MinigameDevManifest,
  MinigameRuntimePlugin,
  SerializableValue
} from "@wingnight/minigames-core";

/**
 * Boots the same pure runtime plugin the server drives during a real game, seeded with the
 * manifest the sandbox resolved — the live content pack when the server could be reached, the
 * package's bundled fixture otherwise. `roundMemory` is what the turn before handed on, the way
 * the server passes it at the top of a team's turn.
 */
export const initializeRuntimeState = (
  runtimePlugin: MinigameRuntimePlugin,
  devManifest: MinigameDevManifest,
  activeRoundTeamId: string | null,
  roundMemory: SerializableValue | null = null
): SerializableValue => {
  return runtimePlugin.initialize({
    teamIds: [...devManifest.teamIds],
    players: devManifest.players.map((player) => ({ ...player })),
    teams: devManifest.teams.map((team) => ({ ...team, playerIds: [...team.playerIds] })),
    activeRoundTeamId,
    pointsMax: devManifest.pointsMax,
    pendingPointsByTeamId: { ...devManifest.pendingPointsByTeamId },
    rules: devManifest.rules,
    content: devManifest.content,
    roundMemory
  });
};

/** What the turn just played would leave for the next team, the way the server hands it on. */
export const selectRoundMemory = (
  runtimePlugin: MinigameRuntimePlugin,
  devManifest: MinigameDevManifest,
  state: SerializableValue
): SerializableValue | null => {
  return (
    runtimePlugin.selectRoundMemory?.({
      state,
      rules: devManifest.rules,
      content: devManifest.content
    }) ?? null
  );
};
