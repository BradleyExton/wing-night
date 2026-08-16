import assert from "node:assert/strict";
import { mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { WORK_CLI_TIMEOUT_MS, runWorkCli } from "./index.js";

const writeFakeCli = (name: string, source: string): string => {
  const directory = mkdtempSync(join(tmpdir(), "wn26-work-cli-"));
  const path = join(directory, name);

  writeFileSync(path, source, "utf8");

  return path;
};

test("returns the parsed payload when the CLI prints JSON", async () => {
  const cliPath = writeFakeCli(
    "ok.mjs",
    'process.stdout.write(JSON.stringify({ ok: true, tickets: [] }));'
  );

  const outcome = await runWorkCli({ cliPath, cwd: process.cwd(), args: [] });

  assert.deepEqual(outcome, { ok: true, value: { ok: true, tickets: [] } });
});

test("passes its args through to the CLI", async () => {
  const cliPath = writeFakeCli(
    "args.mjs",
    'process.stdout.write(JSON.stringify(process.argv.slice(2)));'
  );

  const outcome = await runWorkCli({
    cliPath,
    cwd: process.cwd(),
    args: ["index", "--json"]
  });

  assert.deepEqual(outcome, { ok: true, value: ["index", "--json"] });
});

// AC#1 pins the spawn's cwd, not just the CLI path: from a worktree build
// checkout the two roots carry different `.work/tickets`, so a cwd the caller
// did not choose would render a different work-log than the one resolved.
test("runs the CLI in the cwd it was given", async () => {
  const cliPath = writeFakeCli("cwd.mjs", 'process.stdout.write(JSON.stringify(process.cwd()));');
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), "wn26-cwd-")));

  const outcome = await runWorkCli({ cliPath, cwd, args: [] });

  assert.deepEqual(outcome, { ok: true, value: cwd });
});

test("reports the CLI as missing when the path does not exist", async () => {
  const outcome = await runWorkCli({
    cliPath: join(tmpdir(), "wn26-definitely-absent.ts"),
    cwd: process.cwd(),
    args: []
  });

  assert.deepEqual(outcome, { ok: false, reason: "work CLI not found" });
});

test("reports a failure when the CLI exits non-zero", async () => {
  const cliPath = writeFakeCli("fail.mjs", "process.exit(3);");

  const outcome = await runWorkCli({ cliPath, cwd: process.cwd(), args: [] });

  assert.deepEqual(outcome, { ok: false, reason: "work CLI failed" });
});

test("reports unparseable output rather than throwing", async () => {
  const cliPath = writeFakeCli("garbage.mjs", 'process.stdout.write("not json at all");');

  const outcome = await runWorkCli({ cliPath, cwd: process.cwd(), args: [] });

  assert.deepEqual(outcome, { ok: false, reason: "work CLI returned unparseable JSON" });
});

// The branch the bounded wait exists for: a child that starts and never exits.
// Without the timeout this test would hang forever rather than fail.
test("times out a child that never exits", async () => {
  const cliPath = writeFakeCli("hang.mjs", "setTimeout(() => {}, 60_000);");

  const outcome = await runWorkCli({
    cliPath,
    cwd: process.cwd(),
    args: [],
    timeoutMs: 100
  });

  assert.deepEqual(outcome, { ok: false, reason: "work CLI timed out" });
});

// The injectable bound is a test affordance; production must not silently ship
// a 100ms timeout because a test wanted one.
test("defaults to the named production timeout", () => {
  assert.equal(WORK_CLI_TIMEOUT_MS, 10_000);
});
