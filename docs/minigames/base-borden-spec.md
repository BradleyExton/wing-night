# Base Borden (working title) Minigame Spec

Status: **Spec (draft)** — steps 1 to 6 built (the online lab, the room, the sim, the cast's
duck and sauce, the runtime, the phone and its page); not deployed, and not yet played by a person.
Promoted from the idea file on 2026-11-19, after Brad played the lab.

Last updated: 2026-11-21 (step 6, the phone surface and `/base-borden`, built)

> **§0 is the build plan; §1–§3 are the reasoning it rests on; §4 is what is still open.**
> Decisions are marked with whose they are: **(Brad)** is a call he made, dated; **(lab)** is a
> value he played and called fine; everything else is mine and is his to overrule. The ones I
> most want confirmed or overruled are collected in §4.

## 0) Build plan

### 0.1 What ships

A side-view run-and-gun on **wingnight.tv**, played by two to four people **on their own phones,
from wherever they are** **(Brad, 2026-11-19: "Two phones online")**. One of them makes a room and
sends the link; the others open it and pick their bird. Their hens run a stretch of Base Borden
together, two at a time, spraying hot sauce, and at the far gate the next pair takes over **(Brad,
2026-11-16: a relay where two go through at once, then hand off to the next two)**.

It is **teaser only, to start: not in the night** **(Brad, 2026-11-19)**. It is not added to the
pack's schedule, so it never competes with Streets of Barrie for a slot. If it ever goes to the
night it plays there as a crew game on the party's own server (§0.9), and its schedule question
comes back then.

Two things ship, and the first is most of the work:

1. **An online room for the teaser.** A Cloudflare Durable Object, one per game, that runs a
   party minigame's own pure runtime and relays it to every phone in the room. It is generic:
   any game with the crew hooks (`selectCrew`) can play in it. Streets of Barrie already has
   them and is its first tenant (§0.7, step 2), so the room is proven on a game that exists
   before Base Borden's own code is written. That is also what makes this more than one game:
   every crew game becomes playable online on the teaser for free.
2. **Base Borden itself:** its sim, its runtime, the cast's new poses, and the phone surface.

### 0.2 What is settled

- **Two phones, not one shared device (Brad, 2026-11-16).**
- **A jump survives the hop (lab, Brad, 2026-11-19).** `/dev/lab/rungun-yard` and
  `/dev/lab/rungun-pad`, played on his phone through a Cloudflare tunnel: "jump is ok". The
  tunnel's pad round trip was about 100 ms; on top of it 60 ms of added input lag was fine and he
  felt 80 ms. So the felt limit is about **110 to 130 ms from thumb to picture**. Headless bot,
  before that: 14 of 14 shots dodged with up to 150 ms of added lag on the laptop alone, 1 of 14
  at 200 ms.
- **The stick aims the sauce, eight ways (Brad, 2026-11-19).** Ducking sprays along the floor.
- **Teaser only, to start (Brad, 2026-11-19).**
- **Online, two phones together (Brad, 2026-11-19).**

### 0.3 The game (locked unless §4 says otherwise)

- **One verb line:** "Run and aim with the stick, tap to jump. She never stops shooting."
- **The pad is the crew pad.** Left half: the floating eight-way stick
  (`packages/minigames/brawl/src/client/CrewPad/resolveStick`, same numbers). Stick left or right
  runs her, its direction is where the sauce goes, stick down ducks. Right half: one button,
  JUMP. No third verb.
- **She never stops spraying.** A stream leaves her beak every `sauceEveryTicks` (9, lab) in the
  stick's direction, or the way she faces with the stick at rest.
- **Sauce is the pickup.** Every hen starts on the mild bottle (one stream). One hotter bottle
  lies in each stretch at a time: the spread (three streams), the long stream (reach and speed),
  the puddle (a splash that sits on the floor for two seconds and burns anything in it). A hit
  costs her the bottle before it costs her a heart.
- **Things shoot back, slowly and visibly.** Every shot flies level, as in the lab, so there is
  exactly one answer: jump a low one, duck a high one. A shooter flashes `telegraphMs` (600,
  lab) before it fires; shots fly `shotSpeed` (60 units a second, lab); her box is shaved by
  `forgiveness` (1.5 units, lab). Where these stop being fair is still to be played (§4.6).
- **The base's own kit.** The pull of the genre is to borrow, and the house rule is no
  recreation: no soldiers, no aliens, nothing of any one game's look. What shoots at the hens is
  the base's own: sentry turrets on the fences (the lab's turret, low or high), a tank that rolls
  in and lobs one slow shell, the motor-pool goose that runs at you (one peck of sauce takes it
  down), and the drill sergeant at the last gate, a big goose with a megaphone whose shouts are
  the shots. Final art and names are a pass of their own.
- **A stretch per pair, three stretches a game.** The fences, the motor pool, the parade square.
  Each is harder than the last (more shooters, faster rest between shots), and the first shot of
  each stretch is the slowest (principles §18).
- **Pairs are dealt round-robin from the room.** Two players: they run every stretch together.
  Three: A+B, C+A, B+C. Four: A+B, C+D, A+C. A player not in the pair watches on her own phone
  (§0.6) and is next up.
- **Three hearts each, then down.** A downed hen lies where she fell until her partner stands
  over her for a second and a half, the crew spec's revive. Both down ends the stretch: what they
  banked stays, and the next pair starts fresh.
- **The camera follows the lead hen** and walks the other along with its left edge, the crew
  spec's rule, so nobody is ever left behind where she cannot be revived.
- **The handoff.** The stretch is cleared when either hen reaches the far gate. The next pair is
  standing there, and each new hen inherits the bottle of the hen who arrives carrying one.
- **Worth over the course.** The score is the worth banked (shooters down, hearts carried
  through a cleared gate) over the worth of the course, as a number out of 15 (the teaser's
  `TEASER_POINTS_MAX`). Near misses are built in, as in Streets of Barrie.
- **Away, not abandoned.** A phone that goes quiet for ten seconds sits its hen down, untargeted,
  as in the crew spec, and any thumb stands her up. A phone that drops is dealt back in when it
  returns.

### 0.4 The sim (`packages/shared/src/borden`)

A pure, seeded, tick-stepped sim at 60 Hz, in the brawl crew sim's shape
(`packages/shared/src/brawl/crew`), with a copy of SCHLONIC's `noTranscendentals.test.ts`: it
must land on the same bits wherever it runs, because it runs in a Durable Object and on every
phone. The lab's `yardSim` (`apps/client/src/components/RunGunLab/yardSim`) is the first draft of
its physics: the jump arc, the buffered jump, the level shots, the duck height, the forgiveness.
Diagonal aim uses the fixed `0.7071` the lab does, never a square root.

### 0.5 The online room (`apps/teaser-worker`)

**Who runs the fight.** The room is the party server's crew turn, moved into a Durable Object:

- **One Durable Object per game room** (`TeaserRoom`, SQLite-backed, the Workers Free plan
  allows it). The Worker routes `POST /api/rooms` (make a room: returns its code) and
  `GET /api/rooms/:code/socket` (the WebSocket) to it by `getByName(code)`. Both paths join
  `run_worker_first` in `wrangler.jsonc`, with a `durable_objects` binding and a
  `new_sqlite_classes` migration.
- **The room runs the game's own runtime.** The same `MinigameRuntimePlugin` the party uses,
  imported as is: Streets of Barrie's runtime imports nothing Node-only and reads time only from
  `receivedAtMs`, and Base Borden's must be held to the same rule. The room supplies what the
  party server does: it stamps `receivedAtMs` from its own clock and `actorPlayerId` from the
  seat the socket holds, refuses an action that is not one of the game's `contestantActionTypes`
  or comes from a seat not in `selectCrew`'s `playerIds` (the party's
  `resolveCrewActionRefusal`), and fires `selectDeadlineAction`'s pulse on a timer while a
  stretch runs.
- **Every phone gets the frame.** After each action the room sends the game's view (host view
  equals display view for every arcade game, pinned by test) to every socket in the room. Each
  phone keeps the newest frame and steps its own copy forward at 60 Hz, exactly as the party's
  screens do (crew spec §0.5). Broadcasts are coalesced to at most one per 33 ms if a test
  shows the need, which the crew spec already planned for.
- **Seats come from the roster.** A phone that opens a room link sees tonight's birds from
  `/teaser-roster.json`, the same "tap your own face" as the party's player phones, with faces
  another phone in the room holds greyed out. No sign-in **(mine, §4.1)**. The seat lives in the
  socket's `serializeAttachment`, so it survives the room sleeping.
- **The room sleeps when nobody plays.** WebSocket Hibernation: in the lobby and on the end card
  nothing runs and nothing is billed. While a stretch runs, the pulse timer keeps it awake,
  which is a few minutes a game. A room that has been idle for 30 minutes deletes itself on an
  alarm.
- **Nothing a phone sends can take a room down.** Every message is shape-checked, each socket
  has the party phones' token bucket, a room holds at most four seats and six sockets, the
  socket upgrade checks `Origin` is wingnight.tv (the Worker's CSRF rule does not cover a GET),
  and making rooms goes through a `ratelimits` binding like `SIGNIN_LIMITER`.
- **Cost.** On the Free plan, 13,000 GB-s and 100,000 requests a day. A five-minute game at
  128 MB is about 40 GB-s, and two thumbs at a few messages a second are a few hundred billed
  requests (incoming messages bill at 20:1). Hundreds of games a day before anything costs
  money.

**Latency.** A Durable Object is created near the first request and stays there. Two players in
Ontario get a room in Toronto, and a thumb's round trip from phone to room and back is roughly
20 to 60 ms on Wi-Fi or 5G, well inside the 110 to 130 ms the lab found. A player far from the
room pays the distance: Barrie to a Vancouver-made room is about 70 ms each way, near the limit.
v1 does no prediction. If it feels late, the fix is the standard one, predicting her own hen's
run and jump on her phone and correcting to the room's frame, and step 1 measures whether it is
needed before anything is built on the answer.

### 0.6 The phone screen

There is no TV online: **every phone is its own screen.** A phone in the pair draws the scene
with the pad's two halves laid over it, which is the solo surface every arcade game already has
on the teaser (`TeaserSoloGame`, seat `solo`), fed by the room's frames in place of a local
reducer. Its own hen wears a ring in its slot colour, and the partner's hen is labelled with her
name. A phone not in the pair draws the same scene with no pad and a "you're next" line: the room
watching on its own screens. Phones vibrate on a hit where they can (Android), as the party pads
do, and the phone makes the sound, since there is no TV to be the speaker.

### 0.7 Order of work (each step ends with the gate green)

Gate: `pnpm lint && pnpm typecheck && pnpm test`, plus `pnpm test:e2e:portal` for anything under
`apps/teaser-worker`, the teaser's pages or `tests/e2e-portal`, and `pnpm test:e2e` for client
`.tsx` (CLAUDE.md).

1. **The online lab.** The jump lab's yard, run inside a Durable Object on a separate Worker on
   `workers.dev` (wingnight.tv untouched), with two phones each drawing the yard themselves. It
   answers the one question the LAN lab could not: two people far apart, through a real room.
   Brad and one other person play it; the readout gives each phone's round trip. Brad deploys it
   (`wrangler deploy` on the lab Worker), as he does every teaser deploy.
   **Built and deployed 2026-11-19** at `https://wingnight-lab.politicalrecord-site.workers.dev`
   (version `c0ed680f`). Two headless phones on the laptop in one live room stayed on the same
   tick, and the bot read **36 ms** thumb to picture and dodged 10 of 10. **Brad played it online
   the same day: "feels fine" (lab).** Step 1 answered: v1 needs no prediction. The Worker is `apps/teaser-worker/wrangler.lab.jsonc`
   (`wingnight-lab`, entry `src/labWorker.ts`, one `RunGunLabRoom` Durable Object per room); the
   room's rules are `src/labRoom/session`, plain functions tested on Node; the pages are a third
   Vite entry (`apps/client/vite.lab.config.ts`, `lab/`, `src/labMain.tsx`) built into `dist-lab`;
   the phone is `RunGunLab/Online`, which shares its thumbs (`RunGunLab/PadControls`) and its
   yard (`yardSim`, `Yard/Scene`) with the LAN lab. `/` makes a room, `/r/<CODE>` is the link to
   send, and each phone's header reads "thumb → picture" (a changed thumb to the room's frame
   that carries it) and its ping. The room runs the yard at 60 Hz on an 8 ms timer and sends
   every phone a frame each second tick and after every thumb; it holds four hens and six
   sockets, refuses junk, floods and other sites' pages, and forgets the yard when the last
   phone leaves. Run locally with the `wing-night-lab-online-room` and `wing-night-lab-online`
   launch entries; two headless phones in one local room stayed on the same tick and a bot on
   one dodged 10 of 10. Deploy is `pnpm lab:deploy` from the repo root; remove it with
   `wrangler delete -c wrangler.lab.jsonc` from `apps/teaser-worker`.
2. **The room, with Streets of Barrie in it.** `TeaserRoom`, the routes, seats, hibernation, the
   guards, and a teaser page that plays Streets of Barrie online. Tests run the room in Node
   (the Worker's existing `tsx --test` harness) and two browser contexts in `tests/e2e-portal`.

   **Built and deployed to wingnight.tv 2026-11-19** (Worker version `874d1b68`, on `main` as of
   `c93dcccc` merged in): two headless phones played one live room at `wingnight.tv/play`, and
   each saw the other's hen walk to the same spot. Not yet played by Brad. Where it is:
   - The wire: `packages/shared/src/teaserRoom` (messages, limits, the parser), beside the
     portal's contract. The roster parser moved to `packages/shared/src/teaserRoster` so the room
     and the pages read `teaser-roster.json` the same way, with the same fixture fallback.
   - The room: `apps/teaser-worker/src/teaserRoom/session` (plain functions, tested on Node with
     the real Streets of Barrie runtime, a whole game played to its end card) and the object,
     `src/teaserRoomObject.ts`, routed from `src/index.ts` at `/api/rooms/<CODE>/socket`.
     `wrangler.jsonc` gains the `TEASER_ROOM` Durable Object, its `v1` migration and a
     `ROOM_LIMITER` (30 sockets a minute an address).
   - The phone: `CrewPhoneBrawlSurface` in the brawl package's client (the shared `CrewScene`
     and `CrewPad` over it, stepped by `useCrewFrame` as the wall is), on the teaser page
     `TeaserOnlineGame` at `/play` and `/play/<CODE>`, with a card on the landing.
   - The test: `tests/e2e-portal/online-room.spec.ts`, two phones, one room.

   Where it moved off the plan above:
   - **No room-making route.** The page makes the code and the room exists the moment a phone
     opens it, so there is no `POST /api/rooms`.
   - **No hibernation yet.** The room is in memory on plain accepted sockets: a room is awake
     (counting Durable Object time) while any phone holds it open, lobby included, and a room
     the platform evicts is a fresh room the next time someone opens its link. Free-plan time
     still covers about 28 room-hours a day; storage and hibernation come if that ever binds.
   - **The lobby is the stepping out.** Everyone seated steps out at Start, and the room starts
     the first block itself (the party host's job). Later blocks start on the first crew thumb,
     as at the party. A phone that comes in mid-game watches until the next game.
   - **One team.** The game is played as the first seated player's team, with everyone seated
     on it, so every hen wears that team's colour and her slot's ring tells them apart.
   - **Names, not faces, in the lobby.** The birds are picked by name, grouped by team.
3. **The sim.** `packages/shared/src/borden`, from the lab's `yardSim`, with its bots and the
   no-transcendentals test.

   **Built 2026-11-20**, not yet played by anyone but its bots. Where it is:
   - `world`: `BORDEN_WORLD` (the lab's hen and shot numbers), the three stretches' kit,
     `resolveBordenStretch` (seeded layout, one stream a stretch), `resolveBordenPairs` (the
     round-robin above) and `resolveBordenCourseTotal`.
   - `simulate`: `stepBorden` / `advanceBorden` over a `BordenFrame`, the crew sim's shape (inputs
     stamped by tick, a terminal `outcome`, events kept for two seconds), and
     `resolveBordenHandoffBottles` for the next pair. A step never touches the frame it is handed,
     and a frame sent as JSON steps on to the same result (pinned by test).
   - `bots`: `bordenRunner` (jumps low, ducks high, stops to spray what is ahead, goes back for a
     downed partner) and `bordenMasher` (holds right). Across four seeds the runner clears all three
     stretches for a room of two, three and four, banking 72 or 73 of 74; the masher wipes most
     stretches.

   Calls the sim made that this file did not, all mine and all cheap to change:
   - **Every shot is level, the tank's too.** It fires a slow, big, low shell (half the shot's
     speed) rather than lobbing one, so the tank keeps the one-answer rule: jump it.
   - **Height decides what the sauce meets.** Standing, the stream leaves her at 11 units: it hits a
     high turret, a tank and the sergeant, and goes over a low turret and a goose. To spray those
     she ducks (the stream runs along the floor) or aims down from a jump. That is what gives the
     stick's aim a job beyond facing.
   - **The goose is low**, so it can be jumped as well as sprayed, and it hurts each hen once as it
     runs through her. A tank's body hurts her whenever she can be hurt.
   - **One shooter at a time.** Turrets, a parked tank and the sergeant take turns, round-robin, and
     only while they are in the window: one flashes for 600 ms, fires at the nearest hen, then the
     stretch's rest (900, 700, 550 ms). The first shot of each stretch flies at 60% speed.
   - **The sergeant holds the gate**: nobody gets past him while he stands, and he has 18 hp a hen.
   - **One hot bottle per stretch**, a different one in each stretch of a game, lying in the first
     screen or so. Spread: three streams about 19° apart. Long: faster and further. Puddle: a
     falling stream that leaves a two-second splash, burning what stands in it four times a second.
   - **A three-minute cap** ends a stretch as `timeout`. Nobody sees it; it is there so a stuck
     room ends.

   Open from the bots, for step 5 and the table: the runner dodges only one to five shots a hen a
   stretch, and a stretch takes 15 to 28 seconds. That is light pressure; whether it is too light is
   for people to say, and the knobs are `restTicks` per stretch and `BORDEN_WORLD`.
4. **The cast.** A `duck` pose and a sauce stream from the beak, in `packages/cast`. A new motion
   is a new pose in the cast, never a private redraw. The jump uses `fly` unless it looks wrong.

   **Built 2026-11-20**, seen in a static preview of drawn and costumed birds, not yet in a game:
   - **`duck`** is a new static pose. It takes the ride's crouch with the legs folded under the
     body (feet flat on the toe line just outside the hips, `CHARACTER_DUCK_STANCE`, socks not
     boots), pulls the head down into the shoulders (`CHARACTER_DUCK_HEAD_DROP`) and pitches it
     30° forward, presses the wing in and flattens the tail. It does not lean the bird: a lean
     about the foot lifted one heel and sank the other toe through the ground. A ducked bird
     stands about a quarter shorter, not the sim's half; the scene draws the sim's box, so
     nothing reads off the drawing's height.
   - **`spray`** on `Character` / `CharacterFigure` (`{ angle, tone }`) draws the stream
     (`CharacterSauce`): a jet pinching off into three drops, `primary` for mild and `heat` for a
     hot bottle. `angle` is degrees clockwise from straight ahead (-90 up, 90 down), so a
     left-facing bird the surface flips aims with it. It is drawn on the head, under the head's own
     drawing, so it rides the walk's nod and starts behind the beak, and it takes off whatever turn
     the pose holds the head and the bird at (`CHARACTER_HEAD_TURNS`, `CHARACTER_STANCE_TURNS`, held
     to the pose classes by test), so it always points where it is aimed.
   - **A costume head sprays from its rim, not its mouth.** From the mouth the stream crossed the
     likeness, and aimed up it hid the face. It now leaves the edge of the head on the side it is
     aimed, a little below the photo's middle, from behind the face.
   - The jump stays `fly`, as planned.
5. **The runtime package** `packages/minigames/borden` with the crew hooks, its rules, scoring
   and views, and the registry entries, scaffolded from Streets of Barrie. Not added to
   `content/sample/gameConfig.json`'s schedule.

   **Built 2026-11-20**, played through only by the sim's bots. Where it is:
   - `BORDEN` ("Base Borden", slug `borden`, rules key `borden`) in `MINIGAME_DEFINITIONS`, and a
     crew game (`CREW_MINIGAME_TYPES`), so the party server's crew turn would take it as one. The
     view is `BordenMinigameHostView` / `BordenMinigameDisplayView` in shared `roomState`.
   - `packages/minigames/borden/src/runtime`, Streets of Barrie's reducer in the base's terms: the
     room's clock is the only clock, a thumb is stamped at the tick it reads, a `pulse` steps the
     lulls, and the frame the room holds is the one that scores. Phones send `stepOut`, `stick`
     (`{ dir: 0..8 }`) and `jump` (`{}`); the host (online, the room) sends `startStretch`,
     `skipStretch` and `resetTurn`.
   - **The crew is locked when the first stretch starts.** Stepping out is open only while the
     fences are on the line; the order is the seats, up to four, and the pairs are dealt from them
     (`resolveBordenPairs`). A stretch's `pair` names the seats hen by hen, and a seat is a
     player's colour for the whole game.
   - **Later stretches start on the first thumb of their own pair**, 2.5 s after the last one
     ended, carrying the hot bottles handed on through the gate (none after a wipe or a skip).
   - **Nobody stepped out is the tablet's game:** one hen a stretch, the roster's players in turn,
     steered by the host's thumbs. This is what the sandbox plays.
   - **A player waiting for her stretch** gets an `out` pad; the view's `crew` and `pair` are how her
     phone knows she is next.
   - Registered on the server, the client and the dev sandbox (`/dev/minigame/borden`), with a
     briefing line, a SETUP glyph (a sauce bottle spraying) and an illustration, and rule defaults
     in `content/sample/gameConfig.json` with no round. The surfaces are placeholders until step 6.
   - Through the reducer, with a pulse in every quiet tick as the room would send it, the runner
     clears all three stretches for a room of two, three and four, banking 72 of 74 (15 points).

   For step 6: the teaser room still sends Streets of Barrie's `startBlock` to start a game, so its
   game table has to carry each game's start action. And from the bots: a pair that never moves
   forward is never shot at, because no shooter is in the window yet, so it sits until the
   three-minute cap ends the stretch as `timeout`.
6. **The phone surface and the teaser page.** `/base-borden` on the teaser, its picker card, the
   lobby (make a room, share the link, pick your bird), play, the end card and the phone's best.

   **Built 2026-11-21**, played in a local room by headless phones only. Where it is:
   - **The room plays either game.** `TEASER_ROOM_GAMES` is `BRAWL` and `BORDEN`, and
     `TEASER_ROOM_GAME_RULES` gives each its room page and its seats (Base Borden seats four). The
     socket path carries the game (`/api/rooms/<CODE>/socket?game=BORDEN`); the Worker names the
     Durable Object by game and code, so a code is a room only within its game, and the room plays
     the game its first socket asked for. The room's game table carries each game's start action
     (`startBlock`, `startStretch`), which was step 5's todo.
   - **The page is the Streets of Barrie room page, made per game** (`TeaserOnlineGame`): `/base-borden`
     makes a room, `/base-borden/<CODE>` is the link, the lobby, share sheet, seat count and end card
     take the game's own words (`onlineGameCopy`), and the end card shows the phone's best
     (`useRoomBest`, kept in the browser like the solo pages'). A landing card links it.
   - **The phone** is `CrewPhoneBordenSurface` in the runtime package's client: the base
     (`BordenScene`) stepped on between the room's frames by `useBordenFrame` (the crew games'
     anchor rule), and Streets of Barrie's own `CrewPad` over it, the stick sending `stick` and the
     right half sending `jump` on the press. Her corner tag shows her hearts and her hot bottle, and a
     player sitting a stretch out is told which stretch is hers. Every phone is its own speaker, on
     the house cues (`useBordenSounds`), and buzzes on its own hen's hits where it can.
   - **The scene**: the three stretches' own backdrops (chain link and watchtowers, the motor pool's
     trucks, the parade square's flagpoles and stand) under a far skyline at parallax, the gate, and
     on them the bottle, the turrets and the tank (flashing "!" with the barrel lit before they
     fire), the motor-pool goose and the drill sergeant (Barrie's goose from Streets of Barrie, the
     sergeant as its boss with a megaphone tipped to the coming shout's level), the shots, the sauce
     and the puddles, and each player's own cast hen in her slot colour, posed off the frame
     (`henArt`: down is `ko`, a hit `hurt`, airborne `fly`, stick down `duck`) and spraying the cast's
     stream at the stick's angle.
   - **The party surfaces** are real too: the tablet's `TakeoverCanvas` (Start, Skip stretch, Reset
     turn, the pad over the base on the tablet's own stretch) and the TV's marquee over the base, so
     `/dev/minigame/borden` plays.
   - The test: `tests/e2e-portal/base-borden-room.spec.ts`, two phones run and jump and see each
     other, and a third is told she sits the first stretch out.

   Not done in step 6: no results card naming people (the view's `turnStats` are there for it), the
     base borrows the house cues rather than sounds of its own, and nobody has played it on a phone.
7. **Docs, and Brad deploys.** Flip this file to Shipped with an as-built list, the README row,
   `DESIGN.md`, and delete the jump lab (its LAN half and its server namespace go with it).

### 0.8 Tests that pin it

- The sim is deterministic (no transcendentals), and its bots clear a stretch at pair, trio and
  four.
- The room refuses an action from a seat outside the crew, an action the game's phones may not
  send, a malformed message, a second claim on a held face, and a fifth seat.
- Two sockets in one room see the same frame after the same actions, and a socket that
  reconnects is back in the game from one message.
- Host view equals display view for the runtime, as for every arcade game.
- `tests/e2e-portal`: two browser contexts make and join a room, pick birds, play a stretch with
  scripted thumbs, and see the same end card.

### 0.9 If it ever goes to the night

Nothing above blocks it. The runtime is a crew game, so the party server already runs it:
phones are pads, the TV is the one picture, and the pairs come from the team in turn. What the
night would add is its schedule slot (it shares a pad with Streets of Barrie, so the two never
sit next to each other) and a pair crew in the party's crew turn, where the brawl's crew is
everyone who stepped out.

## 1) Principles check (docs/minigame-design-principles.md §11)

Most of the checklist is about the room at the party: a TV, a host, teams watching. Online on
the teaser there is no TV and no host, and the room is two to four people on their own screens,
maybe on a call. Where an item does not apply, it says so.

1. Clock on the TV, last ten seconds loudest: no TV. Each stretch has no clock; the shooters are
   the pressure. *Does not apply online.*
2. ★ Commit before reveal: the jump. Once she is in the air she lands where she lands. The gate
   is the stretch's larger one.
3. A hold after every success and failure: the hit flash and the stretch-end beat, as in Streets
   of Barrie. Yes.
4. Near misses: worth over the course. Yes.
5. No hidden modifiers: the kit is fixed by stretch and pair, never by score. Yes.
6. ★ A bad answer is plausible: there is no bank. The bad play is the content: both hens going
   for the one bottle, or one standing on her partner to revive her under a turret.
7. Judged by a human: not a creative game. *Does not apply.*
8. Failure is a comic consequence: a downed hen face-down in a puddle of her own sauce. Yes.
9. ★ Whole team moves or speaks: the pair has to talk (who takes the bottle, "get me up"), and
   online that means a call or a shout across a room. Weaker than at the party.
10. ★ Information asymmetry: attention. Each player watches her own hen; the shot coming for the
    other one is in plain sight of everyone but her. Collapses at every hit and at the gate.
11. The frame while content is secret: nothing is secret. *Does not apply.*
12. Standings only on results screens: the score is on the end card. Yes.
13. ★ What the watchers do: a player waiting for her pair watches on her own phone and calls the
    shots. With two players there are no watchers.
14. Every point lands within a second: on the phone that scored it. Yes.
15. ★ One verb line: "Run and aim with the stick, tap to jump. She never stops shooting."
16. Demo or practice beat: the first shot of the first stretch is slow and alone. Partly.
17. Never two decisions at once: run and jump are two thumbs, one each. Yes.
18. The first gate easier than the last: yes, by design.
19. Waiting on the host: there is no host. *Does not apply.*
20. Every body is the player's own bird: the roster's heads. Yes.
21. Team colour and heads throughout: on the teaser every hen wears her own team's colour, as on
    the other teaser games. Yes.
22. Fail states cost under five seconds: a revive is a second and a half, a lost stretch hands
    over at once. Yes.
23. ★ The sauce: nothing to mash and nothing to look at on the pad, so a thumb only has to find a
    half of the screen.
24. Ends on a reveal and react: the end card with every hen's tally. Yes.
25–26. The night's order and finale: not in the night. *Do not apply.*

## 2) Why online, and why a room and not a peer link

Brad's call. The reasoning behind the shape: two phones that talk straight to each other
(WebRTC) would skip the room, but they need a server to find each other anyway, behave badly
behind phone carriers' networks, and leave neither phone the referee, so the two could disagree
about who was hit. A room that runs the one runtime is the party's own model, a server keeping
the clock and the score, and it lets the same code serve the night unchanged.

## 3) Information asymmetry

Attention, as the crew spec argues for the four-hen brawl. Each player's eyes are on her own hen,
and a shot lining up on her partner is on both screens for its whole flash, in plain sight of
everyone but the one it is for. It collapses at the shot, and at the gate. With three or four in
the room, the waiting players see it from outside the fight and can call it. With two, it is a
double act and nothing more, which is fine for a teaser.

## 4) Open — Brad's to confirm or overrule

**Brad confirmed all seven picks below on 2026-11-19 ("go with yours")**, so each is now his
call as written. They stay listed so the reasoning is in one place.

1. **Who can join a room.** Mine: anyone with the room link, picking a bird from the teaser's
   roster, no sign-in, like the other teaser games. The alternative is signed-in guests only,
   with their own heads and names from the portal; safer, but most people who try the teaser
   are not signed in.
2. **How many in a room.** Mine: two to four, with pairs dealt round-robin. Exactly two is
   simpler and loses the relay, which was the pitch.
3. **Streets of Barrie first.** Mine: the room is built and proven with Streets of Barrie
   (online, two to four phones) before Base Borden's own code. It puts a playable online game on
   the teaser sooner, and it means Base Borden is built on a room that works.
4. **The online lab on its own Worker.** Mine: a separate Worker on `workers.dev`, so the live
   site is never touched by a throwaway.
5. **No prediction in v1.** Mine, until step 1 shows a far-away player feels it.
6. **Shot speed and the flash.** The lab's defaults (60 units a second, 600 ms) were fine for
   the jump; where they stop being fair is untested. Five minutes on the lab's sliders settles it.
7. **The kit and the name.** The turret, tank, motor-pool goose and drill sergeant are mine, as
   is "Base Borden".

## References

- [brawl-crew-spec.md](brawl-crew-spec.md) §0.5–§0.6: who runs the fight, and what a phone is.
- `apps/client/src/components/TeaserSoloGame`: how the teaser runs a party runtime with no server.
- `apps/teaser-worker`: the Worker the room joins, its routes, its guards and its tests.
- Cloudflare Durable Objects: WebSocket Hibernation (`acceptWebSocket`, `webSocketMessage`,
  `serializeAttachment`), placement near the first request, and the Free plan's limits,
  developers.cloudflare.com/durable-objects, read 2026-11-19.
- The run-and-gun genre (Contra, Metal Slug, Gunstar Heroes) for the shape: two players, one
  screen, pickups, a gate at the end. Genre only; no levels, characters or art.
