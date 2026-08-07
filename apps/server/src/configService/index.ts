import {
  CONFIG_ACTIONS,
  CONFIG_ERROR_CODES,
  type ConfigAction,
  type ConfigFileEdit,
  type ConfigResultPayload,
  type ValidationIssue
} from "@wingnight/shared";

import { writeContentFiles } from "../contentWriter/index.js";
import { readConfigContent } from "../readConfigContent/index.js";
import { reloadContentIntoRoomState } from "../reloadContentIntoRoomState/index.js";

type ConfigServiceOptions = {
  contentRootDir?: string;
};

// The three content operations behind the config:* events, each returning a
// ready-to-emit reply. They are flat rather than composed (apply is not
// `save().then(reload())` here) because the caller has to interleave them with
// the broadcast dispatch: the re-seed must run INSIDE the mutation window or
// nothing broadcasts. So the handler orchestrates; this owns the work.
export type ConfigService = {
  read: () => ConfigResultPayload;
  save: (files: ConfigFileEdit[]) => ConfigResultPayload;
  reload: () => ConfigResultPayload;
};

const toInvalidResult = (
  action: ConfigAction,
  issues: ValidationIssue[]
): ConfigResultPayload => {
  return {
    action,
    ok: false,
    code: CONFIG_ERROR_CODES.INVALID,
    message: "Content failed validation; nothing was written.",
    issues
  };
};

export const createConfigService = (
  options: ConfigServiceOptions = {}
): ConfigService => {
  return {
    read: (): ConfigResultPayload => {
      const result = readConfigContent(options);

      if (!result.ok) {
        return {
          action: CONFIG_ACTIONS.READ,
          ok: false,
          code: CONFIG_ERROR_CODES.LOAD_FAILED,
          message: result.reason,
          issues: []
        };
      }

      return { action: CONFIG_ACTIONS.READ, ok: true, content: result.content };
    },

    save: (files): ConfigResultPayload => {
      const writeResult = writeContentFiles(files, options);

      if (!writeResult.ok) {
        return toInvalidResult(CONFIG_ACTIONS.SAVE, writeResult.issues);
      }

      return { action: CONFIG_ACTIONS.SAVE, ok: true, content: null };
    },

    reload: (): ConfigResultPayload => {
      const reloadResult = reloadContentIntoRoomState(options);

      if (!reloadResult.ok) {
        return {
          action: CONFIG_ACTIONS.APPLY,
          ok: false,
          code: CONFIG_ERROR_CODES.LOAD_FAILED,
          message: reloadResult.reason,
          issues: []
        };
      }

      // Apply reports the content it just loaded, so the wizard's view and the
      // room agree without a second round trip.
      const readResult = readConfigContent(options);

      return {
        action: CONFIG_ACTIONS.APPLY,
        ok: true,
        content: readResult.ok ? readResult.content : null
      };
    }
  };
};
