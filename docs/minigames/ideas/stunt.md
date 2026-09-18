---
name: STUNT
oneLiner: The TV deals a real-world challenge card ("balance a celery stick on the back of your hand for 30 seconds"), the active team does it in the room, and the host scores it Taskmaster-style with one tap — the body is the controller, the tablet never leaves the table.
confidence: promising
---

> **Read this first if you came here to build a tilt / balance / shake game.**
> Section 0 records why tablet motion sensors are dead on this stack, with the
> evidence. STUNT is the design that survived that finding.

## 0) Feasibility: tablet sensors are blocked on plain-HTTP LAN origins

**Verdict: do not build a sensor (tilt / balance / shake) minigame. The browser
APIs do not exist on the origin this app is served from, on either tablet
platform.** Checked 2026-09-16.

### The question

Wing Night serves the host surface over plain HTTP on the LAN
(`http://<lan-ip>:5173/host`, README "Open on devices"). There is no HTTPS
anywhere, and BACKLOG.md parks everything hosting-related (static serving,
certs, Dockerfile, socket-URL fallback). Can that origin receive
`deviceorientation` / `devicemotion` events?

### What the standards and engines say

- **The spec gates the whole API on secure contexts.** `ondeviceorientation`,
  `ondevicemotion`, `DeviceOrientationEvent` and `DeviceMotionEvent` all carry
  `[SecureContext]` in the W3C Device Orientation and Motion spec, and
  `requestPermission()` additionally requires transient activation (a tap) and
  rejects with `NotAllowedError` without it.
  [W3C spec](https://www.w3.org/TR/orientation-event/) ·
  [MDN DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
  ("This feature is available only in secure contexts (HTTPS)") ·
  [MDN requestPermission()](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
- **Chromium (Chrome for Android, Samsung Internet, the in-app browser here)**
  removed insecure-origin usage in 2019: "it will still be possible to register
  an event handler, it will simply never be fired" — and in current builds the
  interfaces are not even exposed (see the spike below). Device motion /
  orientation is on Chromium's list of powerful features restricted to secure
  origins. Only `https://`, `wss://`, `localhost`, `127/8`, `::1` and `file://`
  count as secure; a LAN IP does not.
  [Intent to Remove, blink-dev, Feb 2019](https://groups.google.com/a/chromium.org/g/blink-dev/c/5yqfAXibz1I) ·
  [Chromium: prefer secure origins](https://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features/) ·
  [Chromium: deprecating powerful features on insecure origins](https://www.chromium.org/Home/chromium-security/deprecating-powerful-features-on-insecure-origins/).
- **WebKit (every browser on iPad, since iOS forces the WebKit engine)** refuses
  the listener in `LocalDOMWindow::isAllowedToUseDeviceMotionOrOrientation`
  with `if (!isSecureContext()) { message = "Browsing context is not secure"; return false; }`
  and logs "No device orientation events will be fired, reason: Browsing
  context is not secure." On top of that, Safari 13+ requires the
  `requestPermission()` tap-prompt per origin.
  [WebKit source, LocalDOMWindow.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalDOMWindow.cpp) ·
  [WebKit blog: Safari 13](https://webkit.org/blog/9674/new-webkit-features-in-safari-13/) ·
  [Apple dev forum thread confirming HTTPS + gesture in practice](https://developer.apple.com/forums/thread/128376).
- **Firefox** never shipped the restriction (bug closed INACTIVE), but Firefox
  is not a plausible host-tablet browser and it changes nothing about the two
  above. [Bugzilla 1436874](https://bugzilla.mozilla.org/show_bug.cgi?id=1436874).

### What the spike showed against the real origin

A throwaway `apps/client/public/sensor-spike.html` was served by this repo's
Vite dev server bound to the LAN (`vite --host 0.0.0.0 --port 5373`) and
opened at the LAN IP and at `localhost` in Chromium 152 (the Claude desktop
in-app browser, `Chrome/152.0.7977.76`). The page was deleted afterwards.

| Origin | `isSecureContext` | `DeviceOrientationEvent` | `requestPermission` | `Accelerometer` | events in 3 s |
|---|---|---|---|---|---|
| `http://10.0.0.48:5373` — the real LAN origin | `false` | `undefined` | `undefined` | `undefined` | 0 |
| `http://localhost:5373` — loopback exemption | `true` | `function` | `function` | `function` | 0 (a Mac has no sensors) |

Same build, same page, same second. The only variable is the origin's secure
status, and at the LAN origin the constructors are not defined at all — there
is nothing to feature-detect, nothing to request permission on. This is the
Blink code path Chrome for Android runs.

**Not tested on a physical tablet.** No iPad or Android device was attached to
this Mac and the iOS Simulator needs a full Xcode install (only the command
line tools are present). The WebKit source and Chromium behaviour above are
engine-level, not device-level, so a physical run is expected to confirm, not
overturn. To repeat the test on the real tablet in a minute, drop this into
`apps/client/public/sensor-spike.html`, open `http://<lan-ip>:5173/sensor-spike.html`
on the tablet, tap the button, and read the page (then delete the file):

```html
<button id="ask">Tap: requestPermission()</button><pre id="out"></pre>
<script>
const o = document.getElementById('out'), L = {};
const set = (k, v) => { L[k] = String(v); o.textContent = Object.entries(L).map(([k, v]) => k + ': ' + v).join('\n'); };
set('origin', location.origin); set('isSecureContext', isSecureContext);
set('DeviceOrientationEvent', typeof DeviceOrientationEvent);
set('requestPermission', typeof (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission));
let n = 0; addEventListener('deviceorientation', e => set('events', ++n + ' beta=' + e.beta));
document.getElementById('ask').onclick = async () => {
  try { set('result', await DeviceOrientationEvent.requestPermission()); }
  catch (e) { set('result', 'REJECTED ' + e.name + ': ' + e.message); }
};
</script>
```

Expected on the LAN origin: iPad — `isSecureContext: false`, the tap rejects or
`events` never moves, and the Safari console shows "Browsing context is not
secure"; Android Chrome — `DeviceOrientationEvent: undefined`.

### Which tablet does the host use?

**Unknown — it is recorded nowhere in the repo.** DESIGN.md says only
"tablet-first"; Playwright runs Desktop Chrome; no device notes exist. It does
not change this verdict: iPad is blocked by WebKit, Android is blocked by
Blink. Record the model in DESIGN.md §2.1 when known, because it *does* change
the unblock cost below.

### What unblocking would actually cost (so nobody re-derives it)

1. **HTTPS on both origins, not one.** The page origin needs a certificate,
   and because the client and server are always separate origins with no dev
   proxy (CLAUDE.md), the Socket.IO server needs one too: an `https://` page
   cannot open a `ws://` socket (mixed content). That means `mkcert` certs for
   Vite *and* Express, then the tablet trusting the mkcert root — on iPad an
   installed profile plus "full trust" in Certificate Trust Settings, on
   Android a user-installed CA. Certs are tied to the LAN IP, which DHCP can
   change between parties. This is the parked hosting bucket in BACKLOG.md, not
   a minigame ticket. [web.dev: local HTTPS](https://web.dev/articles/how-to-use-local-https).
2. **Android-only shortcut:** `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
   with `http://<lan-ip>:5173`, once per tablet, re-done whenever the IP
   changes. Chromium's own page says "Avoid doing this". No iPad equivalent
   exists — iOS has no browser flags.
3. **Things that do not help:** Add to Home Screen / PWA install (does not
   change the secure-context status of an `http://` origin); a different
   browser on iPad (all WebKit); `localhost` (the tablet is not the server).

Even if 1 or 2 landed, sections 3–5 below hold two design strikes against the
sensor type independent of the API. That is why the recommendation is to not
revisit it, rather than to queue it behind hosting.

### The two fallbacks, on merit

**(a) Touch that feels physical** — buzz-wire tracing, hold-your-finger-still
"steady hand", two-thumb balance. Honest assessment: it scores objectively and
the TV can mirror it with the drawing package's stroke-streaming precedent, but
it is still one fingertip on glass — the exact thing the brief says all nine
concepts already are — and the drawing spec already fights sauce on the
touchscreen. Tremor-as-mechanic is real but small at fingertip scale. It would
be a full new package (runtime, two surfaces, streaming, e2e) for a game that
is spiritually the tenth fingertip game. Not recommended as the type; the best
of it survives as one *card kind* in STUNT later ("steady hand" on the tablet),
which is content, not engine.

**(b) Host-judged physical challenge** — recommended, and not as a consolation.
It is the only concept in the roster where the input is a whole person,
it is the only one where the wings make you *worse at it* in a way the room
can see, the engine cost is a trivia-shaped package with no streaming, and the
format has two decades of television proving the subjectivity is the comedy.
The rest of this doc is that game.

## Pitch

The TV deals a card. Big type, three lines: **CELERY BALANCE — balance one
celery stick on the back of your hand. 30 seconds. Drops reset the clock.**
The active team shoves forward whoever has the steadiest hands, and then
everyone watches those hands *not be steady*, because it's round three and the
sauce was Ghost Pepper and their eyes are streaming. The clock on the TV is
enormous. When it's done the host looks at the tablet, looks at the team, and
taps one of five verdict buttons. The team argues. The host does not care. Next
team, same card.

Why it earns a slot:

- **Nothing in the roster touches the body.** Trivia, Geo, Song, Read the Room
  are recall or judgement; Drawing, Emoji, Anamorph, Contraption, Petmon are a
  fingertip on a tablet. This is arms, hands, faces, standing up. It hits the
  people who lose every trivia round.
- **Spice is the mechanic, not a tax.** Every other game degrades as the night
  gets hotter and pretends it doesn't. Here the card is *designed* around
  shaking hands, watering eyes, milk mouth and sweaty grip. Round one and round
  three of the same card are different games, and that is the joke.
- **It is nearly free.** No streaming, no canvas, no sensors, no new
  dependency. State is a card id, a status and a verdict. The existing
  `MINIGAME_INTRO → MINIGAME_PLAY → TURN_RESULTS` loop *is* the game flow: intro
  reveals the card, play runs the clock, results shows the plaque. Manual
  scoring, skip, undo and the override sheet already exist.
- **The room plays.** Spectators are the jury, the host is the judge, and the
  TV is the evidence board. Taskmaster proved for ten series that arbitrary
  scoring by one person with a straight face is the funniest part.

## Rough rules

- **One card per round, the same card for every team.** Comparability is what
  makes the scores feel fair. The card is chosen deterministically from the
  round number and the pack (the same trick the genre-music rotation uses in
  BACKLOG.md), so per-turn runtime initialisation is harmless.
- **MINIGAME_INTRO = the deal.** TV shows the card: title, three-line brief,
  duration. The host reads it aloud; the team nominates a stunt-person (or the
  card says `whole team`). Existing briefing copy hook, no runtime state yet.
- **MINIGAME_PLAY = the clock.** The existing server-owned minigame timer
  (`stuntSeconds` via `timerKey`, the same plumbing as `drawingSeconds`) starts
  on phase entry, and the TV timer becomes the dominant element like EATING.
  Host tablet shows the card plus **host-only judging notes** (what counts, what
  is a drop, when to call it) and a five-tier verdict row. Verdict is
  tappable from the moment the clock starts, because some stunts end early
  (the milk got spilled at second four).
- **Verdict → points on the server.** Five tiers `NOPE / ROUGH / FINE / GREAT / FLAWLESS`
  map to shares of `pointsMax` — default `[0, 0.2, 0.4, 0.67, 1]`, so a
  15-point round pays `0 / 3 / 6 / 10 / 15` and the 20-point final pays
  `0 / 4 / 8 / 13 / 20`. Pending points accumulate and apply at
  `ROUND_RESULTS` like every other minigame. The verdict is the only action;
  re-tapping a different tier before the phase advances replaces it.
- **TURN_RESULTS = the plaque.** "GREAT — +10" in the same reveal language as
  Drawing's verdict plaques; the room reacts, the host advances.
- **Host hatches, in addition to the mandatory skip / redo / override:**
  `SWAP CARD` (deal the next card in the pack for this round — missing prop,
  someone can't do it, host doesn't like it) and `RESTART CLOCK`. Both are
  runtime actions; the override sheet stays for point corrections.

### State shape

Fully `SerializableValue`, smaller than Trivia's:

```
{ activeTurnTeamId, cardCursor, verdictTier | null, pendingPointsByTeamId }
```

The card itself is derived from `(cardCursor, round, pack)` on both surfaces
from content, so a display refresh mid-stunt restores the card, the clock (the
timer is a room-state field with `endsAt`) and any verdict already given.
Nothing streams. Nothing is lost.

### Content

`content/sample/minigames/stunt.json` → `content/local/minigames/stunt.json`,
same loader as every other pack, same `featuredPlayers` tagging if a card is
about a specific person ("do your best impression of Alex ordering wings").

```json
{
  "id": "celery-balance",
  "title": "Celery Balance",
  "brief": ["Balance one celery stick on the back of your hand.", "30 seconds.", "A drop resets the clock."],
  "hostNotes": "FLAWLESS = never dropped. GREAT = one drop. FINE = finished with drops. ROUGH = gave up late. NOPE = gave up early or used two hands.",
  "props": ["celery stick"],
  "who": "one",
  "modality": ["hands", "seated-ok"],
  "seatedVariant": "Same, seated, elbow on the table.",
  "spice": "Tremor is the whole game. Round three is chaos."
}
```

Sample pack, all using things already on a wing-night table:

| Card | Body part the sauce attacks | Props |
|---|---|---|
| Celery Balance | tremor | celery |
| Milk Run — carry a full cup to the far wall and back, no spills | sweaty grip, hurry | cup, milk |
| Poker Face — eat one wing of tonight's sauce and hold a straight face while the team stares | watering eyes | one wing |
| Hands Free — whole team eats a wing each, no hands, host judges cleanliness | everything | wings, napkins |
| Bone Tower — stack your team's wing bones one-handed, tallest wins | tremor, grease | bones |
| Human Timer — face away from the TV and say NOW at 30 s; host taps, server reads the delta | adrenaline, gasping | none |
| Napkin Hat — fold a napkin into something wearable and wear it for the rest of the round | grease | napkins |

`hostNotes` is the answer-safety analog: it lives in the host view only and
never enters `selectDisplayView`, so the projection test is the same shape as
every other game's "display is answer-free" test.

## The six questions, resolved

### 1. Tilt, balance or shake — and drop risk

For STUNT the answer is structural: **the tablet never leaves the host's hands
or the table during a stunt.** Zero drop risk to the device, by design rather
than by rule.

Recorded for the killed sensor type, because it would still apply if hosting
ever unblocked the API: **shake is disqualified outright**, and tilt/balance is
a bad bet too. The device is a 460–720 g glass slab (Galaxy Tab S10+ 571 g,
S10 Ultra 718 g; iPads similar), the hands holding it are greasy, the holder is
standing in a living room with a drink on the table and a 4K TV on the wall,
and Apple's out-of-warranty screen price runs roughly $249 (iPad) to $649 (13"
iPad Pro). Nintendo's 2006 wrist-strap replacement programme and the 2007
silicone Wii Remote Jacket exist because a 100 g controller with a strap still
went through televisions. A game whose win condition is "hold it level" is
also a game whose fail condition is a lunge. That is a design constraint, and
it points the same way the API does.
[Galaxy Tab S10 weights](https://en.wikipedia.org/wiki/Samsung_Galaxy_Tab_S10) ·
[iPad screen repair pricing](https://homeguide.com/costs/ipad-screen-repair-or-replacement-cost) ·
[Wii Remote strap incidents](https://en.wikipedia.org/wiki/Wii_Remote).

### 2. Continuous input vs server authority

STUNT has no continuous input. Its only actions are `swapCard`, `restartClock`
and `setVerdict`, all host-gated to the active team's turn like Drawing's
`markCorrect`. The timer is the existing server timer with `endsAt`; the client
only renders it (AGENTS.md §7). Everything survives a display refresh because
everything is in the snapshot.

For the record, had the sensor type been viable: the drawing canvas already
answers this — reduce locally, ship events. `DrawingCanvas` buffers pointer
samples and flushes at a ~15/s budget with `MAX_APPEND_POINTS_PER_ACTION = 64`,
the server clamps and sanitises, the TV replays server strokes. A sensor
version would reduce 60 Hz orientation samples to a few "zone" events per
second and send those; the raw stream never crosses the wire. What survives a
refresh is whatever the server holds, so score-relevant state must be events,
not the stream.

### 3. Accessibility

WCAG 2.1 SC 2.5.4 *Motion Actuation* (Level A) says functionality operated by
device motion "can also be operated by user interface components and
responding to the motion can be disabled". For a sensor game the honest
analog is a dial fallback — and a two-dial tablet game is ANAMORPH, which
already exists as a concept. The sensor version therefore adds nothing that
its own accessibility fallback doesn't already offer. Strike.
[Understanding SC 2.5.4](https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation.html).

STUNT has a real answer instead of a fallback: **the team chooses the body.**
A team routes around any individual's limits by nominating someone else, which
no sensor game can do because the sensor assumes the holder. Cards carry
`modality` tags (`hands`, `standing`, `face`, `voice`, `seated-ok`) and a
`seatedVariant`, the host has `SWAP CARD` when a card doesn't fit the room, and
nothing requires seeing or touching the tablet. `prefers-reduced-motion` still
governs the TV: the urgent-timer pulse is already the only motion and
`index.css` already disables non-essential animation.

### 4. What the TV shows, at 4K, from the couch

Three bands, fixed, no scroll, `100dvh`:

- **Top:** stage-local context row — round, sauce, active team — in the existing
  §2.3 language.
- **Middle:** the card. Title at `clamp(64px, 8vw, 160px)`, the three brief
  lines at ≥ 36 px each (the §4.1 section-title minimum), never more than three
  lines because the content schema forbids a fourth. During MINIGAME_PLAY the
  timer takes the middle at EATING scale (`text-7xl`+, tabular numerals, the
  `mockups/eating/01-spotlight` treatment), and the card shrinks to a marquee
  strip so both stay legible from across the room.
- **Bottom:** fixed standings footer, as everywhere.

On verdict the middle band becomes a plaque in Drawing's reveal language:
tier word huge, points beneath. No host-notes, ever, on the display.

### 5. How spice degrades it

It doesn't degrade it; it *is* it. Each card names the faculty the sauce
attacks (`spice` field) and the pack is curated so round one is fun and round
three is carnage: tremor (Celery Balance, Bone Tower), lacrimation (Poker
Face), grip (Milk Run), breath and time-sense (Human Timer). This is the only
game in the roster that gets *better* as the night gets worse, which is the
whole reason to build it.

### 6. Scoring shape and budget

One stunt per turn, so the ceiling is exactly `pointsMax` (15 default, 20 in
the final round), identical to every other game. Five tiers as shares of
`pointsMax` keep the host's tap coarse enough to be fast and defensible
("that was a GREAT, not a FLAWLESS, you dropped it once") while landing on
whole points. Ties are expected and fine. Shares live in
`gameConfig.minigameRules.stunt.tierShares` with the default above, validated
by `isRules` like Geo's `scoreBandsKm`. The Human Timer card is the only one
that wants an objective input (a host tap timestamp against server time → a
delta → a tier) and it can ship later as a second card kind without touching
the tier model.

## Open questions

- **Verdict timing.** Score inside MINIGAME_PLAY after the clock hits zero (the
  timer chip already shows TIME'S UP and the host controls the advance), or make
  TURN_RESULTS the judging screen? Leaning: in-play, so the plaque on
  TURN_RESULTS is a reveal, not a form.
- **Does re-initialisation happen per team turn?** `initialize` receives
  `pendingPointsByTeamId`, which suggests yes. If so, "same card for every team"
  must come from `(round, pack)` and not from state; confirm before speccing
  `cardCursor` semantics and how `SWAP CARD` persists across turns (it
  probably shouldn't — a swap is for this team's turn only).
- **Is one subjective tap enough?** Taskmaster's scoring works because the
  judge has authority and a script. Here the judge is a friend with milk on
  their shirt. Mitigations on the table: the card's `hostNotes` spell the tiers
  out in plain criteria, the undo hatch exists, and the room can be told
  "judge's decision is final" in the intro copy. The `prototype` question is
  whether that holds at round three, and it can only be answered at a table.
- **Props and safety vetting.** Cards use only what a wing night already has,
  and nothing puts sauce hands near eyes or involves throwing. The sample pack
  needs a once-over by someone who has hosted, and cards should carry a
  `notWhen` note ("skip if anyone at the table is allergic to X").
- **Pack size.** Eight rounds max per night, one card per round, so ~15 cards
  keeps two consecutive nights from repeating. Local packs are where the
  friend-group-specific cards live.
- **Where the touch fallback lands.** "Steady hand on the tablet" as a card
  kind is tempting but reintroduces grease-on-glass and a wiped tablet between
  teams. Park it until the physical pack has run once.

## References / inspiration

- Browser sensor landscape (all cited in §0): [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent), [Chromium Intent to Remove](https://groups.google.com/a/chromium.org/g/blink-dev/c/5yqfAXibz1I), [Chromium secure-origin policy](https://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features/), [WebKit LocalDOMWindow.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalDOMWindow.cpp), [Apple forum thread](https://developer.apple.com/forums/thread/128376), [Firefox bug 1436874](https://bugzilla.mozilla.org/show_bug.cgi?id=1436874), [web.dev local HTTPS](https://web.dev/articles/how-to-use-local-https).
- Tilt party-game precedent that *does* work: [Heads Up!](https://playpartygame.com/guessing-and-mystery-games/how-to-play-heads-up/) (native app, phone on forehead, tilt down = correct) and [Bounden](https://en.wikipedia.org/wiki/Bounden) (two people, one phone, gyroscope) — both native, both phones not tablets, both on HTTPS-free ground because they are not web pages. Browser tilt games like [TiltBump](https://itch.io/t/6404212/tiltbump-is-live-a-motion-controlled-browser-arcade-game) ship a mouse fallback and live on HTTPS hosting.
- Host-judged physical challenge as a format: [Taskmaster](https://en.wikipedia.org/wiki/Taskmaster_(British_TV_series)) (sealed task, 1–5 points, "arbitrary, comedic factors", born as a live Fringe show) and [Minute to Win It](https://en.wikipedia.org/wiki/Minute_to_Win_It) (60-second challenges with household objects, a "blueprint" card before each, party-game editions).
- Drop risk precedent: [Wii Remote wrist-strap replacement programme, Dec 2006](https://en.wikipedia.org/wiki/Wii_Remote).
- Accessibility: [WCAG 2.1 SC 2.5.4 Motion Actuation](https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation.html).
- In this codebase: reduce-locally-ship-events precedent in [drawing-spec.md](../drawing-spec.md) and `packages/minigames/drawing/src/client/HostDrawingSurface/DrawingCanvas`; tiered scoring via rules in [geo-spec.md](../geo-spec.md); timer-dominant TV treatment in `apps/client/public/mockups/eating/`; verdict plaques in DESIGN.md §2.5; manual score override and undo in `apps/server/src/roomState/scoringMutations`.
