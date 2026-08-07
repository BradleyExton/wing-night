import type { MinigameType, RoomState } from "@wingnight/shared";
import { isSerializableValue } from "@wingnight/minigames-core";

import { loadContent } from "../contentLoader/index.js";
import {
  clearRoomStateFatalError,
  getRoomStateSnapshot,
  reportRoomStateMutation,
  setRoomStateGameConfig,
  setRoomStateMinigameContent,
  setRoomStatePlayers,
  setRoomStateTeams
} from "../roomState/index.js";

type ReloadContentOptions = {
  contentRootDir?: string;
};

export type ReloadContentResult =
  | { ok: true; roomState: RoomState }
  | { ok: false; reason: string };

// The one-shot boot sequence, made callable so apply can re-run it.
//
// It returns a result rather than throwing, and that is the whole point of the
// shape: the loaders throw by design (fail-fast on bad content at boot), but
// the two callers want opposite things from a failure. Boot wants the existing
// destructive fatalError path — a server with unloadable content should not
// pretend to be usable. Apply wants a typed error back and its live SETUP
// rosters left alone, because `setRoomStateFatalError` resets the room before
// flagging and would wipe what the host just typed in. Owning the reload here
// and leaving the failure policy to each caller is what lets both be right.
//
// What a FAILED reload guarantees, precisely — it is not all-or-nothing. A
// load failure touches nothing. A failure from one of the setters leaves the
// earlier ones applied, so room state can be partially re-seeded. What is
// guaranteed either way is that no CLIENT ever observes the partial state:
// `reportRoomStateMutation()` is only reached on the success path, so
// `didMutate` stays false, `broadcastAfter` returns early, and nothing is
// emitted. Boot additionally erases any partial re-seed, because
// `setRoomStateFatalError` overwrites the room wholesale.
//
// Which room-state fields a successful reload replaces: `players`, `teams`,
// `gameConfig` (and the `totalRounds` / `currentRoundConfig` it derives), and
// each minigame's content — plus the setup baseline snapshot those setters
// re-sync, so Reset Game stays consistent. It also clears `fatalError`.
// Everything else — phase, scores, timer, turn order — survives untouched.
export const reloadContentIntoRoomState = (
  options: ReloadContentOptions = {}
): ReloadContentResult => {
  // The catch spans the setters as well as the load, matching the boot
  // sequence this replaced: the setters run minigame-runtime sync that can
  // throw on content the validators let through, and a throw there would
  // otherwise escape into a socket.io listener with no handler above it.
  try {
    const { players, teams, gameConfig, minigameContentById } =
      loadContent(options);

    setRoomStatePlayers(players);
    setRoomStateTeams(teams);
    setRoomStateGameConfig(gameConfig);

    for (const [minigameId, minigameContent] of Object.entries(
      minigameContentById
    ) as [MinigameType, unknown][]) {
      if (
        minigameContent === undefined ||
        !isSerializableValue(minigameContent)
      ) {
        continue;
      }

      setRoomStateMinigameContent(minigameId, minigameContent);
    }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error)
    };
  }

  // A reload is the repair path, so it has to work FROM the fatal state.
  clearRoomStateFatalError();

  // The four setters above are plain functions — they never raise the
  // module-scoped flag that `applyRoomStateMutation` reads, so without this
  // call `didMutate` stays false and `socketServer`'s broadcast returns early:
  // host and display would never see the new config. Routing the re-seed
  // through `defineRoomMutation` instead would NOT work, because that helper
  // early-returns while the room is in a fatal state — precisely the case this
  // function exists to repair. So it reports its own mutation, outside that
  // gate. This only reaches a broadcast when the caller runs it inside
  // `applyRoomStateMutation`'s window; `config:apply` does exactly that.
  reportRoomStateMutation();

  return { ok: true, roomState: getRoomStateSnapshot() };
};
