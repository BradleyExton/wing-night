---
name: ANAMORPH
oneLiner: The TV shows a meaningless cloud of drifting 3D points; the active team rotates it with two dials until — from exactly one viewing angle — the points snap into a recognizable silhouette, which they then name.
confidence: promising
---

## Pitch

A few thousand glowing dots tumble in space on the TV. Noise. The active team has two dials on the tablet — yaw and pitch — and as they turn them the dots begin to *agree with each other*. Get close to the true angle and a shark, or the Batman logo, or someone's face resolves out of the static. Lock it in and name it.

This is anamorphic projection (the "shadow art" / Shigeo Fukuda trick): scatter points in 3D under the constraint that their projection along one chosen axis reproduces a 2D silhouette, then push each point a random distance along its own view ray. From the target angle the ray-jitter is invisible and the silhouette is perfect. From anywhere else it's soup.

Why it earns a slot:

- **Nothing in the roster is spatial.** Trivia is recall, Drawing is expression, Geo is knowledge, Read the Room is social calibration. This is "rotate the thing in your head," which is a completely separate skill and hits different people in the group.
- **The wow is the mechanic, not decoration.** The graphics *are* the puzzle — you can't screenshot this idea into a static mockup, which is exactly why it lands in a living room.
- **It is cheap.** Point generation is a loop over a rasterized silhouette. Rendering is a rotation matrix and a few thousand `fillRect` calls on a plain 2D canvas — no WebGL, no new dependency, comfortably 60fps at 4K.
- **The room plays too.** Spectators see the shape emerging before the dialers do and cannot keep quiet about it. Overshooting the dial while everyone screams "BACK! GO BACK!" is the whole bit.

## Rough rules

- TV renders, tablet is the controller — same split PETMON already settled (`docs/petmon-design.md`). The team looks up at the TV; the tablet is two dials and a LOCK IN button. One canvas, one shared focus.
- N prompts per turn (mirror Geo's `promptsPerTurn`), each a silhouette + seed.
- Server picks the prompt and the hidden true angle. The cloud is public — that's the point — but the true angle is **server-side only** and never enters either view model until lock-in.
- Team rotates freely, locks in, TV reveals the true angle and rotates the cloud to it so the silhouette resolves fully.
- Score by angular distance in tiers, mirroring Geo's `scoreBandsKm` → a `scoreBandsDegrees` equivalent. Optional naming bonus awarded by the host via the existing manual-score escape hatch.
- Pending points applied at the phase boundary like every other minigame.

### State shape

Tiny and fully `SerializableValue`:

```
{ promptId, seed, currentYaw, currentPitch, lockedAngle | null }
```

The point cloud is *derived* from `(promptId, seed)` on the client, so snapshot-on-reconnect restores the exact frame for free. No geometry crosses the wire.

### Content

Silhouettes as **inline SVG path strings in the content JSON** — no binary assets, fully committable as sample content, and the host can add their own by editing one file. Same local-overrides-sample loading as Trivia and Geo (`content/local/minigames/anamorph.json` → `content/sample/minigames/anamorph.json`). Clients rasterize the path to an offscreen canvas once at prompt load and sample points from it.

Silhouettes of people in the friend group are the obvious content-pack win, but that's a host-supplied thing, not engine scope.

## Open questions

- **The jitter constant is the entire game.** Too little ray-jitter and the shape is legible from every angle (trivial); too much and it never resolves cleanly (frustrating). There is a narrow good band and I don't think it can be reasoned to on paper — this is a `prototype` question, and it's the one thing I'd resolve before writing a spec.
- **Emergence curve.** Related but distinct: should legibility ramp linearly with angular error, or stay flat and then snap hard in the last ~10°? The hard snap is more dramatic; the ramp gives the team feedback to hill-climb toward. Probably want *some* gradient or the dials feel unresponsive. Leaning: a soft ramp that accelerates near the target.
- **180° ambiguity.** A ray-jittered cloud generally also resolves from the antipodal angle, mirrored. Is that a bug (two correct answers) or a feature (a lucky-find moment)? Cheapest fix is scoring against whichever of the two is closer. Leaning: accept both, score the nearer.
- **Two dials or a drag-to-orbit?** Dials are precise and readable on a greasy tablet; orbit-drag is more natural but slippery with sauce on your fingers. Leaning dials — the spice is a design input, not an accident.
- **Does the host tablet mirror the cloud at all?** Recommending no (TV-only) for shared focus and less work. But if the TV is across the room and the dialer is squinting, a small tablet preview might be necessary. Prototype will answer it.
- Do spectator teams get a steal if the active team whiffs the name? Consistent with the current single-active-team loop, MVP is active team only.

## References / inspiration

- Anamorphosis / perspective-dependent sculpture — Shigeo Fukuda's shadow works are the canonical version of the illusion. [Anamorphosis (Wikipedia)](https://en.wikipedia.org/wiki/Anamorphosis)
- Proximity-scored guessing already proven in this codebase: [geo-spec.md](../geo-spec.md) (distance bands, `promptsPerTurn`, deterministic prompt cursor).
- TV-renders / tablet-is-the-controller split already settled: [petmon-design.md](../../petmon-design.md).
- Seeded-PRNG-in-state for deterministic, testable, replayable reducers: [petmon-design.md](../../petmon-design.md) (Mechanics).
