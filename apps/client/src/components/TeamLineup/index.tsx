import { useRef } from "react";
import { Character, resolvePlayerAppearance } from "@wingnight/cast";
import { resolvePlayerOutfit, type Player, type TeamTheme } from "@wingnight/shared";

import {
  resolveLineupMoves,
  resolveLineupMovesEndBeat,
  resolveOutfitMove
} from "../../utils/resolveCastMoves";
import { useRoomBeat } from "../../utils/useRoomBeat";
import { useServerOrigin } from "../../utils/useServerOrigin";
import * as styles from "./styles";

type TeamLineupProps = {
  players: Player[];
  theme: TeamTheme;
  /** The caller's height for the row; each bird fills it. */
  sizeClassName: string;
};

// The team's players as `Character`s standing in formation: evenly spaced,
// costume heads and the genre's apparel on, painted in the team colour. Adds
// nothing to `Character` — it is the same bird the lobby strut draws, just
// standing (the cast's `idle` pose: breathing, the odd peck) so the room can
// look at who is up. Decoration; the roster's
// names, where a surface wants them, are its own line.
//
// As the team is introduced, each bird plays its Move once (the wardrobe's
// showpiece motion, docs/research/bird-wardrobe.md §2.6), in seat order, a beat
// after the bird before it: the team goes off as a wave on the room's beat,
// then stands for the briefing.
export const TeamLineup = ({ players, theme, sizeClassName }: TeamLineupProps): JSX.Element | null => {
  // Heads live in the content pack the SERVER serves; `null` on the first
  // paint, and every player wears their drawn head until it resolves.
  const serverOrigin = useServerOrigin();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // A new team on the screen is a new wave, whether or not this lineup was
  // kept mounted between them.
  const { step: beat } = useRoomBeat(containerRef, {
    active: players.length > 0,
    resetKey: `${theme.genre ?? ""}:${players.map((player) => player.id).join(" ")}`,
    beatsPerStep: 1,
    stepLimit: resolveLineupMovesEndBeat(players.length)
  });

  if (players.length === 0) {
    return null;
  }

  const appearances = players.map((player) =>
    resolvePlayerAppearance({ ...player, outfit: resolvePlayerOutfit(player, theme.genre) }, serverOrigin)
  );
  const seats = players.map((player, index) => ({
    name: player.name,
    move: resolveOutfitMove(appearances[index]?.outfit)
  }));
  const plays = beat === null ? [] : resolveLineupMoves(seats, beat);

  return (
    <div ref={containerRef} className={`${styles.container} ${sizeClassName}`} aria-hidden data-team-lineup>
      {players.map((player, index) => (
        <span key={player.id} className={styles.member} data-lineup-member={player.id} data-lineup-move={plays[index]}>
          <Character
            appearance={appearances[index] ?? resolvePlayerAppearance(player, serverOrigin)}
            // The intro lineup is the room's best look at a bird: on show.
            showpieces
            apparel={theme.apparel}
            silhouette={theme.silhouette}
            dance={theme.dance}
            fillClassName={theme.colorVariant.characterFillClassName}
            pose="idle"
            move={plays[index]}
          />
        </span>
      ))}
    </div>
  );
};
