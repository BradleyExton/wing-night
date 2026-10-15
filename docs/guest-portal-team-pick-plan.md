# Guest portal: pick your team, dress your bird

Status: plan, 2026-10-09. Replaces the private vote on `/me` (SPEC "Before the party", DESIGN
§2.2I). Nothing here is built yet.

## What changes, in one paragraph

The head studio on `/me` stays as it is. Everything under it goes. In its place a guest **picks
their team** from the night's real teams, and the bird in the studio card repaints on the spot
with that team's kit (colour, silhouette, dance, the pop shades on a drawn head), so switching
teams is a costume change you watch happen. Under that, a **wardrobe** lets the guest add a few
things to their bird from that team's rail, ahead of the night. Both land in the pack through
`pnpm pack:pull` and show up on the TV. The vote, the teammate wishes and the team-format
question are deleted, not hidden: Brad is seating by self-pick now, so there is nothing left to
tally.

## Decisions

These are the calls the plan makes. Each one Brad can overturn; the default is written so the
build has an answer.

1. **The teams are the pack's teams.** `local/teams.json` stays the one place a team is authored.
   The teaser build already ships them as `teaser-roster.json`; the Worker reads that same file
   through its `ASSETS` binding to validate a pick, so there is no second team list in D1 and no
   team editor on `/admin`. Renaming a team in the pack and redeploying orphans its picks, which
   `/me` shows as "pick again" and `/admin` lists as unseated.
2. **A pick is instant and changeable.** Tapping a team saves it. No Save button, no confirm.
   A guest can switch until Brad closes picks.
3. **Seats are capped, and the cap is computed.** Seats per team = ceil(guests ÷ teams), recomputed
   from the live guest count on every read. A full team is shown full and cannot be picked. Brad
   can move anyone on `/admin`, over the cap if he wants.
4. **Brad can close picks.** One switch on `/admin`. Closed, `/me` shows the pick but the tiles
   are inert ("Teams are set."), the wardrobe still works. This is what makes the last
   `pack:pull` before the night stable.
5. **The pick wins over the pack.** `pack:pull` writes a guest's picked team onto their player's
   `team`, replacing whatever `players.json` had. A guest with no pick leaves their player's
   `team` alone (seated by hand, or unseated, as today). Names and heads keep today's rules.
6. **An outfit belongs to a team.** The wardrobe is per genre, so a metal bird and a disco bird
   have different rails. Switching teams shows that team's rail; the outfit a guest built on
   another team is kept in the row, so flipping back restores it. Only the picked team's outfit
   is exported.
7. **Outfit items live below the chin.** Nothing crosses the face, because a photographed head
   is not a place for a hat (`apparelCrossesTheFace`), and a rail that empties for everyone with
   a real head is no rail. The team's silhouette stays the genre's statement; an item is the
   player's flavour on top, drawn to sit with that silhouette, never to repeat it.
8. **The vote is deleted.** Table, routes, form, admin summary, Borda count, e2e. A migration
   drops `votes`. If any real vote on wingnight.tv matters, read `/admin` once before deploying.

## How it works

### Data

- **Shared vocabulary** (`packages/shared/src/guestPortal/teamPick`): `TeamPick = { teamName,
  outfitsByGenre }`, its guard, and `TEAM_SEATS` helpers. The outfit vocabulary itself goes in
  `packages/shared/src/outfit` because the server, the cast and the pull all read it:
  `OUTFIT_SLOTS` (first cut: `torso`, `wing`), `OUTFIT_ITEMS` keyed by genre and slot, and
  `Outfit = Partial<Record<OutfitSlot, OutfitItemId>>`.
- **D1** (`0005_team_picks.sql`): `team_picks (guest_id PK, team_name, outfits_json, updated_at)`,
  `settings (key PK, value)` for `picks_closed`, and `DROP TABLE votes`.
- **Player** gains `outfit?: Outfit`. `players.json` carries it pack-relative like `avatarSrc`;
  the content loader reads it, the server passes it through, and `resolvePlayerAppearance` puts
  it on `CharacterAppearance`.

### API

| Route | Who | Does |
|---|---|---|
| `GET /api/teams` | any session | the teams in seating order with genre, seat cap, and each member's name and head hash, plus `picksClosed` |
| `PUT /api/me/team` `{ teamName }` | guest | validates against the roster file, refuses a full team (`team_full`) or closed picks (`picks_closed`) |
| `PUT /api/me/outfit` `{ genre, outfit }` | guest | validates every item against the genre's rail |
| `GET /api/admin/teams` | admin | the board: every team's members, the unseated, the cap |
| `POST /api/admin/guests/:id/team` `{ teamName \| null }` | admin | reseat or unseat, cap ignored |
| `PUT /api/admin/picks` `{ closed }` | admin | the switch |

`GET /api/me` gains `team: TeamPick | null` and `picksClosed`; `GET /api/admin/export` gains
`team` and `outfit` per guest (the picked team's outfit only). `PortalMe.vote`, `/api/me/vote`
and `/api/admin/votes` go.

### `/me`

Two cards under the greeting, in the shell's existing language (DESIGN §2.2I).

- **Your head** is unchanged except that `PortalHeadBird` now takes the team's theme: fill from
  `colorVariant.characterFillClassName`, `silhouette`, `dance`, `apparel`, and the outfit. With
  no pick it draws the stock bird as today.
- **Your team** replaces *Your vote*. One tile per team: the wordmark over the team's colour, a
  row of the members who already picked (their heads on birds, `small`), and "3 of 4 seats" in
  the score face. The picked tile is ringed `primary`; a full tile is dimmed with "Full". Tap to
  pick; the bird above repaints while the request is in flight, and a refusal (full, closed)
  snaps it back with the reason in the status line. Reuse the look of `TeaserTeamPicker`
  (wordmark over riders), not its code: that one is a navigation, this one is a form.
- **Your bird's wardrobe** sits under the team card and appears once there is a pick. One row
  per slot, chips with a tiny bird wearing the item (`Character` at `still`, the team's kit),
  "Nothing" first. Tap equips and saves. Before a pick the card says which team to pick first.

### `/admin`

The vote summary becomes **the team board**: a column per team in seating order (wordmark,
"4 of 4"), each member as their bird plus name, and an *Unseated* column. A member has a move
menu (the other teams, Unseat). Above the board, the switch: "Picks are open / closed". The
guest table's "vote" status column becomes "team".

### The night

`pack:pull` lands `team` and `outfit` on the player (decision 5). On the night nothing new is
fetched: the lobby parade, the lineup board, every minigame figure and the ragdoll already get
their appearance from the player, so the outfit rides along once `CharacterFigure` draws it.
Outfit items paint in the `body` part so they sit still under the head's nod during `walk` and
`dance` (the apparel-geometry trap: props on the head part swing). `CHARACTER_BOX`, `CHARACTER_FOOT`,
`CHARACTER_HEAD_CENTRE` and `CHARACTER_PIVOTS` do not move, so JOUST and FAPPY colliders are
untouched.

## The wardrobe itself

> **Proposed replacement (2026-10-14, pending Brad):** [research/bird-wardrobe.md](research/bird-wardrobe.md)
> recommends seven slots (Top, Sleeve, Tail, Boots as kit; Prop, Stage, Move as showpieces), richer
> per-team rails, Looks and Shuffle, and a `/me/wardrobe` editor. It replaces this section and
> milestones 3–4 below once signed off.

The item set is a design round, not a code task, and it comes before any cast code: every item
is drawn in the existing apparel harness (`apps/client/public/mockups/cast/apparel-harness.js`)
on its genre's silhouette, on a drawn head and on a costume head, and judged on the 76px row.
Rules from the September round still hold: one white point at most on a chest (two read as
fangs), no white shape with a dark centre (reads as an eye), nothing right of x≈45 on the upper
back (behind the player's hair), nothing under the belly, nothing at the feet (8 units, a
smudge).

First-cut rails, two slots, for the four pack genres. Candidates that already survived a harness
round are marked.

| Genre | `torso` | `wing` |
|---|---|---|
| metal | battle vest (survived), chain-mail shirt | spiked bracer, guitar pick patch |
| pop | crop jacket, sequin tee | star patch (survived), mic |
| country | plaid shirt, bandana down the chest (survived) | horseshoe patch, banjo |
| disco | open shirt with one wedge (survived), sequin shirt | medallion on the wing, tambourine |

Eight per genre is the ceiling for the first pass; anything that fails the 76px row is cut, not
fixed in code. Genres the pack is not using (punk, rock, hiphop, electronic, classical) get an
empty rail and the wardrobe card says so.

## Build order

Each milestone ends green on the gate (`pnpm lint && pnpm typecheck && pnpm test`) and, where it
touches the portal, `pnpm test:e2e:portal` with the pinned ports.

1. **Team pick, end to end.** Vocabulary, migration, routes, `/me` team card with the repainting
   bird, admin board and switch, export, pull. The vote is deleted in this milestone. SPEC,
   DESIGN §2.2I and BACKLOG updated. Shippable and useful on its own.
2. **Wardrobe mockup round.** Harness pages per genre, Brad picks the survivors on the 76px row.
   No app code.
3. **Outfit in the cast and the pack.** `packages/shared/src/outfit`, `CharacterFigure` draws the
   `body`-part layer, `CharacterRagdollFigure` too, `Player.outfit` through the loader, the pull
   and the teaser roster.
4. **Wardrobe on `/me`.** The card, the outfit route, admin export. e2e: pick a team, dress the
   bird, reload, still dressed.

## Out of scope, named

- The public landing's roster stays the pack's until the next `teaser:deploy`; live picks do not
  reach it (portal heads are private, BACKLOG "Public teaser heads vs private portal heads").
- No per-player colour, body, comb or tail choice: those stay hashed from the name, so the roster
  reads as one cast.
- No outfits for the drawn-head-only props (`hat`, `shades`): the pop shades stay the team's and
  still vanish on a photographed head.
- No "remove guest" route, still (BACKLOG).
