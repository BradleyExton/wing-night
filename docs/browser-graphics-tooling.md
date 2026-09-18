# Browser graphics & game tooling — research note

Researched 2026-09-16. The question: what third-party packages, tools and services could make
Wing Night's minigames look as good as the impressive browser games you see online.

**Headline answer: the constraint is art, not libraries.** Almost none of the well-known browser
game tech survives contact with this repo's architecture. What does survive is a render-layer 2D
library (PixiJS) and free CC0 art. Everything else is either already solved here or actively
incompatible.

---

## 1) Why most "game engine" answers are out

The spec's architecture rules out the whole engine category before any comparison starts:

- Server is authoritative; clients render state and request mutations only (`AGENTS.md` §2).
- Minigame runtime state is tiny and seed-derived; the display **replays** and never predicts.
  CONTRAPTION's settled architecture is "server simulates in the reducer and emits a keyframe
  track" — mirroring drawing's stroke replay.
- In-memory state only. No DB, no cloud deployment, LAN-first (`SPEC.md` §1).

Phaser, Babylon.js, Unity/Godot web exports and the like all want to **own the game loop and hold
game state client-side**. Adopting one means either a second source of truth on the display or
demoting the server to a message bus. Both are the thing `AGENTS.md` §6 exists to prevent.

Same verdict, stronger, for multiplayer/game-hosting **services** — Colyseus, PartyKit, Rune,
Playroom. Each wants to be the netcode + hosting layer, which is precisely the server-authoritative
Socket.IO core the project is built on. A LAN party game with no accounts and no database has
nothing to buy from them. If a hosted, paid, multi-title Wing Night is ever on the table, that
question belongs in the v2 platform grill (`docs/grills/wing-night-v2-platform.md`), not here.

**No service of any kind is recommended.** Anything that needs the internet is a single point of
failure for a party running on a living-room LAN — the same reasoning that made the music feature
local MP3s instead of Spotify.

## 2) What's already here

Worth knowing before adding anything, because the house pattern is already established and working:

| Surface | How it renders today |
|---|---|
| `AnamorphLab/CloudCanvas` | raw `canvas` 2d, `fillRect` per point, `ResizeObserver` redraw |
| `ContraptionLab/RunCanvas` | raw `canvas` 2d, replays a server keyframe track |
| `ContraptionUiLab` variants | inline SVG scene primitives (`scene/`, `projectile/`) |
| drawing minigame | raw `canvas` 2d + `perfect-freehand` for stroke geometry |
| geo minigame | `leaflet` + `react-leaflet` |
| PETMON sprite booth (mockup) | raw `canvas`, photo → DMG-palette sprite quantizer, `image-rendering: pixelated` |
| display juice | CSS animation + `prefers-reduced-motion` in `apps/client/src/index.css` |

The precedent for dependencies is clear and worth keeping: **small libraries that do one job at the
render layer** (`perfect-freehand` is a pure function; `leaflet` does something genuinely hard).
Nothing in the repo owns a game loop.

## 3) The one library worth adopting: PixiJS v8

A 2D **renderer**, not an engine — you hand it a scene each frame. That is exactly the current
pattern, so it fits the architecture without bending it.

- v8 has first-class WebGPU support alongside WebGL, and v8.16 added an experimental canvas
  fallback renderer.
- Where it actually pays: **many sprites at 4K**. `CloudCanvas` currently issues one `fillRect`
  per point per frame on the CPU. A dense ANAMORPH cloud on a 4K TV is the first place that
  bottlenecks. Particles, celebration moments and a PETMON sprite battle are the same shape of
  problem.
- Where it pays nothing: the SVG scene work in `ContraptionUiLab`, or anything that's a handful of
  shapes. Don't migrate what isn't slow.

**Adopt it the way this repo already de-risks things: pilot it in a throwaway lab.** The
`/dev/lab/*` pattern exists precisely for this, and the labs are explicitly deletable. Port
`CloudCanvas` to Pixi in a lab, measure it on the actual TV at 4K, and keep it only if the frame
time moved. That also satisfies `AGENTS.md` §13 — the justification is a measurement, not a vibe.

## 4) 3D: possible, but it buys less than it looks

Three.js is the mature answer, and `@react-three/fiber` is the React binding.

- **Version blocker:** R3F v9 pairs strictly with React 19 (a React renderer tracks React's major
  version — this is not a soft constraint). The catalog in `pnpm-workspace.yaml` pins
  `react: ^18.3.1`, so R3F today means either pinning R3F 8.x or a React 19 migration across the
  whole monorepo. The 9.x line is current (9.7.0), with 10.x in alpha.
- **ANAMORPH doesn't want it anyway.** `anamorphCloud/index.ts` deliberately projects to screen
  coordinates with *no depth channel*, because shading dots by distance "would leak the cloud's 3D
  structure and hand the team the illusion the puzzle is asking them to find." A real 3D engine's
  entire value proposition — perspective, lighting, depth — is the thing that minigame must not
  have. Raw Three.js, if ever needed, is the better shape than R3F: no React version coupling.

Verdict: **not now.** Revisit only if a future minigame genuinely needs lit, textured 3D.

## 5) Physics: leave the hand-rolled integrator alone

This is the one place the backlog's stated premise turned out to be shakier than written, so it's
worth recording honestly.

CONTRAPTION's integrator is hand-rolled and dependency-free, guarded by
`packages/shared/src/contraption/noTranscendentals.test.ts`, on the reasoning that determinism
demanded it. But **Rapier's JS/WASM build is cross-platform deterministic** — the
`@dimforge/rapier2d-deterministic` package guarantees that the same simulation with the same
initial conditions produces identical results across machines, browsers and CPUs. So "we had to
write our own for determinism" isn't strictly true.

**Don't switch.** The reasons are practical, not architectural:

- The integrator is already written, tested, and proven byte-identical by test rather than asserted.
- Only a keyframe track crosses the wire, measured at ~1,600 B at real piece counts. The wire cost
  the dependency would optimise is already a non-issue.
- Rapier means a WASM dependency inside the server reducer, for a problem that is solved.

**Keep it as a documented escape hatch.** Per `BACKLOG.md`, piece-set tuning has now stalled twice
(nesting sets produced byte-identical tracks; presets need re-finding against fixed physics). If
that keeps stalling because the hand-rolled solver can't express ramps/sliding/friction convincingly,
Rapier-deterministic is the fallback that doesn't cost determinism — and `-compat` variants inline
the WASM for bundler friendliness.

**Matter.js is not the answer** at any point: it makes no cross-platform determinism guarantee,
which breaks the server-simulates-once keyframe contract outright.

## 6) The actual highest-impact lever: free art

The games that look impressive are carried by art direction and game feel, not by their renderer.
This costs no dependency, no architecture risk, and no bundle size — assets are local files, served
statically, exactly like the anthem MP3s.

- **Kenney** (kenney.nl) — 40,000+ assets, all CC0, no attribution required, no sign-up. 2D
  sprites, UI, fonts, audio. The default starting point.
- **Quaternius** — CC0, the better source for rigged 3D characters and creatures.
- **OpenGameArt** — decade-old archive, best for something specific and niche; licences vary
  (CC0/CC-BY/GPL), so check per asset.
- **itch.io asset packs** — more stylized and distinctive indie art; licences vary.
- **Poly Haven** — CC0 3D models, HDRIs and textures.

Only CC0 sources should be used without reading the licence. `DESIGN.md` §0.1 caps the palette, so
any pack still needs recolouring to the Spicy Broadcast tokens rather than dropping in as-is.

## 7) Animation authoring: probably skip

- **Rive** — binary `.riv` with a real interactive **state machine** (idle/hover/success states
  driven by runtime inputs). Genuinely the right tool for a reactive character: the CONTRAPTION
  thrower, a PETMON mascot. Cost: ~200KB gzipped WASM runtime, plus authoring time in Rive's editor.
- **Lottie** — playback only (dotLottie added state machines in late 2025, but the ecosystem is
  still playback-first). ~60KB runtime. After Effects skills transfer; no AE here.

For a solo developer with no existing AE or Rive pipeline, a sprite sheet plus CSS is cheaper than
either, and the display's juice is currently CSS-driven and working. Revisit Rive only if a
persistent animated character becomes a real feature.

## 8) Recommended order

1. **Art.** Pull CC0 packs, recolour to `DESIGN.md` tokens. Biggest visual delta, zero risk.
2. **PixiJS pilot in a lab.** Port `CloudCanvas`, measure on the 4K TV, adopt only if it moved.
3. **Nothing to the physics.** Finish the piece-set work; note Rapier-deterministic in the
   CONTRAPTION ticket as the fallback if tuning stalls a third time.
4. **Skip** engines (Phaser/Babylon), multiplayer services (Colyseus/PartyKit/Rune/Playroom), and
   3D/R3F until a minigame actually needs lit 3D.

## Sources

- PixiJS v8 / WebGPU: https://pixijs.com/blog/pixi-v8-launches, https://pixijs.com/blog/8.16.0
- R3F version pairing: https://r3f.docs.pmnd.rs/getting-started/installation,
  https://github.com/pmndrs/react-three-fiber/releases
- Rapier determinism: https://rapier.rs/docs/user_guides/javascript/determinism/,
  https://www.npmjs.com/package/@dimforge/rapier2d-deterministic
- Rive vs Lottie: https://rive.app/blog/rive-as-a-lottie-alternative,
  https://unicornicons.com/learn/rive-vs-lottie
- CC0 art: https://kenney.itch.io/kenney-game-assets,
  https://3dxdev.com/kenney-vs-quaternius-the-best-free-cc0-game-assets/, https://itch.io/game-assets/assets-cc0
