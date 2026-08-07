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
- [ ] This is a proper rewrite composing HostControlPanel styleTokens + house component idiom (styles.ts siblings, copy module, sr-only labels) — NOT a verbatim lab copy; the `ConfigSetupPrototype/` folder and its gate in `HostControlPanel/index.tsx` are deleted in the same change (`git rm -r` — the lab is committed as of 9001a1f).
- [ ] The `ConfigSetupPrototype/**` entry WN-3 added to `eslint.config.mjs` `ignores` (line 16) is removed in this same diff — the carve-out must not outlive the code it excluded, or it silently exempts whatever later occupies that path. Leave the `.claude/**` entry (line 13) alone; it is unrelated worktree litter.
- [ ] **WN-3's `typeof window` guard is removed too.** `HostControlPanel/index.tsx:31-36` carries a guard WN-3 added so the lab could not crash `tsx --test` (no DOM, no Vite `import.meta.env`). It exists only to protect the lab — once the lab is gone, both the guard and the `ConfigSetupPrototype` imports at lines 6-8 and the dispatch at 87-89 go with it. Leaving the guard behind is dead code referencing a deleted module and will not compile.
- [ ] One Playwright spec covers the happy path (open /admin, edit a round label, apply, assert display/host see the new label) and the locked rejection. The machine check is the manifest `test_one` form — `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e <that spec>` — never the bare `pnpm test:e2e <spec>`, which reuses whatever holds 5173/3000 (this is the exact defect gate1 rejected WN-2 for; WN-5 landed the pinned form).
- [ ] The spec restores SETUP phase before it finishes. Room state is a single in-memory singleton and Playwright runs spec files alphabetically — `refresh-rehydrate.spec.ts` (WN-2) hit this and broke `smoke.spec.ts` by leaving the server mid-game.
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Plan
Grilled 2026-08-05 (plan-work session; user at the table).

- Home DECIDED: dedicated /admin route (standalone feel of the picked variant; HostControlPanel phase dispatch untouched; natural home for WN-12's passcode gate later).
- Roster DECIDED: wizard Roster edits the FILES (players.json/teams.json); the existing SETUP deck stays for live in-room tweaks; Apply-overwrites-live is the documented rule (surface this in the Review step copy).
- Implementation is the port-variant skill's job: lift structure/decisions from apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx, rewrite properly, delete the lab.
- **port-variant outputs 2 and 3 are SKIPPED-AND-SAID here, pending WN-13 — not dropped, and not a property of this project.** The skill is explicit that a target project has its *own vendored copy* of these routes: "in a target project these are the same files under its vendored route copy" (port-variant SKILL.md:30), and PROTOTYPING.md marks both the designs route and the component library "M2 (**vendored**, new)". wing-night just hasn't been given them yet — verified 2026-08-07, `resolveClientRoute` defines exactly `ROOT | HOST | DISPLAY | DEV_MINIGAME | NOT_FOUND` and `design/` is documentation, not a catalog app. That is an **onboarding gap (WN-13)**, not a reason the outputs don't apply. Per the skill's own Boundaries — "Three outputs, each conditional… Skip-and-say, don't skip-and-forget" — output 1 (fold the winner into prod as a proper rewrite) always applies and is the substance of this ticket. Record in `## Evidence` that outputs 2–3 were skipped *because the surfaces are not vendored yet*, naming WN-13. Do **not** block on WN-13; it can backfill this component's catalog entry afterwards.
- Response-shape dependency: WN-10 now has an AC requiring it to name the reply mechanism for `config:*` (ack callback vs a `config:result` emit), because `defineAuthorizedEvent` cannot express these events as-is. Read that decision off the landed WN-10 code rather than assuming an ack.

Pre-verified 2026-08-07 (standing fix: check every AC against landed code at planning time, not at
gate1). Confirmed real before this ticket goes near the queue: `resolveClientRoute` +
`shouldCreateRoomSocket` exist and are wired in `App.tsx:15,18,49,54`; `HostControlPanel/styleTokens`
exists and is the established import for sibling `styles.ts` files; the lab is committed at 9001a1f
with its dispatch at `HostControlPanel/index.tsx:87-89`; the eslint carve-out is at
`eslint.config.mjs:16`.
- The lab's ?locked= override and variant switcher die with the lab; locked state in prod derives only from live room phase.
- No needs_prototype: the UI direction was already prototyped and picked (2026-08-05).

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Deps: WN-10 (config:* events), WN-5 (honest e2e gate). Prototype answer recorded in auto-memory (config-setup-ui-direction) and this Plan. Lab: apps/client/src/components/HostControlPanel/ConfigSetupPrototype/ — **committed** as of 9001a1f and dev-gated; delete it with `git rm -r` in this ticket's diff, along with its gate in HostControlPanel/index.tsx.
