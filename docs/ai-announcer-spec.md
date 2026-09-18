# AI Announcer Spec

Status: Draft for implementation — §5 is ready to build now, the rest is design intent

Last updated: 2026-09-16

An AI announcer voice on the TV. This doc exists mainly to get §5 (two new player
content fields) landed in the same pass as the `team` field currently in flight, so the
wizard's `PLAYER_FIELDS` array is only rewritten once. Everything else is the design
those fields are shaped for.

## 1) Roles At The Table

Wing Night is hosted live. The announcer is a fourth voice, not a replacement for any
existing one:

| Role | Who | Where |
|---|---|---|
| Host | Brad | Live, on mic, drives every phase |
| Helper | Bree | Live, Price-is-Right model's-assistant role |
| Announcer | AI | TV speakers, phase boundaries only |

The reference is Johnny Olson / Rod Roddy — the booming offstage voice that introduces
people and sets up segments, then gets out of the host's way. **The announcer never
speaks during `MINIGAME_PLAY`.** A live host is talking then, and two voices competing
for the room is worse than no announcer at all.

## 2) Locked Product Decisions

- Announcer audio plays on the display (TV) only, never on the host tablet.
- Announcer speech is confined to phase entry: `INTRO`, `ROUND_INTRO`, `MINIGAME_INTRO`,
  `TURN_RESULTS`, `ROUND_RESULTS`, `FINAL_RESULTS`.
- Brad and Bree are **not** players and get no `players.json` entries. The announcer
  knows them from its own config, because it addresses them by name.
- A failed announcer call is silent, never fatal — it must never throw and never block a
  phase advance. Same contract as `playQuietly` in `useTeamAnthemCue`.
- The host can skip a queued announcement. Escape hatches are always available
  (`SPEC.md` §1).
- Player bios and pronunciations are content, authored ahead of time, not generated.

## 3) Two Audio Paths, One Player

Not everything the announcer says should come from a model.

**Path A — Scripted.** Rules and briefings. The text is fixed per minigame and already
authored in [`apps/client/src/copy/minigameBriefings.ts`](../apps/client/src/copy/minigameBriefings.ts)
(`summary` + `steps[]`, already config-aware). Runs through TTS once, cached as an MP3,
regenerated only when the copy changes. No model in the path — a hallucinated rule
announced at volume is the one failure mode there is no recovering from mid-party.

**Path B — Live.** Reactive lines: results, standings, player intros, callbacks to bios.
Content genuinely varies with game state, so Claude generates the line server-side from a
facts object, then TTS. This is where the feature earns its cost.

Both paths end at the same `<audio>` element on the display, and must coordinate with the
team anthem cue rather than overlapping it (see `BACKLOG.md`, lobby-playlist entry — the
same "do not add a second uncoordinated audio lifecycle" constraint applies).

## 4) Non-Goals

- No play-by-play during `MINIGAME_PLAY`.
- No live-generated rules explanations (see §3, Path A).
- No voice cloning of anyone at the party.
- No announcer on the host tablet.
- No announcer-authored scoring, phase advances, or any other state mutation. It reads
  room state and speaks; it never writes.

## 5) Content Model Change — Ready To Build

Two optional fields on a player. Both follow the **presence** validation idiom already
used by `avatarSrc` ([`packages/shared/src/content/players/index.ts:36`](../packages/shared/src/content/players/index.ts)):
absent is normal and legal, present-but-blank is an error.

```json
{
  "name": "Steve Burke",
  "team": "Scorch Squad",
  "bio": "Claims he can't taste heat. Has never once proven this.",
  "sayAs": "steev burk"
}
```

### `bio?: string`

Announcer raw material — the difference between "Team Scorch Squad, 40 points" and a line
that lands. Used both for the player intro at the top of the night and for callbacks in
results lines.

**Cap it at 280 characters in the validator.** Every bio is in every prompt; a rambling
one crowds out the game facts and makes the announcer vaguer, not funnier. The cap also
keeps the wizard input a single-line field.

Write bios as intro-card material, not neutral facts: "Dan has never finished a ghost
pepper and won't admit it" beats "Dan likes hockey."

### `sayAs?: string`

Pronunciation hint. Absent means "say the name as written."

This is not a nicety. The roster (§7) was dictated by voice and contains names TTS will
mangle. Mispronouncing a guest's name over the TV, repeatedly, all night, is the most
likely way this feature embarrasses its author, and it costs one optional string to
prevent. Plain phonetic respelling (`"joe-LEE-za"`) is enough for every major TTS vendor;
SSML phoneme tags are an option if the chosen vendor supports them.

### Files to touch

| File | Change |
|---|---|
| `packages/shared/src/content/players/index.ts` | Add both to `PlayersContentEntry`; two validator branches mirroring the `avatarSrc` presence check, plus the 280-char cap on `bio` |
| `packages/shared/src/content/players/index.test.ts` | Extend — the absent / blank / undefined cases at lines 53–69 are the pattern to copy, plus one over-cap case |
| `packages/shared/src/player/index.ts` | Add both to `Player` |
| `apps/server/src/contentLoader/loadPlayers/index.ts` | Trim-and-omit passthrough, exactly as `buildPlayer` already does for `avatarSrc` |
| `apps/client/src/components/AdminConfigWizard/RosterStep/index.tsx` | Two more `EntryFieldSpec` entries in `PLAYER_FIELDS`. `bio` needs a `setPlayerBio`-style writer in `contentDraft` for the same reason `avatarSrc` does: "" must map back to absent, not to a present empty string |
| `apps/client/src/copy/admin.ts` | Field labels |
| `content/sample/players.json` | Sample values on a few entries so the fields are observable |

**Sequencing:** the `team` field work in the `user-setup-party-defaults-2dbb2d` worktree
modifies `RosterStep/index.tsx` and `content/sample/players.json` too. Land these together
or land `team` first — not in parallel.

### Snapshot note

`players` is in `DISPLAY_SAFE_ROOM_STATE_KEYS`, so both fields reach the TV snapshot
automatically. That is intended: bios are wanted on a future player intro card, and the
TV is in the same room as the people the bios are about. No display-safety work needed.

## 6) Name Disambiguation

The roster contains two Steves. A bare first name is therefore ambiguous in a room
containing both, and `player.name` alone cannot be what the announcer says.

Add a pure selector — `resolveAnnouncerName(player, allPlayers)` — returning the shortest
unambiguous form: the first name when it is unique across the roster, the full name when
it is not. Server-side, colocated test, no announcer dependency. It is independently
useful anywhere a player is addressed.

## 7) Roster — Spellings To Confirm

Fourteen players, dictated by voice on 2026-09-16, so several spellings are transcription
guesses. **Confirm every flagged name before it is written anywhere**, since these strings
get spoken aloud.

| As dictated | Confirm? | Note |
|---|---|---|
| Alex McMillan | surname | |
| Darren | ✓ | |
| Dylan | ✓ | |
| Joliza | **spelling** | Almost certainly not spelled as transcribed |
| Caitlin | **spelling** | Caitlin / Caitlyn / Katelyn |
| Steve Burke | ✓ | Needs full name when spoken — see §6 |
| Steve Crane | ✓ | Needs full name when spoken — see §6 |
| Samantha | ✓ | |
| Sarah | **spelling** | Sarah / Sara |
| Dan | ✓ | |
| Tay | **spelling** | Short form, or as written? |
| Rob | ✓ | |
| Rosie | **spelling** | Rosie / Rosy / Rosalie |
| Jazz | **spelling** | Nickname, or short for something |

Fourteen players over four teams is 4/4/3/3.

The real roster — names, bios, pronunciations, team seating — belongs in
`content/local/players.json`, which is gitignored. `content/sample/players.json` stays
placeholder, per the existing local-wins-over-sample convention.

## 8) Open Questions

- **TTS vendor.** Not chosen. Needs: MP3 out, a voice that survives a living room at
  volume, per-call latency under ~2s. Anthropic does not do TTS, so this is a second
  vendor and a second API key.
- **Where generation is triggered.** Prefetching one phase ahead (generate the
  `ROUND_RESULTS` line on entry to `TURN_RESULTS`) hides the round trip behind the time
  people spend reacting. Needs a decision on where that queue lives.
- **Offline fallback.** Wing Night is LAN-first (`SPEC.md` §1) and a cloud call is the
  first thing to break when house wifi sulks. `window.speechSynthesis` is free, offline,
  and sounds like a GPS — acceptable as a degraded mode, or fail silent instead.
- **Photos.** `avatarSrc` already exists end to end but nothing renders it. Sending a face
  on every announcer call buys little; the good use is one vision call at setup, turning
  photo + bio into a cached persona string. Worth doing after the text path works.
