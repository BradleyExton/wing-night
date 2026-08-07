import {
  CONFIG_ACTIONS,
  CONFIG_ERROR_CODES,
  type ConfigContentSnapshot,
  type ConfigResultPayload,
  type ValidationIssue
} from "@wingnight/shared";

// Folds a `config:result` emit into the three things the wizard actually
// renders: fresh content to seed from, field-level issues, and a banner.
//
// Every config:* reply rides ONE `config:result` emit discriminated on `ok`
// (the contract rejected an ack callback), so this is the single place a reply
// is interpreted — and the single place `CONFIG_LOCKED` is distinguished from
// an ordinary failure, because locked is not the host's mistake and has its own
// escape hatch.

export type ConfigOutcome = {
  // Present when the server has just read from disk: `read`, and a successful
  // `apply`. Null for a failure and for `save`, which does not re-read.
  content: ConfigContentSnapshot | null;
  issues: ValidationIssue[];
  // The room is past SETUP; applying would move the ground under a live round.
  isLocked: boolean;
  errorMessage: string | null;
  didApply: boolean;
};

export const resolveConfigOutcome = (
  payload: ConfigResultPayload
): ConfigOutcome => {
  if (payload.ok) {
    return {
      content: payload.content,
      issues: [],
      isLocked: false,
      errorMessage: null,
      didApply: payload.action === CONFIG_ACTIONS.APPLY
    };
  }

  return {
    content: null,
    issues: payload.issues,
    isLocked: payload.code === CONFIG_ERROR_CODES.LOCKED,
    errorMessage: payload.message,
    didApply: false
  };
};
