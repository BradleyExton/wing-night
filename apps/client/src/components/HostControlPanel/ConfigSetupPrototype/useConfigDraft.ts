// PROTOTYPE (throwaway) — local draft over the game config with a stubbed
// apply. No server writes exist; apply only stamps a timestamp and logs.
import { useEffect, useRef, useState } from "react";
import type { GameConfigFile, GameConfigRound, MinigameType } from "@wingnight/shared";

import { useHostRoomState } from "../../../context/RoomStateContext";
import { buildSampleDraft, type ConfigDraft } from "./sampleDraft";

export type ConfigDraftApi = {
  draft: ConfigDraft;
  isDirty: boolean;
  lastAppliedAt: string | null;
  apply: () => void;
  discard: () => void;
  setGameConfig: (patch: Partial<GameConfigFile>) => void;
  setRound: (index: number, patch: Partial<GameConfigRound>) => void;
  addRound: () => void;
  removeRound: (index: number) => void;
  moveRound: (index: number, direction: -1 | 1) => void;
  setTimer: (timerKey: keyof GameConfigFile["timers"], seconds: number) => void;
  setRule: (rulesKey: "trivia" | "geo", ruleKey: string, value: number) => void;
  addPlayer: (name: string) => void;
  removePlayer: (index: number) => void;
  addTeam: (name: string) => void;
  removeTeam: (index: number) => void;
  setTriviaPrompt: (index: number, patch: { question?: string; answer?: string }) => void;
  addTriviaPrompt: () => void;
  removeTriviaPrompt: (index: number) => void;
};

const renumberRounds = (rounds: GameConfigRound[]): GameConfigRound[] => {
  return rounds.map((round, index) => ({ ...round, round: index + 1 }));
};

const NEXT_MINIGAME: Record<MinigameType, MinigameType> = {
  TRIVIA: "GEO",
  GEO: "DRAWING",
  DRAWING: "TRIVIA"
};

export const useConfigDraft = (options: { autoApply: boolean }): ConfigDraftApi => {
  const roomState = useHostRoomState();
  const [draft, setDraft] = useState<ConfigDraft>(buildSampleDraft);
  const [savedSerialized, setSavedSerialized] = useState<string>(() =>
    JSON.stringify(buildSampleDraft())
  );
  const [lastAppliedAt, setLastAppliedAt] = useState<string | null>(null);
  const touchedRef = useRef(false);
  const adoptedRef = useRef(false);

  // Adopt live room state once, if the user hasn't started editing the fixture.
  useEffect(() => {
    if (adoptedRef.current || touchedRef.current || roomState?.gameConfig == null) {
      return;
    }

    adoptedRef.current = true;
    const liveGameConfig = roomState.gameConfig;
    const livePlayerNames = roomState.players.map((player) => player.name);
    const liveTeamNames = roomState.teams.map((team) => team.name);
    setDraft((previous) => {
      const adopted: ConfigDraft = {
        ...previous,
        gameConfig: structuredClone(liveGameConfig),
        playerNames: livePlayerNames,
        teamNames: liveTeamNames
      };
      setSavedSerialized(JSON.stringify(adopted));
      return adopted;
    });
  }, [roomState]);

  const isDirty = JSON.stringify(draft) !== savedSerialized;

  const apply = (): void => {
    setSavedSerialized(JSON.stringify(draft));
    setLastAppliedAt(new Date().toLocaleTimeString());
    console.info("[ConfigSetupPrototype] apply (stub — no server write)", draft);
  };

  // Live-apply mode (variant B): debounce-apply every dirty change.
  useEffect(() => {
    if (!options.autoApply || !isDirty) {
      return;
    }

    const timeoutId = setTimeout(apply, 450);
    return (): void => {
      clearTimeout(timeoutId);
    };
  });

  const update = (mutate: (previous: ConfigDraft) => ConfigDraft): void => {
    touchedRef.current = true;
    setDraft((previous) => mutate(structuredClone(previous)));
  };

  return {
    draft,
    isDirty,
    lastAppliedAt,
    apply,
    discard: (): void => {
      setDraft(JSON.parse(savedSerialized) as ConfigDraft);
    },
    setGameConfig: (patch): void => {
      update((d) => ({ ...d, gameConfig: { ...d.gameConfig, ...patch } }));
    },
    setRound: (index, patch): void => {
      update((d) => {
        d.gameConfig.rounds[index] = { ...d.gameConfig.rounds[index], ...patch };
        return d;
      });
    },
    addRound: (): void => {
      update((d) => {
        const nextIndex = d.gameConfig.rounds.length + 1;
        const previousRound = d.gameConfig.rounds[d.gameConfig.rounds.length - 1];
        d.gameConfig.rounds.push({
          round: nextIndex,
          label: `Round ${nextIndex}`,
          sauce: "House Sauce",
          pointsPerPlayer: previousRound?.pointsPerPlayer ?? 2,
          minigame: NEXT_MINIGAME[previousRound?.minigame ?? "DRAWING"]
        });
        return d;
      });
    },
    removeRound: (index): void => {
      update((d) => {
        d.gameConfig.rounds.splice(index, 1);
        d.gameConfig.rounds = renumberRounds(d.gameConfig.rounds);
        return d;
      });
    },
    moveRound: (index, direction): void => {
      update((d) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= d.gameConfig.rounds.length) {
          return d;
        }
        const [moved] = d.gameConfig.rounds.splice(index, 1);
        d.gameConfig.rounds.splice(targetIndex, 0, moved);
        d.gameConfig.rounds = renumberRounds(d.gameConfig.rounds);
        return d;
      });
    },
    setTimer: (timerKey, seconds): void => {
      update((d) => {
        d.gameConfig.timers = { ...d.gameConfig.timers, [timerKey]: seconds };
        return d;
      });
    },
    setRule: (rulesKey, ruleKey, value): void => {
      update((d) => {
        d.gameConfig.minigameRules = {
          ...d.gameConfig.minigameRules,
          [rulesKey]: { ...d.gameConfig.minigameRules?.[rulesKey], [ruleKey]: value }
        };
        return d;
      });
    },
    addPlayer: (name): void => {
      update((d) => ({ ...d, playerNames: [...d.playerNames, name] }));
    },
    removePlayer: (index): void => {
      update((d) => {
        d.playerNames.splice(index, 1);
        return d;
      });
    },
    addTeam: (name): void => {
      update((d) => ({ ...d, teamNames: [...d.teamNames, name] }));
    },
    removeTeam: (index): void => {
      update((d) => {
        d.teamNames.splice(index, 1);
        return d;
      });
    },
    setTriviaPrompt: (index, patch): void => {
      update((d) => {
        d.triviaPrompts[index] = { ...d.triviaPrompts[index], ...patch };
        return d;
      });
    },
    addTriviaPrompt: (): void => {
      update((d) => ({
        ...d,
        triviaPrompts: [
          ...d.triviaPrompts,
          { id: `new-${d.triviaPrompts.length + 1}`, question: "", answer: "" }
        ]
      }));
    },
    removeTriviaPrompt: (index): void => {
      update((d) => {
        d.triviaPrompts.splice(index, 1);
        return d;
      });
    }
  };
};
