import { execFile } from "node:child_process";
import { existsSync } from "node:fs";

// A bounded wait is what makes the endpoint's "no hang" real. Without it a child
// that starts but never exits — blocked on stdin, waiting on a lock — holds the
// request open forever and the 503 branch below is unreachable.
export const WORK_CLI_TIMEOUT_MS = 10_000;

// Generous: `work index --json` over a few dozen tickets is a few KB, but the
// default 1MB cap would turn a large work-log into an opaque failure.
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export type WorkCliOutcome =
  | { ok: true; value: unknown }
  | { ok: false; reason: string };

export type RunWorkCliOptions = {
  cliPath: string;
  cwd: string;
  args: string[];
  // Injectable so the timeout test can pass a short bound instead of sleeping
  // the full one — the constant above stays the production default.
  timeoutMs?: number;
};

export const runWorkCli = ({
  cliPath,
  cwd,
  args,
  timeoutMs = WORK_CLI_TIMEOUT_MS
}: RunWorkCliOptions): Promise<WorkCliOutcome> => {
  if (!existsSync(cliPath)) {
    return Promise.resolve({ ok: false, reason: "work CLI not found" });
  }

  return new Promise((resolvePromise) => {
    execFile(
      process.execPath,
      [cliPath, ...args],
      { cwd, timeout: timeoutMs, maxBuffer: MAX_OUTPUT_BYTES },
      (error, stdout) => {
        if (error !== null) {
          // `killed` is how Node reports the timeout kill, and it reads very
          // differently from a CLI that exited non-zero on its own.
          resolvePromise({
            ok: false,
            reason: error.killed === true ? "work CLI timed out" : "work CLI failed"
          });

          return;
        }

        try {
          resolvePromise({ ok: true, value: JSON.parse(stdout) });
        } catch {
          resolvePromise({ ok: false, reason: "work CLI returned unparseable JSON" });
        }
      }
    );
  });
};
