import type { BrawlCrewEvent, BrawlCrewEventKind, BrawlCrewFrame, BrawlGoonState, BrawlHazardKind } from "@wingnight/shared";

import { BRAWL_HONK_GOON_INTENSITY, type BrawlCueName } from "../../audio/index.js";

export type CrewCue = { cue: BrawlCueName; intensity?: number };

/**
 * What the sounds remember of the last frame they heard, to tell a change from a state: each
 * hen's last peck, each goon's place in its script, whether the camera was locked and whether
 * the block had ended. `key` is the fight (`CrewStreet.key`); a new one starts the memory again.
 */
export type CrewSoundMemory = {
  key: string;
  pecks: ReadonlyMap<number, number>;
  goons: ReadonlyMap<number, BrawlGoonState>;
  locked: boolean;
  ended: boolean;
};

/** The cue each thing the sim says happened makes. A wing dropping has no sound of its own: the goon's fall is it. */
const EVENT_CUES: Record<BrawlCrewEventKind, BrawlCueName | null> = {
  hit: "hurt",
  landed: "land",
  ko: "ko",
  clank: "clank",
  dunk: "dunk",
  bump: "bump",
  drop: null,
  wing: "wing",
  down: "down",
  revive: "revive",
  bonus: "clean"
};

const OUTCOME_CUES = { cleared: "handoff", wipe: "bay", timeout: "bell" } as const;

const remember = (key: string, frame: BrawlCrewFrame): CrewSoundMemory => ({
  key,
  pecks: new Map(frame.hens.map((hen) => [hen.slot, hen.peckUntilTick])),
  goons: new Map(frame.goons.map((goon) => [goon.spawnIndex, goon.state])),
  locked: frame.cameraLocked,
  ended: frame.outcome !== null
});

/**
 * The cues one frame makes, and what to remember for the next (docs/minigames/brawl-crew-spec.md
 * §0.7: sound on the TV only, from the frame). Two sources. `events` are the things the sim says
 * happened, already handed out once each (`createCrewEventReader`) — a hit, a peck landing, a
 * hen going down. The rest the sim does not announce, so they are read off the change between
 * two frames: a beak coming out, a goon starting its honk (a swan hisses; the boss honks lowest),
 * the boss stepping on, the camera letting go (GO), and the block's ending.
 *
 * A frame that is the first this screen has seen of a fight makes no sound from a change — a
 * wall that reloads mid-block does not honk for every goose already honking. Pure.
 */
export const resolveCrewCues = (
  memory: CrewSoundMemory | null,
  key: string,
  frame: BrawlCrewFrame,
  events: readonly BrawlCrewEvent[],
  hazard: BrawlHazardKind | null
): { cues: CrewCue[]; memory: CrewSoundMemory } => {
  const cues: CrewCue[] = [];

  for (const event of events) {
    const cue = EVENT_CUES[event.kind];

    if (cue !== null) {
      // Into the bay is a splash; over the railing or onto the plinth, a clatter.
      cues.push({ cue: event.kind === "dunk" && hazard === "bay" ? "splash" : cue });
    }
  }

  if (memory === null || memory.key !== key) {
    return { cues, memory: remember(key, frame) };
  }

  for (const hen of frame.hens) {
    if (hen.peckUntilTick > (memory.pecks.get(hen.slot) ?? hen.peckUntilTick)) {
      cues.push({ cue: "peck" });
    }
  }

  for (const goon of frame.goons) {
    const before = memory.goons.get(goon.spawnIndex);

    if (before === undefined && goon.kind === "boss") {
      cues.push({ cue: "boss" });
    }

    if (goon.state === "telegraph" && before !== "telegraph") {
      cues.push(goon.kind === "swan" ? { cue: "hiss" } : { cue: "honk", intensity: goon.kind === "boss" ? 1 : BRAWL_HONK_GOON_INTENSITY });
    }
  }

  if (frame.outcome === null && memory.locked && !frame.cameraLocked) {
    cues.push({ cue: "go" });
  }

  if (frame.outcome !== null && !memory.ended) {
    cues.push({ cue: OUTCOME_CUES[frame.outcome] });
  }

  return { cues, memory: remember(key, frame) };
};
