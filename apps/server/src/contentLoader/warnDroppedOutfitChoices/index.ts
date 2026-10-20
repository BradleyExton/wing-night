import { resolveWornOutfit, type GenreKey, type Player } from "@wingnight/shared";

type WarnDroppedOutfitChoicesInput = {
  players: readonly Player[];
  // Injected for the same reason `filterPromptsByRoster`'s is: the unit layer
  // asserts on what the host is told without patching the console.
  warn?: (message: string) => void;
};

// The loader keeps every outfit as written (`loadPlayers`), so this is where
// the boot says which choices the TV will not draw: an item cut from the
// catalogue since a guest wore it, or one on the wrong rail after a hand edit.
// Every genre is checked, not just the player's current team's, because a
// reseat on the night switches which one is drawn.
export const warnDroppedOutfitChoices = ({
  players,
  warn = (message) => console.warn(message)
}: WarnDroppedOutfitChoicesInput): void => {
  for (const player of players) {
    for (const [genre, outfit] of Object.entries(player.outfits ?? {})) {
      resolveWornOutfit(genre as GenreKey, outfit, (issue) => {
        warn(
          `[content] players: "${player.name}" outfits.${genre}.${issue.path} ${issue.message}; the bird is drawn without it.`
        );
      });
    }
  }
};
