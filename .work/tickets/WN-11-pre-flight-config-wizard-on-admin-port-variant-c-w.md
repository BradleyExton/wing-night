---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-11
title: "Pre-flight config wizard on /admin (port Variant C, wire to config:* events, delete lab)"
status: ready   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-05

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-10, WN-5]      # WN-5 gates the Playwright AC below: until test_one boots its own servers, that spec can go green against a foreign dev server's code

blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed | heads-down; default checkpointed
# needs_prototype: false # true => prototype must complete before in-progress; default false
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
---

## Goal
Ship the pre-flight config wizard as a production /admin route — a port-variant rewrite of the prototype lab's Variant C wired to the config:* events — and delete the throwaway lab.

## Acceptance Criteria
- [ ] `/admin` is a real route in `resolveClientRoute` + `App.tsx` (and `shouldCreateRoomSocket`), claiming HOST on its socket, rendering the five-step wizard: Identity → Lineup → Clocks & Scoring → Roster → Review; steps and apply-at-end semantics match the picked Variant C.
- [ ] The wizard seeds from `config:read` (merged disk content — not room state), edits a local draft, and Review's single action calls `config:apply`; success confirmation and post-apply refreshed snapshot render; a `CONFIG_LOCKED` rejection renders the locked state with the reset-game escape hatch named.
- [ ] Validation issues returned from save/apply map inline to their fields via the issue `path` (e.g. `rounds[1].sauce` highlights that input); Review is blocked while local validation fails.
- [ ] Prompt-pack scope (user-confirmed): trivia and drawing packs editable; geo shown as a read-only count with a `pnpm import:geo` pointer.
- [ ] This is a proper rewrite composing HostControlPanel styleTokens + house component idiom (styles.ts siblings, copy module, sr-only labels) — NOT a verbatim lab copy; the `ConfigSetupPrototype/` folder and its gate in `HostControlPanel/index.tsx` are deleted in the same change.
- [ ] One Playwright spec covers the happy path (open /admin, edit a round label, apply, assert display/host see the new label) and the locked rejection; `pnpm test:e2e <that spec>` (manifest `test_one`) passes.
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Plan
Grilled 2026-08-05 (plan-work session; user at the table).

- Home DECIDED: dedicated /admin route (standalone feel of the picked variant; HostControlPanel phase dispatch untouched; natural home for WN-12's passcode gate later).
- Roster DECIDED: wizard Roster edits the FILES (players.json/teams.json); the existing SETUP deck stays for live in-room tweaks; Apply-overwrites-live is the documented rule (surface this in the Review step copy).
- Implementation is the port-variant skill's job: lift structure/decisions from apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx, rewrite properly, register in the design catalog per that skill, delete the lab.
- The lab's ?locked= override and variant switcher die with the lab; locked state in prod derives only from live room phase.
- No needs_prototype: the UI direction was already prototyped and picked (2026-08-05).

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Deps: WN-10 (config:* events), WN-5 (honest e2e gate). Prototype answer recorded in auto-memory (config-setup-ui-direction) and this Plan. Lab: apps/client/src/components/HostControlPanel/ConfigSetupPrototype/ — **committed** as of 9001a1f and dev-gated; delete it with `git rm -r` in this ticket's diff, along with its gate in HostControlPanel/index.tsx.
