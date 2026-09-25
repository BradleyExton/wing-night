import {
  CLIENT_TO_SERVER_EVENTS,
  CONFIG_ACTIONS,
  CONFIG_ERROR_CODES,
  Phase,
  type ConfigResultPayload,
  type ConfigSavePayload
} from "@wingnight/shared";

import { getRoomStateSnapshot } from "../../../roomState/index.js";
import type { ConfigEventContext } from "../index.js";

// The apply handler, on its own because it is the one config event that
// orchestrates: a save, then a re-seed that has to run inside the broadcast
// dispatch's window. Its sibling read and save are one-liners in the table.
export const handleConfigApply = (
  payload: ConfigSavePayload,
  context: ConfigEventContext
): void => {
  // Saves stay legal past SETUP so next week's config can be prepped mid-night;
  // apply does not, because re-seeding room state mid-game would move the
  // ground under a running round. Reset Game is the escape hatch.
  if (getRoomStateSnapshot().phase !== Phase.SETUP) {
    context.emitConfigResult({
      action: CONFIG_ACTIONS.APPLY,
      ok: false,
      code: CONFIG_ERROR_CODES.LOCKED,
      message: "Config can only be applied during SETUP. Reset the game first.",
      issues: []
    });
    return;
  }

  const saveResult = context.configService.save(payload.files);

  if (!saveResult.ok) {
    context.emitConfigResult({ ...saveResult, action: CONFIG_ACTIONS.APPLY });
    return;
  }

  // The re-seed has to run INSIDE the dispatch's thunk. `applyRoomStateMutation`
  // clears its mutation flag on entry and reads it the instant the thunk
  // returns, so a reload run before or after this call would raise the flag
  // with nobody reading it — room state would change and neither host nor
  // display would hear about it. Held in an object because the compiler cannot
  // see that the callback runs synchronously.
  const applyOutcome: { result: ConfigResultPayload } = {
    result: {
      action: CONFIG_ACTIONS.APPLY,
      ok: false,
      code: CONFIG_ERROR_CODES.LOAD_FAILED,
      message: "Config reload did not run.",
      issues: []
    }
  };

  context.dispatchAuthorizedMutation(
    CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY,
    payload,
    () => {
      applyOutcome.result = context.configService.reload();
      return getRoomStateSnapshot();
    }
  );

  context.emitConfigResult(applyOutcome.result);
};
