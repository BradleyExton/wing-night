import { useEffect, useRef } from "react";
import { resolveSfxTakesUrl, type BrawlHazardKind } from "@wingnight/shared";
import { useGameSoundboard } from "@wingnight/surface";

import { BRAWL_SFX_FOLDER, createBrawlSoundboard } from "../audio/index.js";
import { createCrewEventReader } from "../crewEvents/index.js";
import type { CrewStreet } from "../useCrewFrame/index.js";
import { resolveCrewCues, type CrewSoundMemory } from "./resolveCrewCues/index.js";

type CrewSoundsInput = {
  street: CrewStreet;
  /** The block's hazard: a dunk into the bay splashes, one over a railing clatters. */
  hazard: BrawlHazardKind | null;
  serverOrigin: string | null;
  // False on a tablet with a TV beside it: the TV is the room's speaker, so the tablet asks for
  // no takes and plays nothing. True on the TV, and on a surface playing solo.
  isSpeaker?: boolean;
};

/**
 * The room's sound for the street, on the TV only (docs/minigames/brawl-crew-spec.md §0.7): every
 * frame this screen draws is listened to, and what it says happened is rung through BRAWL's
 * board. A screen is handed the same event in dozens of frames — the server's, and its own
 * copies stepped between them — so the events go through a reader that hands each out once
 * (`createCrewEventReader`), and everything else is rung on a change, never on a state.
 */
export const useCrewSounds = ({ street, hazard, serverOrigin, isSpeaker = true }: CrewSoundsInput): void => {
  const play = useGameSoundboard({
    createBoard: createBrawlSoundboard,
    takesUrl: resolveSfxTakesUrl(BRAWL_SFX_FOLDER, serverOrigin),
    isSpeaker
  });
  const hazardNow = useRef(hazard);

  hazardNow.current = hazard;

  useEffect(() => {
    const events = createCrewEventReader();
    let memory: CrewSoundMemory | null = null;

    const listen = (): void => {
      const frame = street.read();

      if (frame === null) {
        return;
      }

      const key = street.key();
      const heard = resolveCrewCues(memory, key, frame, events.read(key, frame), hazardNow.current);

      memory = heard.memory;

      for (const { cue, intensity } of heard.cues) {
        play(cue, intensity);
      }
    };

    listen();

    return street.subscribe(listen);
  }, [street, play]);
};
