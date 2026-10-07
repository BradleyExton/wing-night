---
name: Scream Run
oneLiner: The hen only moves when the team makes noise into the tablet; a murmur walks it, a scream jumps it, silence stops it dead, and the course is a relay down the Barrie waterfront.
confidence: promising
---

## Pitch

Chicken Scream, with the room as the voice. The tablet's microphone is the only control. The
active team's bird stands on the boardwalk and does nothing until somebody makes a sound: a hum
walks it, louder runs it, a shout jumps it over the gap, and the instant the team goes quiet it
freezes mid-stride. Each teammate takes a leg of the course in roster order, and the handoff is
the tablet moving to the next mouth. The team is screaming at a chicken with their friend's face
on it, through a mouthful of sauce, in front of everyone. It is the most literal answer in the
roster to "the whole team has to move or speak" (principles §6, item 9), and the first vertigo
game we would have: losing your voice is losing the controls.

The TV does what it does for Dunlop Dash: replays the input log at full size, with a volume
meter the room can read, so the couch sees the scream coming before the jump lands.

## Rough rules

- Per-team relay, a leg per player in roster order (FAPPY's shape). One clock from the first
  sound to the last landing; points from distance reached, with a bonus for finishing.
- Input: the tablet meters the mic (RMS per frame) against three thresholds: walk, run, jump.
  The thresholds come from a rule plus a per-night sensitivity the host sets at the briefing
  (the room's own noise floor, measured on the spot, is the zero).
- The sim runs on the tablet from the metered level, the level samples are the input log, and
  the TV replays the log. Nothing audio crosses the wire.
- Fail: a gap missed sends the bird back to the last platform, FAPPY's five-second rule.
- Host can skip a leg and override (`AGENTS.md` §11).

## Principles check

- 2 Commit before reveal: the scream is the commit; whether it was loud enough is the reveal.
- 6 A bad answer is still a plausible answer: a whisper that walks the bird off a dock is as
  good a turn as a clean run.
- 9 Whole team moves or speaks: the whole team *is* the controller.
- 10 Information asymmetry, and when it collapses: nobody knows (the meter is the only truth);
  collapses on every gap.
- 13 What the watching teams do: read the meter on the TV, and shout along or shush, which
  changes the input and is allowed.
- 15 Rules in one verb line: "Make noise to run. Scream to jump. Shut up and it stops."
- 23 What the sauce does to it: it is the first game where the burn is the input.

## Open questions

- **The blocker.** Chrome exposes `navigator.mediaDevices` only on a secure context, and the
  tablet reaches the laptop at `http://<lan-ip>`. Two fixes, both setup not code: serve the host
  surface over HTTPS with a `mkcert` certificate the tablet trusts once, or add the server origin
  to `chrome://flags/#unsafely-treat-insecure-origin-as-secure` on the tablet. Decide before
  anything else; without it the idea is dead on the night.
- Spectators shouting changes the input. That is a feature until it is not; the host-set
  sensitivity and a visible noise floor on the TV are the lever.
- Whether the lobby's beat detector (`apps/client/src/components/DisplayBoard/useBeatClock`,
  a Web Audio graph on the TV) can be reused as the meter on the host, or whether the host
  needs its own graph. Never close the
  context, never re-tap the element (memory: lobby parade).
- Sauce on a mic grille.

## References / inspiration

- Research: [docs/research/cast-minigame-candidates.md](../../research/cast-minigame-candidates.md) §1.
- Chicken Scream (Perfect Tap Games, 2017): https://www.phonearena.com/news/Chicken-Scream-is-a-game-where-you-make-a-chicken-run-by-shouting-at-your-phone_id92441
- Mic metering: https://jameshfisher.com/2021/01/18/measuring-audio-volume-in-javascript/
- Fappy Bird's relay and crash rule: [fappy-spec.md](../fappy-spec.md).
