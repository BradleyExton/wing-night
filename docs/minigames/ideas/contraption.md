---
name: CONTRAPTION
oneLiner: The active team lays out a handful of ramps, blocks and springs on the tablet, then hits GO and the whole room watches a physics sim drop a wing through whatever they built — it either lands in the bucket or it doesn't.
confidence: promising
---

## Pitch

Build it, then take your hands off. The team gets a limited set of pieces and a layout grid on the tablet, with a target bucket somewhere awkward. They argue, they place, they hit **GO**. The TV runs the simulation. For about four seconds nobody in the room can do anything at all.

That silence is the product. Every other game in the roster is continuous input — you're guessing, drawing, dialing, answering. This one has a hard commit point and then pure spectator physics, which is a completely different emotional shape and the reason Rube Goldberg videos work. It is also the only game here where a team can build something *stupid* on purpose and have it pay off, which is the correct kind of chaos for this party.

Spice angle is real but secondary: fine placement with slick fingers and watering eyes is genuinely harder, and the team that rushed the layout finds out publicly.

## Rough rules

- Team places up to N pieces (ramps at a few fixed angles, static blocks, bouncers/springs) on a coarse grid on the host tablet. Coarse grid, not freeform — precision-with-sauce is comedy, precision-with-sauce-and-pixel-perfect-placement is misery.
- Host tablet shows the layout editor; the TV shows the same scene, static, so the room can heckle the plan before it runs.
- Team commits → server simulates → TV replays the run at full size.
- Score: primary for landing in the bucket, plus bonus pickups clipped en route (so a near-miss still scores something and the run stays watchable to the end).
- N attempts per turn (see open questions), pending points applied at the phase boundary as usual.
- Standard escape hatches: host can re-run a replay for the room, or skip a stuck turn.

### Determinism — the one architectural decision

Two viable shapes, and they trade differently:

1. **Server simulates headlessly, emits a keyframe track, display replays it.** This is exactly the Drawing stroke-replay pattern — the display never predicts, it projects. Guaranteed consistent, survives reconnect, trivially testable (a reducer test asserts a known layout lands in the bucket). Cost: the track is chunky in state — roughly 5s × 30fps × a few bodies × 2 floats.
2. **Ship only the layout + seed; both sides run the identical sim.** Much smaller state. Plain IEEE-754 double arithmetic is fully specified and deterministic across V8 instances, so this *does* work — **provided the integrator avoids `Math.sin`/`cos`/`pow`**, which are implementation-defined and are the classic source of cross-engine drift. Pre-baked angle tables sidestep that.

Recommending **(1) for MVP** — it's the pattern the codebase already trusts, and it makes the whole thing unit-testable without a browser. (2) is a later optimization if the track turns out to bloat snapshots.

### Physics engine

Recommending a hand-rolled verlet integrator over pulling in matter.js: circles against static line segments with restitution is genuinely small, it runs identically in Node and the browser, and it keeps the determinism guarantee under our own control rather than a vendor's. It also keeps the dependency surface where it currently is (client deps are just leaflet + lucide today).

## Open questions

- **One shot or best-of-N?** One shot maximizes tension but punishes a team that misread the scene; best-of-3 lets them iterate and turns it into a puzzle game with a much flatter emotional curve. Leaning **two attempts, best score counts** — one to learn the scene, one to actually try.
- **Track size vs snapshot weight.** Needs a real number before committing to option (1). If a full run is heavy, 20fps + display-side interpolation probably looks identical on a TV.
- **How much does the room see before GO?** Showing the static layout on the TV invites backseat engineering from other teams — which is either the best part or a fairness problem. Leaning: show it, and let the heckling happen (consistent with how loud this game already is).
- **Piece set and level content.** Are levels authored (bucket + obstacle positions in a content pack, same local-overrides-sample loading as Trivia/Geo) or procedurally generated from a seed? Authored is more tunable and much easier to guarantee solvable. Leaning authored for MVP.
- **Solvability guarantee.** An unsolvable level is a genuinely bad party moment. Authored levels can ship with a known-good solution in the content file and a test that asserts the sim still solves it — cheap insurance and a nice regression test.
- **Reduced motion.** The replay is the game, not ambient decoration, so [DESIGN.md](../../DESIGN.md) §8's infinite-animation rule doesn't bite here — it's a discrete, user-initiated event. Worth stating explicitly in the spec so nobody "fixes" it later.

## References / inspiration

- The build-then-watch loop: *The Incredible Machine*, and the whole Rube Goldberg genre.
- Server-authoritative record-then-replay already proven here: [drawing-spec.md](../drawing-spec.md) (strokes are recorded server-side and projected by a read-only display canvas).
- Deterministic seeded reducers for testability/replay: [petmon-design.md](../../petmon-design.md) (Mechanics).
- Content-pack loading pattern (local overrides sample): [geo-spec.md](../geo-spec.md) §3.1.
