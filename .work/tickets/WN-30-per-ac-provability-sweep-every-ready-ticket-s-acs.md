---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-30
title: "Per-AC provability sweep: every ready ticket's ACs name their proof (three-lane policy)"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: chore
priority: high
created: 2026-08-16

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []                 # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed = opt-out brake (park for `work approve`); unset => auto-land
# needs_prototype: false # true => prototype must complete before in-progress; default false
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
---

## Goal
Sweep every `ready`/`in-progress` ticket's Acceptance Criteria so each AC names where its proof
lives or carries an explicit `*Proof: judgment-only*` mark — clearing wing-night's 32 unproven-AC
warnings (measured 2026-08-16 under CDS-184's report mode) BEFORE the shared `work
check-acceptance` tooling flips per-AC provability to hard-fail (CDS-185 in claude-dev-system,
which is `blocked_by` this ticket). Without this sweep, the flip turns wing-night's readiness
check red on six ready tickets at once.

## Acceptance Criteria
- [ ] Every unproven AC in a `ready`/`in-progress` ticket is resolved by exactly one of THREE
      lanes — (1) the ticket's own body already names where the proof lives → the AC gains that
      reference; (2) the AC is genuinely judgment-graded → it gains `*Proof: judgment-only*`;
      (3) neither → the AC is left untouched and its ticket is **demoted to `needs-planning`**
      with a Progress note. **Inventing a proof is forbidden** — an invented proof classifies
      `proven` forever and permanently blinds the hard-fail flip. *Proof: judgment-graded* — the
      sweep diff shows which lane each AC took; demotions are visible as status flips.
- [ ] Baseline to clear (measured 2026-08-16, may drift): 32 warnings — WN-20 ×4 (ACs 4,6,7,8),
      WN-21 ×3, WN-22 ×4, WN-24 ×6, WN-27 ×5, WN-28 ×10. Post-sweep,
      `work check-acceptance .work/tickets` (via this project's WORK_CLI) prints **zero**
      unproven-AC warnings and exits 0; output pasted into `## Evidence`.
- [ ] The full default verify gate from this project's manifest passes after the sweep (ticket
      edits only, but the gate is the finish line): every present manifest `verify` key runs
      green; output in `## Evidence`.

## Plan
_To be grilled by a wing-night plan-work session — this stub was minted from the
claude-dev-system gate1-mechanization initiative (CDS-184/185) on 2026-08-16._

Context a planner needs:
- CDS-184 (landed in claude-dev-system @ 7a70fcd2) made `work check-acceptance` classify EVERY
  AC as proven / judgment / unproven and report unproven ones as warnings (exit code unchanged —
  report mode). CDS-185 will make unproven ACs a hard FAIL; it is `blocked_by` this sweep.
- The three-lane policy and its rationale live in CDS-185's AC2 (claude-dev-system
  `.work/tickets/CDS-185-…md`) — lane 3 (demote, never invent) is load-bearing: wing-night's ACs
  are mostly behavioral UI/physics criteria where "mark it judgment-only" is the path of least
  resistance, and an over-broad mark permanently blinds the flip for that AC.
- WN-20's four offenders deserve special care: it is the only ticket that has failed gate1 twice,
  and its second kill (AC6, the anthem state machine with no named check) is the exact shape this
  sweep exists to catch. If its ACs cannot name real proofs, lane 3 (demote) is the honest answer.
- Judgment marks must match the checker's tokens: `judgment-only` or `judgment-graded` (literal),
  canonical form `*Proof: judgment-only*`.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- claude-dev-system CDS-184 (report mode, landed) / CDS-185 (the hard-fail flip this blocks).
- docs/ticket-readiness.md §3 item (h) in claude-dev-system — the rubric item being mechanized.
- Wing-night gate1 analysis 2026-08-16: 73% first-attempt rejection; category B = missing per-AC
  proof (WN-9, WN-23, WN-26, WN-20 twice).
