# Minigame Authoring Guide

This guide is the canonical checklist for adding a new minigame to Wing Night.
Use this to keep implementation small, modular, and compatible with current host/display flow.

## 0) Guardrails

- Server remains authoritative for state, timers, and scoring.
- Host and display render from `minigameHostView` and `minigameDisplayView`.
- Display view must never include answer/secret fields.
- Keep minigame code in `packages/minigames/<minigameId>`.

## 1) Start With a Checkpoint

- Create a checkpoint branch or commit before editing.
- Make the smallest end-to-end change that works.

## 2) Scaffold the Package

Create `packages/minigames/<slug>/` with the same shape used by existing packages:

- `src/runtime/index.ts`
- `src/client/index.ts`
- `src/client/Host<Minigame>Surface/index.tsx`
- `src/client/Host<Minigame>Surface/copy.ts`
- `src/client/Host<Minigame>Surface/styles.ts`
- `src/client/Display<Minigame>Surface/index.tsx`
- `src/client/Display<Minigame>Surface/copy.ts`
- `src/client/Display<Minigame>Surface/styles.ts`
- `src/dev/index.ts`
- `src/runtime/index.test.ts`
- `package.json`
- `tsconfig.json`
- `tsconfig.typecheck.json`

Fast path: copy `packages/minigames/geo` as a starting scaffold, then rename IDs/types.

## 3) Implement Runtime Plugin

In `packages/minigames/<slug>/src/runtime/index.ts`:

- Export a `MinigameRuntimePlugin`.
- Set `id` to your new `MinigameType`.
- Implement:
  - `initialize`
  - `reduceAction`
  - `selectHostView`
  - `selectDisplayView`
- Add `syncPendingPoints` and `syncContent` if needed.
- If content-backed, provide `content.fileName` and `parseFileContent`.

Rules:

- `selectDisplayView` must be answer-safe.
- Runtime state must be serializable.
- `reduceAction` must be no-op for invalid payloads.

## 4) Implement Renderer Bundle + Dev Manifest

In `packages/minigames/<slug>/src/client/index.ts`:

- Export `MinigameRendererBundle` with `HostSurface` and `DisplaySurface`.

In `packages/minigames/<slug>/src/dev/index.ts`:

- Export `MinigameDevManifest` scenarios for `/dev/minigame/:minigameId`.

## 5) Wire Shared Contracts

Update `packages/shared/src/content/gameConfig/index.ts`:

- Add the new ID to `MINIGAMES`.
- Add timer field(s) in `GameConfigTimers` and validators if needed.
- Add rules schema in `MinigameRules` and validators if needed.

Update `packages/shared/src/roomState/index.ts`:

- Add `MINIGAME_CONTRACT_METADATA_BY_ID` entry.
- Add action constants only if you want typed action names in shared contracts.

Optional stricter action typing:

- Extend `packages/shared/src/socketEvents/index.ts` typed minigame action union for new action payload shapes.

## 6) Wire Server + Client Registries

Update server registry:

- `apps/server/src/minigames/registry/index.ts`

Update client registry and slug mapping:

- `apps/client/src/minigames/registry/index.ts`

Update server minigame content loader list:

- `apps/server/src/contentLoader/loadMinigameContent/index.ts`

## 7) Wire Workspace Dependencies and Paths

Add dependency to:

- `apps/server/package.json`
- `apps/client/package.json`

Add server TS path aliases to:

- `apps/server/tsconfig.json`
- `apps/server/tsconfig.build.json`

Add package to root prebuild filters in:

- `package.json` scripts `test` and `typecheck`

## 8) Add Content and Schedule It

If content-backed:

- Add `content/sample/minigames/<slug>.json`
- Keep runtime plugin `content.fileName` in sync with actual file path.

Schedule in sample config:

- `content/sample/gameConfig.json` round `minigame` field
- Matching timer/rules fields

## 9) Test Requirements

Add tests at minimum:

- Runtime/plugin tests in package (`src/runtime/index.test.ts`)
- Client/server registry tests for resolution
- Display-safe projection tests (no answer leakage)
- Any reducer validation and scoring cap behavior

Run:

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm playwright test` (when host/display sync, routing, or reconnect behavior changed)

## 10) Definition of Done

- New minigame appears in config validation and round scheduling.
- Host and display both render through package-owned surfaces.
- Server accepts actions only for active team/phase.
- Display view contains no privileged answer fields.
- Dev sandbox route works: `/dev/minigame/<slug>`.
- All required verification commands pass.
