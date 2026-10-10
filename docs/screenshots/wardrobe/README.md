# Wardrobe round — the 76px screenshots

The portal's wardrobe (docs/guest-portal-team-pick-plan.md, decision 7 and "The wardrobe
itself") gives each guest a `torso` slot and a `wing` slot with a rail per genre. The first-cut
rails are drawn in four prototype pages, each on the genre's shipping silhouette
(`packages/cast/src/Character/shapes`), on a drawn head and on a costume head:

| Page | Bird | Rail |
|---|---|---|
| `apps/client/public/mockups/cast/wardrobe-metal.html` | `spiky`, teamD chrome | battle vest, chain-mail shirt · spiked bracer, guitar pick patch |
| `apps/client/public/mockups/cast/wardrobe-pop.html` | stock bird, teamH pink | crop jacket, sequin tee · star patch, mic |
| `apps/client/public/mockups/cast/wardrobe-country.html` | `broody`, teamE | plaid shirt, bandana down the chest · horseshoe patch, banjo |
| `apps/client/public/mockups/cast/wardrobe-disco.html` | `preener`, teamB cyan | open shirt with one wedge, sequin shirt · medallion on the wing, tambourine |

Serve `apps/client/public` statically (the pages are ES modules, so `file://` will not do) and
open a page; the costume column needs the four heads in `apps/client/public/local-assets/avatars/`
(gitignored — copy any four from `~/wing-night-content/local/assets/avatars/` as
`rob-barnes.png`, `rosi.png`, `sara.png`, `kenny.png`).

## What the files are

- `wardrobe-<genre>-76px.png` — the strip at the foot of each page, at device scale 2: every
  candidate on that rail, plus the bare bird ("nothing") and the strongest torso + wing pair,
  each on the drawn silhouette and on a costume head, at **76px — the bird's actual size on a
  1080p TV**. This is the row the round is judged on; anything that does not read here is cut.

The whole page — the rules card, one card per candidate at 304px, 152px and 76px (76 last), the
measured rules line under each, the verdict and the strip — is the page itself: serve
`apps/client/public` and open `/mockups/cast/wardrobe-<genre>.html`.

## The rules the round is judged on

From the September apparel round, restated in the plan. The first three are measured on every
card from the item's drawn outline mapped back into the bird's 80×72 box
(`wardrobe-harness.js`); the last two are counted by the item's author and printed.

1. **Nothing above the chin** — no geometry at `y < 32` on either head. The comb is the bird's,
   not an item.
2. **Nothing right of x≈45 on the upper back** — on a costume head, no geometry with `y < 37`
   and `x > 45`, where a photograph's hair hangs.
3. **Nothing under the belly, nothing at the feet** — no geometry below the body's own underside.
4. **At most one white point on a chest** — two read as fangs.
5. **No white shape with a dark centre on the chest** — it reads as an eye.

Every item is a `bodyApparel`: painted after the body and the wing and before the neck and
head, so it rides the body under a photographed jaw and `crossesTheFace` is never needed. A ✗
on a card is reported, not fixed — the item is drawn anyway so Brad can cut it.
