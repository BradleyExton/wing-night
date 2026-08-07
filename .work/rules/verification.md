# Verification & evidence

> **Global** process rule — the load-bearing discipline of this system (DESIGN §6). Not file-scoped;
> it governs *how you finish work*, in any language or framework. Pairs with [`testing.md`](testing.md).

**The core finding:** verification is the primary guardrail. Claude stops when the work *looks*
done — so without a check it can run, **you** become the verification loop. Make the machine prove
it instead.

## Every change ends in a machine-checkable step

- A unit of work isn't "done" until a **runnable command** confirms it: `lint` / `typecheck` /
  `build` / a single fast `test`, or a scripted check. The last acceptance-criterion of a ticket
  **must** be that step (SCHEMA §1.2).
- If a change has **no** runnable success check, it is **not** an autonomy candidate — flag it for a
  hands-on session rather than asserting success.
- Prefer **fast** checks: a single-test run over the full suite, a fast typecheck, log-to-file. The
  loop runs checks *repeatedly*; slow tools stall it.

## Evidence, not assertion

- Show the **actual output** — paste the test result / screenshot path / preview URL into the
  ticket's `## Evidence` before flipping to done. "Tests pass" is a claim; the green run is evidence.
- Report faithfully: if a check fails, say so with the output; if a step was skipped, say that.
  Never describe unverified work as verified.

## Don't reward-hack the check

- The check exists to fail when the behaviour breaks. **Never weaken an assertion, delete a case, or
  special-case an input** to force a pass. A grading pass inspects the *test* diff for exactly this
  (DESIGN §6.3).

## Anti-blind-spot

- After a change *looks* complete, find **every other call-site** of the symbols you touched (grep
  the `src_globs`). Anything you never opened is the documented "silently miss the 20% outside
  context" failure — open it before claiming done (DESIGN §6.4).

## Bound the blast radius

- Don't rely on an approval click (humans catch only ~9–26% of bad actions even *with* a gate). Land
  via the project's **`landing` strategy** (preview-pr / direct-main), keep diffs **scoped and
  small**, work in an isolated worktree, and run without production-write credentials (SCHEMA §7,
  DESIGN §6).
