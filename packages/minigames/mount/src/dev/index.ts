import { createDevManifest, type MinigameDevAction } from "@wingnight/minigames-core";
import { MOUNT_GOOSE_BOT_SAMPLES } from "@wingnight/shared";

// No content file: the pile starts from a seed in the rules. The sample rules' defaults, so the
// sandbox goose is the night's goose: three players a team, so three climbs of 5 points each, and
// the sandbox's team switch hands the first team's pile to the next (spec §0.9).
export const mountDevManifest = createDevManifest({
  rules: { climbSeconds: 30, secondsPerHen: 3, pileSeed: 20261002 },
  content: null
});

// The goose bot (spec §0.9): the sim is chaotic, so no pointer path replays a mount reliably.
// This feeds the scripted log (`MOUNT_GOOSE_BOT_SAMPLES`, which mounts the bare standing goose on
// tick 458) into the climb in hand as one `limb` batch, stamped for that climb, through the
// sandbox's own reducer — the path every tablet batch takes. The tablet, holding no local climb
// of its own, then reports the climb ended as it does after a reload, and the server's referee
// re-runs the log; the wall replays it from the view. Only offered while the climb in hand is
// untouched, on the round's first pile, where the script is known to mount.
export const MOUNT_GOOSE_BOT_DEV_ACTION_ID = "mount-goose-bot";

export const mountDevActions: readonly MinigameDevAction[] = [
  {
    id: MOUNT_GOOSE_BOT_DEV_ACTION_ID,
    label: "Goose bot: mount the bare goose",
    resolve: (hostView) => {
      if (hostView?.minigame !== "MOUNT" || hostView.phase !== "ready") {
        return null;
      }

      const climb = hostView.climbs[hostView.climbIndex];

      if (climb === undefined || climb.inputs.length > 0) {
        return null;
      }

      return {
        actionType: "limb",
        actionPayload: {
          ...(hostView.activeTurnTeamId === null ? {} : { teamId: hostView.activeTurnTeamId }),
          climbIndex: hostView.climbIndex,
          samples: MOUNT_GOOSE_BOT_SAMPLES.map((sample) => ({ ...sample }))
        }
      };
    }
  }
];
