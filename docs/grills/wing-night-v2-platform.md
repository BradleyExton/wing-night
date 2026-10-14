# Wing Night v2 — platform grill notes (session 1)

Date: 2026-09-07
Status: **in progress — paused at Q12.** Not a spec. This is the decision log that the
spec documents will be written from.
Method: `grill-me` (four lenses, one question at a time, recommendation-first).

## What this is

The starting idea: turn the LAN-first, single-room Wing Night into a **hosted, paid,
multi-title "games with friends" platform**. This note records the decisions taken so
far so the spec-writing session can resume without re-deriving them.

---

## Framing: what carries over from the current codebase

Assessed by reading the repo at `1f00b7b`. The v2 initiative is mostly a hosting-topology
change plus a product layer — not a rewrite of the game engine.

**Carries over as-is:**

- **Server-authoritative room state with reducer-style mutations**
  (`apps/server/src/roomState/*`). Already the right shape for a hosted multi-room game;
  needs to become one state per room id instead of one implicit room.
- **The minigame plugin contract** (`packages/minigames/core`): `initialize`,
  `reduceAction`, `selectHostView`, `selectDisplayView` is a clean seam. The per-game dev
  sandbox at `/dev/minigame/<slug>` is already the "run a minigame in isolation" facility.
- **Engine/content separation** (`content/sample` + `content/local`) — the seed of a
  product content model.

**Does not carry over — the real spec work:**

- **The closed minigame registry.** `MINIGAME_DEFINITIONS` in
  `packages/shared/src/content/gameConfig/index.ts` makes the game set a central union,
  enforced by every `Record<MinigameType, ...>` failing to compile. Excellent for one repo,
  wrong for a platform. v2 plugins must declare their own id, views, actions and content
  schema, with the shell treating them as opaque.
- **The plugin knows too much about Wing Night.** It receives `pointsMax`,
  `pendingPointsByTeamId`, `activeRoundTeamId`. A cross-title shell needs a generic
  turn/score interface that Wing Night *configures*.
- **Roles.** Two today (host tablet, display TV). Adding phones gives every minigame a
  third surface.
- **Auth and identity.** The `hostSecret` model becomes accounts + session tokens +
  reconnect by room code.
- **Persistence.** In-memory only is fine for one living room; a paid product needs live-room
  crash recovery plus durable accounts, entitlements and packs.

**Hosting note (the Next.js concern):** correct in the specific sense that matters —
serverless can't hold a WebSocket open. The clean split is Next.js on Vercel for site /
auth / Stripe / accounts, and a **separate long-running realtime service** for rooms. The
existing Express + Socket.IO server on Fly.io or Railway is the cheapest path because the
code exists; Cloudflare Durable Objects (one object per room, hibernation) is the elegant
alternative but means rewriting the server runtime. Recommendation: spec the room server
as a swappable boundary, ship the Node service for v1. **Not yet confirmed by the user.**

---

## Lens 1 — Scope & cuts (resolved)

### V1 milestone
Hosted Wing Night with phones. A host signs up, creates a room, opens the display on a TV
by URL, runs the night from their own device; players join by room code on phones.

### Customization is in v1, not deferred
The original recommendation was to defer all customization; **the user overrode this** —
customization is the pitch, not an add-on. Resulting split:

| Feature | Milestone |
|---|---|
| Photo uploads (own geo photos, team photos) | **v1** |
| Host-authored content packs (prompts, sauces, per-minigame rules) in a web editor | **v1** |
| AI avatars of friends as in-game characters | v1.1 |
| Photo-caption party game (Cards-Against-Humanity-shaped) | v1.1 |

Reason for the split: uploads and authored packs share one piece of infrastructure (a
content model with per-host storage) and are the customization story. The AI features add a
third-party image API, per-generation cost that must be metered against what the host paid,
and content-safety handling for other people's faces — a separate slice, made cheaper by
designing the pack model first.

### Titles
Wing Night is the only **sellable** product at launch. The repo also contains a trivial
second title — "plain game night", i.e. Wing Night minus the eating phase and sauces —
that is never sold, existing solely to keep the shell boundary honest by having two titles
compiled against it.

Evidence this matters: WN-7 records four unmerged book-club branches from the July 2026
night (`claude/blood-meridian-book-club-games-39072b`, `.../1984-...`,
`.../enders-game-...`, `.../starship-troopers-...`) that were real second titles on this
engine. What they had to change *is* the boundary evidence, and should ground the shell ADR
instead of hypotheticals.

### Minigame roster for v1
Port the three shipped games; make at least two phone-native so the join flow isn't
decorative.

- **Geo** — every player on the active team drops a pin on their own phone; team answer is
  the average or the best pin. The game that most improves with phones.
- **Drawing** — the drawer draws on their own phone instead of the host tablet; teammates
  guess out loud as now.
- **Trivia** — stays host-driven; phones show the question and let the team pick one answer
  (majority or captain rule).

Deferred: song guess, emoji charades, PETMON, CONTRAPTION, ANAMORPH, read-the-room.

Reason: every game now needs a `PlayerSurface` **or an explicit "no phone role"
declaration**, making the roster the single biggest cost multiplier in v1.

### What a host can author
Three things, all in a web editor on the site, none in JSON:

1. **The night** — rounds, sauce per round, minigame per round, timers, points. (This is the
   config wizard already prototyped in `AdminConfigWizard`, moved to the site.)
2. **Prompt packs per minigame** — trivia questions, geo photos with a location, drawing
   prompts. A host can clone one of the first-party packs or start empty. Uploads live here.
3. **Nothing about the roster ahead of time** — players join by phone and type their own
   name; teams are formed live on the night, as today.

Cloning a first-party pack gives every host a working game in one click and makes an empty
pack impossible by default.

### Host is a dedicated non-playing role (DM model)
Explored and rejected: host-plays-too, with contributor share links and author exclusion.

The user's own insight killed the simple version: **whoever writes a prompt can't play
against it** — a host who enters all the trivia and geo photos can't compete on them. The
fully-worked alternative was contributor invite links (no account, token in the link),
an author field on every prompt, contributors claiming their name on join, and the engine
skipping any prompt authored by a member of the active team.

**Decision: for v1 the host does not play — they run the night, DM-style.** The contributor
/ author-exclusion design is deferred, but an **`author` field stays on the prompt data
model** so it costs nothing to add later.

### Player identity
Players are **anonymous per room** — a typed name plus a session token in the phone's
storage so a refresh returns them to the same seat. No player accounts.

Reason: a sign-up wall at the exact moment twelve people are trying to join. Nothing in v1
uses cross-night identity. The one thing this closes off — a persistent "my avatar" for the
AI feature — can attach to the **host's pack** as a named character instead.

---

## Lens 2 — Edge cases & failure modes (in progress)

### Room server restart mid-game (deploy, crash, migration)
Every room mutation writes the full room snapshot to Postgres as one JSON row keyed by room
id. On boot the server **lazily rehydrates** a room from its row the first time a client
reconnects to it. **Timers are stored as absolute deadlines**, so they survive a restart.

### Host's device dies or is lost mid-night
The host role belongs to **the account, not the device**. Logging in on any other device and
opening the room takes over as host; the previous device is demoted to a viewer. Nothing is
lost because room state lives on the server.

This replaces the current `hostSecret` model, which is bound to one browser's storage. It
also means a borrowed phone works. Co-host promotion stays deferred — takeover covers the
emergency.

---

## Open — where we stopped

**Q12 (asked, unanswered): room and pass lifecycle.** The proposal on the table was:

- A room is created free and can sit in setup indefinitely, so the host can create it the
  day before and test the TV.
- The pass is consumed at **first transition out of setup** (game start). Abandoned setups
  cost nothing.
- A room ends when the host ends it, or after **12 hours** with no connected client. Ended
  rooms keep final standings readable for **30 days**, then state is deleted; uploads are
  not, since they belong to the pack.
- Room codes are **four letters**, unique among live rooms only, so they're reusable after a
  room ends.

Note this proposal silently assumes a **night-pass** monetization model, which has not been
decided (see below). Confirm the model before confirming Q12.

### Still unresolved from the pre-grill list

- **Monetization shape** — per-night pass vs subscription vs per-game packs (Jackbox-style).
  Deliberately deferred as "the price doesn't matter yet", but **the shape does**: it decides
  whether entitlements and a Stripe webhook are in the v1 architecture, and Q12 depends on it.
- **Room server runtime** — Node service (Fly/Railway) vs Cloudflare Durable Objects.
  Recommendation is Node for v1 behind a swappable boundary; unconfirmed.
- **Fresh repo vs evolve this one** — recommendation is a fresh repo with deliberate porting
  of the reducers, plugin core, and three shipped minigames (logic ported, not rewritten);
  unconfirmed.
- **Minigame packaging** — workspace packages in one monorepo vs a published SDK.
  Recommendation: monorepo, with the SDK boundary enforced by lint.

### Lenses not yet started

- **Lens 2 remainder** — partial joins, a player joining mid-round, duplicate names, a team
  losing every phone, upload failures, moderation of uploaded photos, pack running dry
  mid-night, display disconnecting, network loss on a player phone mid-answer.
- **Lens 3 — Architecture & reuse** — the v2 plugin contract, where the phase machine lives,
  shell/plugin versioning, what the second title proves, dependency direction.
- **Lens 4 — Testing & verification** — how a hosted multi-room, three-surface game is
  machine-checked; what replaces the current Playwright host/display pair; per-minigame
  isolation testing.

---

## Planned document set (from the framing discussion)

One document per boundary, each owning one decision set, plus ADRs for the cross-cutting
decisions:

1. **Product brief** — audience, pricing, non-goals.
2. **Platform architecture** — topology, services, data, auth, realtime.
3. **Game shell & room protocol** — roles, room lifecycle, snapshots, reconnect, the generic
   phase machine.
4. **Minigame SDK** — the v2 plugin contract, isolation, sandbox, testing, and the checklist
   for adding a game.
5. **Wing Night title spec** — rounds, eating, sauces, scoring; ported from the current
   `SPEC.md`.
6. **Site & commerce** — landing, accounts, Stripe, entitlements, room creation.
7. **Content & packs** — schema, authoring, storage, uploads.
8. **Engineering process** — repo layout, verify gates, landing strategy.

## Resuming

Re-enter with `grill-me` on this note. Start by settling **monetization shape**, then
**Q12**, then finish lens 2 and continue to lenses 3 and 4.
