// The critics' final verdicts on run 1b of the wardrobe build (the art
// polish), as data for outfit-gallery.html, the Gate 1 cut sheet.
//
// One entry per item variant (and per Move). `verdict` is "keep" | "fix" | "cut".
// `line` is the one-line reason the gallery tile shows; `reason` is the
// critic's full reasoning and `fix` the change it asked for (a fix verdict
// always has one; a cut or keep carries one when the critic proposed a
// replacement or an optional polish). A fix means the critic judged that art
// not good enough yet; the tile shows the art as it stands on disk now, so
// check whether the fix has landed.
//
// `unit` is the module the critic judged (metal-kit, pop-show, shared, moves…);
// `genre` is the page it belongs to ("shared" items are judged once and shown
// on all four genres; Moves carry the genre of the Move).
//
// country-kit has no run 1b critic verdict (its critic failed): its entries
// carry run 1's verdict where the art is unchanged, and a "fix" that says
// "not judged" where run 1b redrew it. Every such line starts "Not re-judged".

const UNIT_GENRE = {
  "metal-kit": "metal",
  "metal-show": "metal",
  "pop-kit": "pop",
  "pop-show": "pop",
  "country-kit": "country",
  "country-show": "country",
  "disco-kit": "disco",
  "disco-show": "disco",
  shared: "shared"
};

const MOVE_GENRE = {
  "horns-pump": "metal",
  "double-headbang": "metal",
  "heart-point": "pop",
  "sporty-hop": "pop",
  "boot-scoot": "country",
  "yeehaw-buck": "country",
  "night-fever": "disco",
  "the-bump": "disco",
  "chicken-dance": "shared"
};

const v = (unit, item, variant, verdict, line, reason, fix) => ({
  unit,
  genre: unit === "moves" ? MOVE_GENRE[item] : UNIT_GENRE[unit],
  item,
  variant,
  verdict,
  line,
  reason,
  ...(fix ? { fix } : {})
});

/** The country-kit entries this run could not judge: what the tile says instead. */
const NOT_JUDGED_FIX =
  "No critic has judged this drawing yet: the run 1b country-kit critic failed. Judge it by eye at 76px and 130 blurred, or send it back for a critic pass, before counting it as a keep.";

export const RUN_NOTES =
  "This is run 1b, the art polish: every run 1 fix was redrawn and every cut replaced, then judged again by a fresh critic (three rounds per unit; the Moves two). " +
  "The prop sweep was relaxed (docs/research/bird-wardrobe.md §2.1): props are drawn only in the parade, the intro lineup and the portal, never in a game, so the ride (+75) and hurt (+95) angles are gone. " +
  "At rest and the walk tuck a prop still stays out of the head box and above y 72.75; at the dance and Move extremes it may pass behind the head and dip 4 units under the foot line, so props are now held up and back like a performer's. " +
  "The country-kit critic failed this run, so country Tops, Sleeves and Tails carry run 1's verdicts, and the drawings run 1b changed are marked not re-judged. " +
  "Gold (#d4a72c) was settled at Gate 1: an optional style where it reads, never the default. The critics found it reads as well as white on the Flying V, the axe and the disco lamé (dagger collar, flare sleeve); it adds nothing over ember on the bandolier, turns the pom-pom into a sunflower and the mirror ball into a waffle, and is 1.30:1 on country's orange, so those items lost it. " +
  "Gate 1 (2026-10-20): Brad kept 132 tiles and cut 15; the cuts are gone from the modules, and the 39 kept fixes are drawn (the tiles marked fix made; 'why' says what was drawn and where the critic's numbers had to move to pass a measured rule). The fixes were judged by the art pass at 76 and 130 blurred, not by a fresh critic.";

/** Run 1b as the critics left it; Gate 1 is laid over it below as VERDICTS. */
const RUN_1B = [
  // ---------------------------------------------------------- metal-kit --
  v("metal-kit", "battle-vest", "a", "keep",
    "Black front panel with a fat chrome bolt; holds at 130 blurred. Core of Thrash, the best Look.",
    "At 76px it is a chrome bird with a black front panel and a fat chrome lightning bolt in it. At 130 blurred the bolt still shows as a white zigzag on black. It says AC/DC metal, has no face read and passes every rule. In Thrash, with the leather sleeve and the flying V, it makes the strongest look on the page."),
  v("metal-kit", "battle-vest", "b", "fix",
    "The flame patch reads as an orange egg. Three sharp tongues with deep notches.",
    "At 76px the flame patch is an orange teardrop with a small bump on top. At 130 blurred it is an orange oval on the black panel: it reads as an egg or a belly patch, not a flame. The tongues are soft C-curves, so the silhouette rounds off into a blob.",
    "Replace VEST_FLAME with one that has three sharp tongues and V notches deep enough for the black vest to show between them: \"M 57 55 C 52.4 55 50.4 51.8 51 48.6 C 51.4 46.4 52.6 44.8 52.2 41.8 L 55.4 46 L 56.6 38.6 L 60 44.6 L 62.6 41.4 C 63.6 44.6 63.6 47 63.2 49.6 C 62.6 53 60.4 55 57 55 Z\". The tips sit at (52.2,41.8), (56.6,38.6) and (62.6,41.4), with notches 4 to 6 units deep at (55.4,46) and (60,44.6), so the shape is still about 11 wide by 16 tall. Join the tips with L, not curves, so they stay sharp at 76px. Keep the solid ember fill with the 1.5 ink edge and nothing dark inside it. The top at 38.6 stays under the costume shoulders."),
  v("metal-kit", "bandolier", "a", "fix",
    "The X blurs to a black bow-tie. Narrower straps, square shoulder end, a cartridge on every arm.",
    "At 76px the X is a black blob with a triangular notch where the strap is cut flat at the top, plus five orange ticks. At 130 blurred it is a black bow-tie smear across the wing. The cross strap's upper arm carries no cartridge and ends in a long black arrowhead (the 43-degree strap cut level at y 37), which fills in the centre of the X. In the Pyro look it paints over flame-sleeve a and the whole body turns black-and-orange calico: the ember cartridges disappear into the ember flame.",
    "Narrow both straps to half 2.6 (5.2 wide), so the cartridges, still 9.6 long, stand well proud of each edge. Start the cross strap at the shoulder with a square end and no 12-unit run-past: CROSS = {from:{x:42.4,y:39.2}, to:{x:66,y:61}, half:2.6}. Its end corners then land at (40.6,41.1) and (44.2,37.3), so the top stays at or below 37. Keep the run-past only at the `to` end, where the body clip ends it. Put a cartridge on every arm so each strap reads as a belt: SLUNG at t [0.18, 0.62, 0.84] and CROSS at t [0.08, 0.68, 0.88]. Every cartridge stays at least 5 units from the crossing, which is now about t 0.30 on CROSS. In looks.js, Pyro should pair the X with leather-sleeve a or flame-sleeve b, not flame-sleeve a: ember on ember is what makes the calico."),
  v("metal-kit", "bandolier", "b", "keep",
    "One black sash with four ember cartridges standing proud: a bullet belt at any size.",
    "One black sash from the chin to the lower back with four ember cartridges standing proud of it. It reads as a bullet belt at 76px and at 130 blurred, and the outline is clean with nothing crossing. Clearly metal, no face read, passes the rules in both styles. The gold style adds nothing over ember."),
  v("metal-kit", "biker-jacket", "a", "keep",
    "Black body, chrome wing as a silver arm, chrome lapel V: a jacket over a light shirt.",
    "At 76px the body turns black with the chrome wing as a silver arm. The chrome lapel and zip under the chin join the chrome neck into a light V, so the costume bird reads as a black jacket over a light shirt. That is a jacket read, and it differs in value mass from the vest, which is a front panel on a chrome bird. Holds at 130 blurred and passes every rule."),
  v("metal-kit", "biker-jacket", "b", "keep",
    "The black jacket with one wide ember club stripe across the chest.",
    "The same black-body jacket with one wide ember band across the chest. At 76px and at 130 blurred it reads as a black jacket with an orange club stripe, clearly different from a's cold diagonal. Nothing thin, no face read (no eye pair near the bar), passes every rule."),
  v("metal-kit", "leather-sleeve", "a", "keep",
    "The whole wing in ink: the biggest value change in the unit. Leather on chrome.",
    "The whole wing in ink is the biggest value change in the unit and reads instantly at 76px and at 130 blurred. Leather on a chrome bird. No face read, passes the rules."),
  v("metal-kit", "leather-sleeve", "b", "keep",
    "A black wing whose hem breaks into three raked points: a ragged goth bat wing.",
    "At 76px it is a black wing whose trailing edge breaks into three raked points, with chrome showing in the arches between them: a ragged goth bat wing. At 130 blurred the black mass still has its spiky hem. The outline change makes it clearly different from a. The dark points hang over light, so no tooth or grin read, and it passes the sleeve fringe rule."),
  v("metal-kit", "flame-sleeve", "a", "keep",
    "The back half of the wing is one ember flame with three tongues streaming back: a wing on fire.",
    "At 76px the back half of the wing is one ember flame with three up-and-back tongues coming out of an ink front. The third tongue streams off the back tip against the dark TV. It reads as a wing on fire, and at 130 blurred as an orange tongue trailing back off black. No lobes pointing forward, so no maple leaf, and no face read. Its only problem is the Pyro pairing (see bandolier a)."),
  v("metal-kit", "flame-sleeve", "b", "keep",
    "A hot-rod flame decal along the ink wing: one big flat high-contrast shape.",
    "A hot-rod flame decal streaking along the ink wing. It reads as flames at 76px and at 130 blurred, it is the most iconic hot-rod mark in the unit, and it passes the rules. Surface only, but it is one big flat shape with high contrast."),
  v("metal-kit", "chain-loop", "a", "keep",
    "A fat chrome chain in a C behind the tail: one rope of steel, not a dotted line.",
    "At 76px a fat chrome chain hangs in a C below and behind the tail. Links alternate flat and edge-on with no dark gaps, so it reads as one rope of steel, not a dotted line. At 130 blurred it is a beaded light arc against the dark TV. It is a chain, slightly vertebra-like when blurred but acceptable. Reach is 8.4 of 10, the links have slits rather than round holes, and there is no eye read."),
  v("metal-kit", "chain-loop", "b", "fix",
    "The flail's tiny studs read as a sparkler or pom-pom. Six big spikes instead of eight studs.",
    "At 76px the flail is a 10-unit light starburst on a stick, which reads as a sparkler or dandelion. At 130 blurred the eight 2.4-unit studs melt into a fuzzy light pom-pom. The spikes carry the 'mace' read, and they are far under the 8-unit minimum feature.",
    "Use fewer, bigger spikes: spikeBall({x:5.4, y:40.8}, 4.6, 4.2, ctx.styleFill, 6, (20*Math.PI)/180), i.e. six cones 4.2 proud with 20-degree half-angles at 0, 60, 120, 180, 240 and 300 degrees. The 180-degree spike points straight back, and the overall span is about 17.6. The centre moves 1.2 right so the longer spikes keep the tail reach at about 9.5 or under (limit 10); re-run the tail rule. Edge the ball with EDGE_MITER (1.5) instead of THIN_MITER so the cones keep their outline after blur. Keep the three links, but nudge the lowest flat link to (5.2,35.6) so it meets the top of the new ball."),
  v("metal-kit", "spiked-cuff", "a", "cut",
    "Third failed cuff: the band reads as a horseshoe or headphones. Replace with an axe-head blade.",
    "At 76px and at 130 blurred the black band across three separate blades reads as a horseshoe or headphone band, not a cuff, and its two chrome spikes in the gaps read as two more blades. The spiky tail has no single stem to cuff, and this is the third try at the same idea. Replace it with a different read, e.g. the middle blade redrawn as one big chrome axe-head or cleaver."),
  v("metal-kit", "spiked-cuff", "b", "keep",
    "Three chrome spearheads lengthen every blade: the tail ends in spear points.",
    "Three chrome spearheads with ink collars lengthen every blade. At 76px the tail clearly ends in spear points, and at 130 blurred the three sharp tips hold against the dark TV. A real outline change: metal, fun, passes the rules (reach 5.6)."),
  v("metal-kit", "lava-tips", "a", "keep",
    "The outer halves of all three blades glow ember: red-hot steel against the dark TV.",
    "At 76px the outer halves of all three blades are ember with an ink edge and a wavy heat line, so the tail ends in three long glowing points. At 130 blurred they are three clear orange spikes on the dark TV. It reads as red-hot steel, mostly a colour change but the biggest one available against the TV. Different from b's flame plume, no mitten or finger read any more, passes the rules."),
  v("metal-kit", "lava-tips", "b", "keep",
    "A big ember flame mass behind the chrome blades: the clearest tail silhouette change.",
    "A big ember flame mass behind the chrome blades. At 76px and at 130 blurred it reads as a tail on fire, the clearest silhouette change in the tail slot. Fun and metal, passes the rules (reach 9.6)."),
  v("metal-kit", "combat-boots", "a", "keep",
    "Chunky black boots on a thin chrome lug sole: plainly standing in boots, both styles.",
    "Chunky black boots with a thin chrome lug sole replace the orange feet. At 76px the bird is plainly standing in boots, and it still is at 130 blurred. The white style reads as white boots on an ink sole. Passes every rule in both styles."),
  v("metal-kit", "combat-boots", "b", "keep",
    "Ink uppers on a deep light slab: KISS-style platform stompers.",
    "An ink upper on a 5.8-deep light slab. At 76px it reads as platform stompers: a KISS-style silhouette clearly different from a. The slab holds at 130 blurred, and the white style (white upper, ink slab) reads too. Passes the rules."),
  v("metal-kit", "combat-boots", "c", "fix",
    "Toe plus heel plate reads as a two-tone sneaker. Drop the heel, one big steel toe cap.",
    "At 76px it is a black boot with a small light wedge at the toe and a light speck at the heel, which reads as a two-tone sneaker (toe plus heel) more than a steel-toe New Rock. The heel plate is 4.4 x 4.2, well under the 8-unit minimum, and turns into noise at 130 blurred.",
    "Drop the heel plate entirely, so the light shows at one end only, as a steel toe. Make the toe cap longer and wrap it over the instep: toe = `M ${ax+0.6} 63.6 L ${ax+5.4} 63.6 L ${ax+9.8} 67 L ${ax+9.8} 70.4 L ${ax+0.6} 70.4 Z`, 9.2 long by 6.8 tall, chrome fill with EDGE_MITER (1.5) instead of THIN_MITER. Leave the boot path as is. The result is a dark boot with ONE big angular steel cap, distinct from a's sole line and b's slab."),
  v("metal-kit", "spiked-boots", "a", "fix",
    "The horn tapers to a white stripe or skate blade. Make it a fat 7-unit cone.",
    "At 76px the horn is a long light sliver lying parallel to the sole. It tapers so fast that most of its 14 units are under 3 tall, so it reads as a white stripe or a skate blade on the boot. At 130 blurred it is a light streak, not a spike.",
    "Make it a fat cone rather than a needle: spike = `M ${ax-3} 61.8 L ${ax+10} 65 L ${ax-3} 68.8 Z`. That is 13 long and 7 tall at the base, with the base buried in the ink shaft, the upper half out over the dark floor in front of the shin, and the lower half chrome-on-ink over the toe cap. The tip stays at leg.x+9, inside the boots band, and the top at 61.8 stays under the belly. Stroke it EDGE_MITER (1.5) so the 0.8 gap to the belly's ink line reads as separation. A 7-unit base reads as a horn at 76px; a 5.2 base that tapers to a stripe does not."),
  v("metal-kit", "spiked-boots", "b", "cut",
    "The chrome strap under the chrome belly reads as a belly hem; no spike read. Fold into Combat boots.",
    "The chrome strap sits at y 60.4 to 64.8, right under the chrome belly, so at 76px it reads as a thickened light hem on the belly. At 130 blurred it is a light bar, and the pointed ends are 2-unit nubs. There is no spike read, and the 9-unit boots band leaves no room for a second spike unlike a. If no replacement reads, fold this item into Combat boots as its own note says."),

  // --------------------------------------------------------- metal-show --
  v("metal-show", "flying-v", "a", "fix",
    "White and gold read as a slung guitar; the ink style is a black plank. Drop ink.",
    "White and gold read well. At 76px the white guitar is a diagonal guitar slung across the tail, with a flared headstock, an ink nut bar, a pickup bar and a notched V at the hip. In Thrash, against the ink sleeve, it is the brightest and clearest shape on the bird, and gold reads just as well. The ink style fails the read. The ink fill and the 4u ink outline merge into one black mass, the notch closes up, and the headstock goes dark against the dark gap between the tail blades. At 76px and blurred 130px it is a black plank with two grey dashes, more like a quiver or a bazooka than a Flying V. Every measured rule passes; only the ink style misreads.",
    "Drop the ink style: styles [\"white\", \"gold\"], the same call b already made for the same reason. If an ink guitar is wanted, paint the ink-style shapes a second time, clipped to themselves, with a mutedWarm #b3a89a inner keyline 1.4 wide just inside the outline, so the notch and the headstock flare read against chrome and the dark background. Change nothing else; white is the default and it works."),
  v("metal-show", "flying-v", "b", "keep",
    "a's white guitar plus an ember strap chevron at the shoulder. The Thrash guitar.",
    "It is a's white guitar, which reads, plus an ember strap that shows at 76px as an orange chevron with its point at the shoulder (42,41.5). It reads as a guitar with an ember strap and brings metal's accent onto bare chrome. White and gold both read, and there is no ink style to fail. Every rule passes (ext 5). It is close to a, but the strap is a real visible difference for Brad to cut between."),
  v("metal-show", "flying-v", "c", "fix",
    "Best Flying V in white and gold, upright behind the tail; ink is a tombstone slab. Drop ink.",
    "White and gold are the best Flying V on the rail. At 76px the guitar stands upright behind the tail, the neck rises over the dorsal spikes to a clear blade headstock, the V body opens down on the wing, and both legs stand clear. Blurred it still says upright guitar. The ink style fails worse than a's: the neck and headstock sit almost entirely against the dark background, so at 76px and blurred it is a black vertical slab with two grey dashes, like a tombstone or an ironing board, and the V body on the wing shrinks to a black wedge.",
    "Drop the ink style: styles [\"white\", \"gold\"]. Or, if ink is wanted, use the same mutedWarm #b3a89a inner keyline, 1.4u, as the fix for a. Geometry stays as is (J [25.5,37], deg 74, n 23)."),
  v("metal-show", "drumsticks", "a", "fix",
    "The meats sit on the legs and blur into an orange skirt. Raise the X, splay the meats out.",
    "The white crossbones X on the belly reads at 76px. The two ember meats, though, end at t (19,60.5) and (60,60.5), level with the hips (y 57) and only 2 to 3 units sideways from the shanks. In the Drummer look, blurred at 130px, each meat sits right on top of a leg: the meats and the orange shanks merge into an orange skirt or a pair of bloomers, and the meats read as the bird's own fat orange thighs or flippers rather than drumsticks. This is run 1's fusion problem moved up from the toes to the shanks. The low hang under the belly is also the pose the new sweep rule exists to retire.",
    "Raise the knuckles and splay the meats out past the legs and above the hips. Stick 1 goes from k [31,42.5] to t [64,55]; stick 2 from k [49,42.5] to t [14,55]. Keep r 3.7 and meat 0.33. That makes the X about 20 degrees, still a crossbones. The meats then span roughly x 14..25 and x 53..64, with their lowest edge near y 57.5, so each sits at least 6 units sideways from the shanks (x 32..50) and the orange legs stand fully clear below. Check at the rest and walk-tuck angles that the front knuckle's top (about y 38 with the outline) stays below y 37, the head box's bottom. If it touches, drop both knuckles 1 unit to y 43.5 and keep t. Then re-judge the Drummer look blurred: the meats should sit against the dark beside the belly, not on the legs."),
  v("metal-show", "drumsticks", "b", "keep",
    "One stick raised, one swung forward: drumsticks mid-hit, a lopsided λ.",
    "At 76px it is one drumstick raised, its ember meat in the dark above the tail root, and a second stick swung forward under the wing to an ember meat ahead of the far leg. The meat has a visible gap and an ink outline between it and the far shank, both drawn and blurred. It reads as drumsticks mid-hit, a lopsided λ, clearly different from c's high X and a's low X. The low stick does run across the belly a little like a skewer, which is a mild wing-night gag, not a misread. Both styles pass every rule (ext 9.8)."),
  v("metal-show", "drumsticks", "c", "keep",
    "The strongest: crossed chicken drumsticks held up behind the back like a drummer counting in.",
    "It is the strongest drumstick. At 76px two ember meats fan up in the dark above the tail, over a white X of bones with knuckle knobs at the wing: crossed chicken drumsticks, a crossbones emblem held up behind the back like a drummer counting in. Blurred it stays two drumsticks crossed. It sits far from the orange feet, keeps behind the head column, and has no eye or teeth read. Gold reads too. Every rule passes."),
  v("metal-show", "battle-axe", "a", "keep",
    "A double-bit axe stood upright behind the tail: the clearest prop silhouette in the unit.",
    "At 76px and blurred it is unmistakably a double-bit axe stood upright behind the tail. The two white crescent bits and the spike cap stand out against the dark above the back, on a bone haft with a knuckle foot. It is the most instantly readable prop silhouette in the unit, says Viking metal, and gold reads equally well. It stays clear of the head, and every rule passes (ext 9.5)."),
  v("metal-show", "battle-axe", "b", "keep",
    "A bearded hatchet slung over the shoulder: lopsided and diagonal where a is upright.",
    "It is a hatchet held over the shoulder: a long white bone haft slung diagonally with one bearded bit up top. It reads as an axe at 76px and blurred, a little weaker than a because the single bit is smaller, but it is a clearly different silhouette (lopsided and diagonal, where a is symmetric and upright). The gold bit is very clear. Every rule passes (ext 9.7)."),
  v("metal-show", "lava-disc", "a", "keep",
    "A dark disc with ember fissure forks at each end: cracked lava crust, the quietest of three.",
    "At 76px it is a dark disc with two ember fissure forks, one at each end, and the middle under the feet stays dark, so blurred it never makes a single crescent grin. It reads as a cracked lava crust, and the orange toes stay distinct. A faint risk: the two forks hooking up at the ends have a handlebar-moustache rhythm at 304px. That read is not visible at 76px. It is the quietest of the three lava variants."),
  v("metal-show", "lava-disc", "b", "keep",
    "A bright lava pool with the bird on a black rock slab: the loudest stage.",
    "It is the loudest stage. At 76px it is a bright ember lava pool with the bird standing on a faceted black rock slab, and blurred it is still a lava lake with a rock. The slab cuts the ring from back rim to front rim, so it does not read as an eye or a ring, and its value contrasts strongly with a and c, which are dark discs with orange accents. The small ember crack notches at the slab's lower corners barely show at 76px. Every rule passes."),
  v("metal-show", "lava-disc", "c", "keep",
    "Three twin-tipped flame tongues lick up at the ends of an ink disc: plainly fire.",
    "Three ember flame tongues with twin tips lick up at the ends of an ink disc, two behind the tail and one past the chest. At 76px and blurred it is plainly fire, pyro-metal and fun. There is no front lip, so there is no crescent grin, and the flames sit in the stage band clear of the head. It is a different outline from a (cracks) and b (pool)."),
  v("metal-show", "bolt-disc", "a", "keep",
    "Two ember lightning bolts flank the bird like a band logo: the most metal stage.",
    "Two outlined ember lightning bolts flank the bird on an ink disc. They read instantly at 76px and blurred, like a band logo, and are the most metal stage on the rail. They are symmetric and clear of the legs, and every limb is wide enough. Every rule passes."),
  v("metal-show", "bolt-disc", "b", "keep",
    "One big white bolt strikes the disc behind the tail. The scorch strokes barely show.",
    "One big white bolt strikes the disc behind the tail, and reads clearly at 76px and blurred. It is white and lopsided where a is an ember pair, so it is clearly different. The two short ember scorch strokes are a 3px orange ^ at 76px and add almost nothing. They are harmless and read as neither teeth nor a grin, but they could be thickened from 2.6 to 3.4 or dropped. Every rule passes."),

  // ------------------------------------------------------------ pop-kit --
  v("pop-kit", "crop-jacket", "a", "fix",
    "A white bib or napkin, not a jacket. Open the front to show pink, raise the hem.",
    "At 76 it is a white rectangle on the chest with a black underline: a bib or napkin, not a jacket. The pink V is a 3px dark tick, and nothing about the outline says jacket or crop. Blurred at 130 it is a white price tag. In Baby it merges with the white puff-sleeve (top/sleeve 1.00 warn), so the top and the sleeve read as one white lump.",
    "Make it read as an open-front jacket by value, not by the notch. Stop the white 5u short of the body's front outline from y 41 down, so a vertical pink strip about 5u wide x 10u tall shows between the jacket's front edge (ink 2u, running down about x 69) and the outline. That is an open jacket over the bird. Raise the hem to y 50 (the rib band at 50-54) so at least 8u of pink belly shows under it before the legs. Drop the V notch. Optional: a 2.5u ink lapel line from (60,38) to (66,46) on the white. For the Baby look, put puff-sleeve b (white star) or a team-pink cuff against it rather than all-white."),
  v("pop-kit", "crop-jacket", "b", "keep",
    "A black chest block with a pink star and a white rib hem: a star bomber.",
    "At 76: a black chest block with a clear pink star and a white rib line at its hem. It reads as a star bomber or pop-star top and is clearly pop. Values are ink against pink against white, there is no face read, and the measured rules pass (ink 5.31:1). It is not worn with puff-sleeve b in any Look, which is correct because they share the pink star."),
  v("pop-kit", "tracksuit-top", "a", "fix",
    "Curved stripes read as a rib cage. Straight parallel bars plus a zip line.",
    "At 76 and at 130 blurred, the two white stripes follow the curved front edge as '))' brackets on black, which reads as a rib cage or skeleton side view. In white style (ink brackets on white) it reads as zebra ribs. In Sporty the stripe-sleeve a arcs sit right beside it, so the whole bird is stacked white crescents.",
    "Straighten the stripes: two straight 2.6u white bars on one fixed slant, parallel to each other and not to the body edge. Run them from (61,39) to (67,56) and from (65.5,39) to (71.5,56), clipped to the body, ending square at the y 56 hem. Add a 2u white zip line from (58,38) to (62,56) so the front reads as a zipped track top. Then nothing curves, so there is no rib read, and in Sporty the straight front stripes contrast with the sleeve's arcs. Keep white style only if the ink bars on white also read as straight stripes; otherwise drop white."),
  v("pop-kit", "tracksuit-top", "b", "keep",
    "White yoke, pink band, ink body on one diagonal: a nineties shell suit.",
    "At 76: a white yoke, then a steep team-pink band, then an ink lower body, which is three clear values on a diagonal. It reads as a nineties shell suit, distinctly unlike a's stripes and unlike crop-jacket's level hem. There is no face or rib read and it passes the rules (ink 5.31:1)."),
  v("pop-kit", "little-black-dress", "a", "fix",
    "Reads as a black belly, not a dress. Flare an A-line skirt past the outline, lower the neckline.",
    "At 76 the bird just has a black belly. The pink waist wedge is about 3px and reads as the outline denting, and the pink band under the hem is hidden behind the legs. Blurred at 130 it is a dark underside or shadow, not a dress. In Posh, with ink go-go boots, the whole lower half goes black.",
    "Make the dress an outline change. Give the skirt an A-line flare 3u past the body outline at the front-bottom: the hem runs from under the wing at (44,59) to a kicked-out corner at (77,57), inked 2u, so a black triangle of skirt shows against the room in front of the legs. Lower the neckline to a straight edge at y 44, with two 2.5u ink straps from (55,37) to (57,44) and from (62,38) to (63,44), so a large pink chest area (about 10u tall) shows above. That makes it pink bird, then dress, rather than a black-bellied bird. Keep the hourglass wedge but make it 9u deep so it survives 76."),
  v("pop-kit", "little-black-dress", "b", "keep",
    "Strapless black dress with a pink bow at the waist: a Posh garment, not a belly.",
    "At 76: a pink shoulder band above a straight black neckline and a pink bow at the waist that stands out on the black. It reads as a strapless black dress with a bow, which is a Posh cue, and it is clearly a garment rather than a belly because of the pink band and the bow. Measured rules pass (ink 5.31:1) and there is no face read."),
  v("pop-kit", "union-jack-dress", "a", "fix",
    "Identical to b at 76: the skirt hides under the wing. Make it the flared-skirt flag dress.",
    "At 76 it is indistinguishable from b: the plain ink skirt sits under the wing and behind the legs, so all you see is the same jack patch, a white asterisk on the chest. Its team style is the same picture again (outline only, 1.00:1). Two near-identical variants give Brad nothing to choose between.",
    "Make a the flag dress whose skirt carries the silhouette. Keep the jack bodice (y 40-52, waist raised from 56). Then give it an ink skirt that flares 3u past the front-bottom outline, hem from (44,60) to (77,58), with a 3u white hem band at y 57-60 so the skirt reads as a separate, flared piece below the flag. Drop the team style, which duplicates ink at 76. b stays the straight tube; a is the bodice plus flared skirt."),
  v("pop-kit", "union-jack-dress", "b", "keep",
    "A bold white jack on the chest: unmistakably Ginger even blurred.",
    "At 76: a bold white cross/asterisk on the chest. Blurred at 130 it is an unmistakable Union Jack, the Ginger signifier, and it passes the rules for ink. LOOK NOTE: Ginger pairs it with union-jack-flag in ink (top/prop 1.00 warn), which repeats the motif in the same value. Give Ginger a white prop (star-mic) or put the flag in white."),
  v("pop-kit", "stripe-sleeve", "a", "keep",
    "Two white bands down the wing's long axis: tracksuit arm stripes.",
    "At 76 in team style: two white bands running down the wing's long axis, which read as tracksuit arm stripes. In ink: a black sleeve with two white bands, clean with no grin read (the arcs are convex up and follow the wing). Passes the rules. It only looked rib-like stacked next to tracksuit-top a's curved stripes, and that is fixed on the top."),
  v("pop-kit", "stripe-sleeve", "b", "keep",
    "Three crisp slanted white bars: the sportswear three-stripe mark, the clearest sporty item.",
    "At 76: three crisp white slanted bars on the wing, the sportswear three-stripe mark. It is the clearest sporty-pop item in the set. The ink style (white bars on a black sleeve) still reads as a striped sleeve rather than a grille because the bars are slanted and evenly spaced. Passes every rule."),
  v("pop-kit", "puff-sleeve", "a", "fix",
    "The ruffle lobes are under minimum size and blur toward teeth. Three big lobes on a pink cuff.",
    "At 76 the ruffle is a thin white fringe about 3px deep under the wing. The lobes are 3-4u deep, under the 8u minimum feature. Blurred at 130 the row of small rounded white lobes under the ink cuff line drifts toward a row of teeth. In Baby it merges with crop-jacket a's white (top/sleeve 1.00).",
    "Fewer, bigger lobes: three lobes instead of one per scallop tip, each about 9u wide and 6u deep, hanging from the smoothed cuff line from x 26 to x 50. Overlap them 2u so they read as one frill and not separate teeth, inked round the outside only as now. Give the cuff line itself a 3u team-pink band, as CUFF_WING does, so the frill hangs from a coloured edge, separated from any white top above it. Wear it in Baby only with a non-white top, or with crop-jacket b."),
  v("pop-kit", "puff-sleeve", "b", "keep",
    "A black sleeve carrying one big star, pink or white: clean, clearly pop.",
    "At 76: the whole wing is a black sleeve carrying one big star, pink in team style and white in white style. Both stars are clean and clearly pop, with no eye read (a star, not a dot) and strong value contrast against the pink body. Passes the rules."),
  v("pop-kit", "big-bow", "a", "keep",
    "An unmistakable bow tied across the fan tail, in white, team and gold.",
    "At 76 an unmistakable bow tied across the fan tail in white, team and gold. In team style the ink outline carries it on pink, and the gold trial reads too. A strong outline change, clearly Baby/pop, with no face read."),
  v("pop-kit", "big-bow", "b", "keep",
    "A bow perched on the top feather's tip: a ponytail bow, a real choice against a.",
    "At 76 a bow perched on the top feather's tip with its loops standing out above the fan, reading at once as a ponytail bow. Its placement differs from a (on the fan), so the two give a real choice. Reads in all three styles."),
  v("pop-kit", "ribbon-streamers", "a", "fix",
    "Thin slashes that read as feather tips; invisible in team. Wider, longer, knotted ribbons.",
    "At 76 in white: two thin white slashes at the tail tips that read as white feather tips or tick marks, not ribbons. The swallowtail fork is sub-pixel. In team style the pink ribbons on the pink tail disappear completely; the tail just looks a bit longer.",
    "Widen each ribbon to 5u, tapering to 4u, and lengthen it to about 20u, with one big S-wave of amplitude 4. Tie both at a single visible knot: a 6u white circle-and-loop at the middle tail tip, so they read as ribbons tied to the tail and not loose flecks. Splay them 35 degrees apart. Make the swallowtail 5u deep. Drop the team style and use ink as the second style, with white and ink ribbons alternating if two styles are wanted."),
  v("pop-kit", "ribbon-streamers", "b", "fix",
    "A white plume or smoke puff, a pink extra feather in team. Add the gymnast's baton.",
    "In white at 76: a white S-squiggle off the top feather, which reads as a white plume or puff of smoke as much as a gymnast's ribbon. In team style it is a pink squiggle that merges with the tail as one more curly feather. It fails the read in one of its two styles.",
    "Add the stick: a 2.5u ink baton about 10u long angled up and back from the top tail tip (from tip to tip + (-6,-8)), with the ribbon starting from its end. That is the rhythmic gymnast's ribbon, which nothing else in the set looks like. Keep the ribbon 5u wide and cascading in its S. Drop the team style; offer white and ink only."),
  v("pop-kit", "platform-trainers", "a", "keep",
    "Chunky white uppers on a warm-grey platform slab: Sporty platform trainers.",
    "At 76: chunky white uppers on a warm-grey platform slab that holds against the dark floor. It reads as platform trainers, Sporty. In team style the pink upper on the grey slab still reads as a chunky shoe. Passes the floor rule."),
  v("pop-kit", "platform-trainers", "b", "keep",
    "White high-tops on an ink band over a white ledge: a Buffalo-style stacked sneaker.",
    "At 76: white high-tops on an ink band over a white platform ledge. It reads as a Buffalo-style stacked sneaker and is distinct from a's grey slab. Toe box and ledge carry the silhouette. Passes every rule in both styles."),
  v("pop-kit", "go-go-boots", "a", "fix",
    "Ink shanks read as black stick legs. Wider flared boot, longer toe, white default.",
    "At 76 in ink the 6u shank with its 2u stroke reads as black stick legs, black stockings rather than boots. The single 2.2u shine is a 2px line, and the pointed toe and heel notch vanish. In white style it reads as white legs. In Posh it merges with the LBD's black lower half into one dark mass.",
    "Widen the shank to 8u (x-4.5 to x+3.5) and flare it to 10u at the top (x-5.5 to x+4.5 at y 56), so the top of the boot reads as a boot mouth against the belly. Extend the pointed toe to x+11 so the point silhouettes against the floor. Raise the heel block to 3u tall with the notch 3u wide. Make the white style the default (white knee-highs are the sixties go-go icon, and b already owns the ink-with-white-cuff read). Keep ink as the alternate, with a 3u shine."),
  v("pop-kit", "go-go-boots", "b", "keep",
    "A wide white fold-over cuff on an ink shank: a mod boot in both styles.",
    "At 76: a wide white fold-over cuff flaring past an ink shank, with a square toe and low heel. It reads clearly as a mod boot in both styles, the light cuff makes the boot read against the dark floor, and there is no slit or mouth read. Passes the floor rule."),

  // ----------------------------------------------------------- pop-show --
  v("pop-show", "star-mic", "a", "keep",
    "A white star on a level stick held out over the tail fan: a pop-star mic or wand.",
    "At 76: a white five-point star on a level white stick, held out back over the tail fan with its tips breaking the fan's outline. It reads as a pop-star mic or wand on both heads and blurred, and it is clearly pop. It sits well over Posh's ink dress (top/prop 18.73). Every rule passes for white and gold (reach 2.4, strict sweep clear, behind the head only at heart-point and clap)."),
  v("pop-show", "star-mic", "b", "fix",
    "A level stub at the belly reads as a sheriff badge. Tilt the mic up to the chin.",
    "At 76: a small white star at the front of the belly on a short level stub. It reads as a sheriff badge, or a wand poked out of the belly, at the same height as pom b and corded-mic a. The note says it is 'held up to sing, a tip aimed up at the beak', but the star sits at y 48.6, about 16 units under the chin, and the handle is level (44,48.5 to 56.5,50.5), so nothing says sung into. Rules pass.",
    "Tilt the mic up to the chin. Handle p0 (49,55) to p1 (58.6,48.6), half-width 2.4 to 3, collar kept at 0.85. Star centre (63.2,45.8), r 8.6, aimDeg -90, inner 0.5. The top tip lands at y 37.2, just clear of the head box (y ≤ 37). The upper-right tip lands at about (71.4,43.1), under the y-40 face line. The handle now rises about 33 degrees toward the beak, and on photo heads the star sits at the collar (chin 32, shoulders 37), which reads as a mic held under the chin. Re-run the sweep: reach must stay under 10, and nothing may sit right of x 64 above y 40."),
  v("pop-show", "star-mic", "c", "keep",
    "A white star mic raised up and back into the bay behind the neck: held aloft.",
    "At 76: a white star on a white handle raised up and back into the dark bay behind the neck, tip up. It is a new outline (a raised arm) and reads as a mic or wand held aloft. Clear on all three heads and blurred, clearly pop, and well apart from a (level, out back). Rules pass (reach 9.4, close to the limit but fine)."),
  v("pop-show", "corded-mic", "a", "fix",
    "A white cone poking forward from crotch height: ice cream, with a phallic risk. Raise it to the chin.",
    "At 76: a white ball on a white cone, low at the front of the belly (head at 63,47.5, butt at 44,54), pointing forward and slightly up from crotch height. It reads as an ice-cream cone or drumstick poked out of the lower belly, with a real phallic risk at the hip. It does not read as singing. The ink cable is invisible: ink on the ink outline and the dark page. This item has only two variants, so it has only one keep until this is fixed.",
    "Raise it to the chin like a sung mic. Egg head centre (61.5,44), handle running back and down to the butt at (48.5,56), so the cone rises about 43 degrees toward the beak. The egg's top-right edge lands near (64,41.7), below the y-40 face line and clear of the head box. Keep the cone at 14 long, tapering 3.2 to 1.8, with the 1.6 ink outline and the 2.4 ink collar. Route the cable on the pink, not the page: one U from the butt down to (51.5,62.5) and back up to (55.5,60), stroke 2.4, ending on the belly above y 64. It then shows as a dark loop on pink, not as nothing on dark. Re-run the sweep."),
  v("pop-show", "corded-mic", "b", "keep",
    "The classic handheld-mic icon, egg head and collar, raised up and back.",
    "At 76: a white egg head with a visible ink collar gap on a white tapering handle, raised up and back into the dark bay. It reads as the classic handheld-mic icon held aloft. Clear on both heads and blurred, and it changes the outline. The cable is invisible but not needed. Rules pass (reach 9.5)."),
  v("pop-show", "pom-pom", "a", "keep",
    "Two poms in a cheer V, one bright in front, one peeking over the back: Sporty.",
    "At 76: a bright white 13-lobe cloud punched out at breast front, plus a dimmed grey cloud peeking over the back. Together they read as two poms in a cheer V, which is unmistakably Sporty. No centre, no face read. Contrast with the ink tracksuit passes (prop/sleeve 3.53). Rules pass (reach 9.7). Minor: the grey back pom alone could read as a cloud puff, but the pair carries it."),
  v("pop-show", "pom-pom", "b", "keep",
    "One white fluffy pom held in front of the breast. Gold turns it into a sunflower.",
    "At 76: one white fluffy scalloped disc at the front of the breast, half on the dark page, top near y 41. It reads as a pom in a fist. The stick is invisible at 76, but the pom touches the wing tip, so it still reads as held. Clear blurred. Rules pass. Gold turns it into a sunflower, but gold is only a trial style."),
  v("pop-show", "pom-pom", "c", "fix",
    "Stuck to the back with no visible stick: a cottontail. Lift it clear and show the handle.",
    "At 76: a white scalloped puff sitting on the bird's back by the tail root. Its stick, from (37.6,45) to (29,31), ends inside the pom and runs entirely over the pink wing, so no stick shows between the body and the pom, and the pom's lower half overlaps the back outline. It reads as a cottontail or a puff of smoke stuck to the back, not a pom shaken high. That is the exact misread the item note bans.",
    "Lift it clear of the back and show the handle. Pom centre (19.5,17.5), same cloudPom size, so its bottom (about y 26) sits about 5 units above the back outline (about y 31 at x 25). Stick from (36,45) to (23.5,22.5). Draw the stick as a 4.4 ink line with a 2.4 mutedWarm (#b3a89a) core over it, so the length crossing the dark bay is visible (an ink stick on the near-ink page is invisible). The pom's right edge stays near x 29.5, well left of the head box (x ≥ 36). Re-check reach ≤ 10 (it is 9.7 now). If that fails, use centre (21,19)."),
  v("pop-show", "union-jack-flag", "a", "fix",
    "A flat patch on the belly, not a waved flag; merges into the jack dress. Fly it off the breast.",
    "At 76: a flat rectangle with a white X, pasted on the belly. It is a patch or passport, not a waved flag. The note says 'half past the breast on the dark page', but the flag spans x 52.4..69 and the breast front at that height is about x 71, so it is entirely on the body. In the Ginger Look it lands on the ink Union Jack dress at 1.00:1 and merges into it; the white hem only half-saves it. Rules pass.",
    "Fly it forward off the breast with a wave. Move the pole to the breast front, from (61,58) to (62.5,40.6), stroke as now. Replace unionJack with wavyJack from the pole top: path straight along direction (1,0.12) for length 17, h 9, one full wave of amplitude 1.8 growing toward the fly end. That puts about x 71..79.5 on the dark page, the fly end about 9 past the outline (limit 10), and the top edge at or below y 40.6 for every x > 64 (face rule). Keep ink with the white inset hem as the default. Separately, set the Ginger Look in looks.js to union-jack-flag/c until a is re-judged."),
  v("pop-show", "union-jack-flag", "b", "keep",
    "A wavy jack streaming up and back over the tail on a leaning pole: being waved.",
    "At 76: a wavy ink flag with a recognisable white saltire and cross, streaming up and back over the top tail feathers on a leaning pole. It reads as a Union Jack being waved. The wave and lean change the tail outline, and it is distinct from c's stiff upright rectangle. Clear in both styles, and blurred it holds as a pink-and-white rag. Rules pass (reach 4, flap dips to 72.1, which is legal). Doc nit: the variant note still says 'low, under the tail fan, never on the tail', but the code now flies it up and back over the tail. Update the note."),
  v("pop-show", "union-jack-flag", "c", "keep",
    "An upright pole with a crisp jack above the back: the most legible flag. Reach is at the limit.",
    "At 76: an upright ink pole with a crisp rectangular Union Jack (white hem, white X and cross) above the back, in the bay, well off the body and the dress. It is the most legible flag of the three and reads at a glance. Ginger-on-brand and fun. Rules pass (reach exactly 10.0, at the limit; do not let it grow)."),
  v("pop-show", "led-star-riser", "a", "keep",
    "A pink drum with one big white star breaking its edge: a pop-star podium.",
    "At 76: a pink drum with a thin white top and one big white star breaking its front-right edge. It reads as a pop-star podium, holds blurred, and good in the Ginger Look. Stage, so no prop rules apply; byStyle is ok for white and gold."),
  v("pop-show", "led-star-riser", "b", "keep",
    "A white lit band ringed with pink star studs: a marquee-lit drum riser.",
    "At 76: a white lit band ringed with five pink star studs under a pink top. It reads as a marquee-lit drum riser. The studs read as lights, close to sprinkles on a cake but on the right side of it. It differs from a's single emblem and holds blurred. Rules pass."),
  v("pop-show", "led-star-riser", "c", "keep",
    "A long low pink stage with a big white star at each end: a stage set, not a disc.",
    "At 76: a long low pink stage with a thin white lid, and a big white star at each end flanking the bird. It is wider than the feet, so it reads as a stage set rather than a disc, and is clearly pop and fun. The ink posts are invisible on the page, but the stars sit almost on the box corners, so they do not float. Distinct from a and b. Rules pass."),
  v("pop-show", "spotlight", "a", "keep",
    "A soft radial pool under the feet, no hard edge: a floor spotlight.",
    "At 76 and blurred: a soft radial pool under the feet with no hard plate edge, far from the face. It reads as a floor spotlight. White is the strongest style; team pink and gold are workable. Rules pass."),
  v("pop-show", "spotlight", "b", "keep",
    "Four crisp glints at the pool's edge: sparkles in a spotlight. Glow against glitter is a real choice.",
    "At 76: four crisp four-point glints (r 6 at the ends, 5.2 inside) at the edges of a soft pool. They read as sparkles in a spotlight, not dust, and stay distinct blurred in all three styles. Plain glow (a) versus glitter (b) is a real choice. Rules pass."),

  // -------------------------------------------------------- country-kit --
  // No run 1b critic verdict (the country-kit critic failed). Unchanged art
  // carries run 1's verdict; redrawn art is a "fix" marked not judged.
  v("country-kit", "bandana", "a", "keep",
    "Not re-judged in 1b (run 1 keep): the white kite reads as a neckerchief, the ink style as a black bandana.",
    "Run 1's verdict; the run 1b country-kit critic failed, so this was not judged again. At 76 the white kite reads clearly as a neckerchief on both heads, and the ink style reads as a black bandana. Passes every rule; lightNearHead is amber only (closest point 13.3u). At 304 the ink knot is a downward crescent on white, which comes close to a smile, but at 76 and in the 130 blur it only reads as the knot."),
  v("country-kit", "bandana", "b", "keep",
    "Not re-judged in 1b (run 1 keep): rolled band plus a big swung triangle, an outlaw kerchief.",
    "Run 1's verdict; the run 1b country-kit critic failed, so this was not judged again. The strongest bandana. The ink rolled band plus a big swung triangle reads as an outlaw kerchief at 76 and 130 blurred, in both white and ink. Passes all rules; lightNearHead is amber only (14.4u)."),
  v("country-kit", "western-yoke", "a", "fix",
    "Not re-judged: redrawn in 1b with piping and a shallow dip. Now a band with a white chevron V; needs a critic.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 asked for a fix because the ink yoke had the bandana's silhouette (a bib) and the white one copied the white bandana's V. Run 1b redrew it as run 1 asked: a band with a level lower edge at y 44, one shallow dip to (57,48.5) and a continuous contrasting piping line along that edge. At 76 on disk now it reads as a dark band with a white chevron under the neck (ink) or a white band with an ink chevron (white). The measured rules pass in both styles.",
    NOT_JUDGED_FIX),
  v("country-kit", "western-yoke", "b", "keep",
    "Not re-judged in 1b (run 1 keep): the bolo, a white diamond slide on two cords.",
    "Run 1's verdict; the run 1b country-kit critic failed, so this was not judged again. The bolo works. A white diamond slide on a thin ink yoke with two cords reads as a bolo tie at 76 and clearly at 130 blurred. It has one white mark and no dark centre, so it is not an eye. It is the distinct western item on the rail. Passes all rules."),
  v("country-kit", "trophy-buckle", "a", "keep",
    "Not re-judged in 1b (run 1 keep): a sheriff star on a belt stub reads instantly.",
    "Run 1's verdict; the run 1b country-kit critic failed, so this was not judged again. A sheriff star on an ink belt stub reads instantly at 76 and 130 blurred: a star, never an egg or an eye. The white style passes everything. Gold was dropped on country (1.30:1 on the orange)."),
  v("country-kit", "trophy-buckle", "b", "fix",
    "Not re-judged: the longhorn redrawn with thin open horns. Check the 130 blur for a moustache or grin read.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 asked for a fix because the thick white U of the horns plus a 9u face read as white underpants or a molar at 76. Run 1b redrew it as run 1 asked: thin horns sweeping out and up to sharp tips at (44,46.5) and (66.4,46.5), open hooks with orange inside, a short face wedge, white only. On disk now it reads at 76 as a wide white horned shape on the belt; at 130 blurred the dark gaps between the horns and the bar sit in a white mass, which a critic should check for a moustache or grin read. The measured rules pass.",
    NOT_JUDGED_FIX),
  v("country-kit", "fringed-vest", "a", "keep",
    "Not re-judged in 1b (run 1 keep): a black vest whose dark fringe blurs to a comb, not teeth.",
    "Run 1's verdict; the run 1b country-kit critic failed, so this was not judged again. At 76 it reads as a black vest with a fringed hem: the square ink strands blur to a comb or hatched band, not teeth, because they are dark on orange. The fringe stops at y 54 (the belly). Passes all rules. Contrasts well with the team fringe sleeve in Full kit (6.44:1)."),
  v("country-kit", "fringed-vest", "b", "fix",
    "Not re-judged: the fringe moved to the wing-side hem as a V (7/4/4/7). Needs a critic.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 asked for a fix because the side fringe merged into the body outline and the variant read as a plain black vest. Run 1b redrew it as run 1 asked: two fronts to y 47 with a straight gap, four strands hanging only off the wing-side front's hem, long-short-short-long, so the fringe dips in a V. On disk now it reads at 76 as a black vest with a short dark fringe beside the wing. The measured rules pass.",
    NOT_JUDGED_FIX),
  v("country-kit", "fringe-sleeve", "a", "fix",
    "Not re-judged: redrawn after run 1's cut as an ink-trimmed team wing with five bold strands.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 cut this variant (hollow strands read as tar drips in ink and vanished in team). Run 1b redrew it as a new drawing: the plain team wing trimmed in ink, a solid ink cuff band along the whole trailing edge and five bold ink strands (2.2 wide, 1.6 gaps) swept a little back, team style only. On disk now it reads at 76 as an orange wing with a dark fringe hanging under it. The measured rules pass.",
    NOT_JUDGED_FIX),
  v("country-kit", "fringe-sleeve", "b", "keep",
    "Not re-judged in 1b: run 1 said the ink default is the item; its failing team style is now gone.",
    "Run 1 marked this a fix only because of its team style: in the ink default the squared tabs cut a ragged fringe hem into the wing's silhouette and at 76 it reads as a fringed black sleeve (run 1: 'this is the item'), but the team-colour tabs read as teeth. Run 1b dropped the team style (the team version is now a), so only the passing ink drawing is left. The run 1b country-kit critic failed, so this was not judged again; the Looks critic wore it in Rodeo and the country Full kit and found it reads as a fringed black sleeve."),
  v("country-kit", "suede-sleeve", "a", "keep",
    "Not re-judged in 1b (run 1 keep): a plain ink wing, a strong value change at every size.",
    "Run 1's verdict; the run 1b country-kit critic failed, so this was not judged again. A plain ink wing: a solid, strong value change that reads at every size. It is a basic, but a legitimate one, and the base for ink-sleeve Looks. Passes all rules."),
  v("country-kit", "suede-sleeve", "b", "fix",
    "Not re-judged: redrawn as a black sleeve with a tan cuff at the tip. Small at 76; needs a critic.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 asked for a fix because the diagonal tan band read as a racing stripe or knife blade. Run 1b redrew it as run 1 asked: the black sleeve ends in a tan (mutedWarm) cuff at the wing's tip behind one ink seam, and the cuff's flared point breaks the outline below the back corner. On disk now the tan cuff is a small light patch at the wing's back end at 76, so the sleeve reads as black with a light tip. The measured rules pass.",
    NOT_JUDGED_FIX),
  v("country-kit", "tail-bandana", "a", "fix",
    "Not re-judged, and it fails the measured region rule in both styles: a small triangle under the tail.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 cut this variant (the underlay gaps read as a letter glyph or ticket). Run 1b redrew it as a new drawing: knotted round the lower plume's bend with one wide cloth triangle hanging below it, swung back. On disk now it fails the harness's region rule in both the white and the ink style, and at 76 it is a small white (or black) triangle under the tail.",
    "It is outside the Tail region in both styles, so it needs a redraw that stays in the region before anyone judges the read. " + NOT_JUDGED_FIX),
  v("country-kit", "tail-bandana", "b", "fix",
    "Not re-judged: the kerchief now runs along the upper plume. At 76 a white pennant at the tail tip.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 asked for a fix because the triangle at the plume tip read as a mouse cursor at 304 and a white speck at 76. Run 1b redrew it as run 1 asked: a 10-unit kerchief triangle along the upper plume's underside with a solid knot block half tucked under the body. On disk now it reads at 76 as a white (or ink) pennant at the tail. The measured rules pass in both styles.",
    NOT_JUDGED_FIX),
  v("country-kit", "rope-coil", "a", "fix",
    "Not re-judged: redrawn after run 1's cut as a lariat loop hung off the tail. At 76 a ring behind the tail.",
    "No run 1b critic verdict: the country-kit critic failed. Run 1 cut this variant (white wraps in a row read as teeth or a barber pole). Run 1b redrew it as a new drawing: one rope, ink on a mutedWarm casing, hung on the tail like a lariat on a saddle horn, a 15 by 19 teardrop loop with the lower plume through it. On disk now it reads at 76 as a grey-cased (ink) or white loop hanging behind the tail, like a ring or a key fob; a critic should check it never reads as an eye. The measured rules pass in both styles.",
    NOT_JUDGED_FIX),
  v("country-kit", "rope-coil", "b", "fix",
    "Not re-judged: new in 1b, a rope trailing back in an S to a frayed tassel. The white style looks like a bone.",
    "No run 1b critic verdict: the country-kit critic failed. This variant is new in run 1b: a rope tied at the root, its long end trailing back between the plumes in a lazy S past their tips and ending in a frayed tassel, a third plume of rope. On disk now the ink style reads at 76 as a grey streak off the tail, and the white style as a white stick with knobbed ends, closer to a bone than a rope. The measured rules pass in both styles.",
    NOT_JUDGED_FIX),

  // ------------------------------------------------------- country-show --
  v("country-show", "lasso", "b", "keep",
    "A flat spinning hoop of rope behind the tail with the slack off the wing tip: a twirling lariat.",
    "At 76px, drawn and costumed, it is a flat spinning hoop of rope up behind the tail, with a rope running to the wing tip and the slack hanging off it: the cowboy with a twirling loop. In ink the mutedWarm casing keeps the black rope visible on the hearth. Blurred at 130 the grey or white ellipse with its spoke still reads as a lariat. Every rule passes in both styles (reach 10.0, right at the limit; flap lowest y 76.1, inside the soft floor of 76.75). It never reads as an eye. In Rodeo and Full kit it stands clear of the sleeve (6.44:1)."),
  v("country-show", "lasso", "c", "keep",
    "An upright teardrop loop shaken out before the throw, held level so never a noose.",
    "At 76px it is an upright teardrop of rope over the tail with the honda at the wing tip. It reads as a loop shaken out before the throw and stays separate from the orange tail feathers, because it is grey-cased ink in the ink style and ink-cased white in the white style. Blurred, it is still a rope loop. Its outline is clearly different from b's flat disc, so the two are real alternatives. It does not read as a noose: it is held out level, not hanging. Every rule passes in both styles (reach 9.7, flap lowest y 73.7)."),
  v("country-show", "corn-cob", "a", "fix",
    "Saw-tooth cobs and a white tulip husk read as a wheat sheaf or flames. Blunt cobs, kernel rows, hugging leaves.",
    "At 76px the two pale ember cobs in a V have knob edges that read as a zigzag saw, so the pair reads as a wheat sheaf, two flames or a fir sprig. The three white drooping blades at the grip read as a white tulip or shuttlecock. Blurred, it is a pale spiky bunch with a white blob, not corn. Ember on the teamE body is low value contrast, so only the ink outline carries the shape. In Farmhand the white blades sit against the white bandana V (top/prop 1.00:1) and merge into one white patch on the chest. Rules pass.",
    "(1) Kill the saw edge. In cob(), change the bump to amplitude 0.9 and period 3.4 (bump = 0.9*knob*|sin(pi*d/3.4)|) so the edge is a gentle lumpy wave. Raise wTip from 5 to 7 so each cob ends in a blunt bullet, not a flame tip. Dims become w0 8, wMax 10.5, wTip 7. (2) Add the corn read inside each cob: two lengthwise ink kernel-row lines, stroke 2 (min stroke), at offsets +/- width(t)/5 from the axis, running from t 0.2 to t 0.85 so they follow the taper. Lengthwise lines only, no cross lines (cross lines are the grenade). (3) Delete droopingHusk. Give each cob two white husk leaves hugging its sides instead, hugLeaf(frame, +/-1, 0.62, 4, 1.8), with the leaf stroke at 2u, tips pointing up and out. That is the corn emoji outline, a yellow striped bullet between two white leaves. (4) Spread the V so the cobs don't fuse: back cob (29,46) to (8,32), up cob (29.6,46) to (28,22). Both stay left of x 34 above y 32 and clear of the head box. Re-run the sweep."),
  v("country-show", "corn-cob", "c", "fix",
    "The trophy cob reads as a torch on a white flower. Same blunt-bullet cob and hugging husk fix.",
    "At 76px the single trophy cob is a pale lumpy flame or torch: the knob edges read as a saw-tooth fringe and the narrow tip as a flame point. The three white drooping blades under it read as a white flower or a feather duster. Blurred at 130 it is a pale torch on a white bow. The gold trial reads as corn, but gold can never be the default, and on the orange it is 1.30:1. Rules pass.",
    "Same cob changes as a: bump 0.9 every 3.4 and dims w0 9.4, wMax 13.5, wTip 9, so it ends in a fat blunt bullet. Add two lengthwise ink kernel-row lines, stroke 2, at +/- width(t)/5 from t 0.2 to t 0.85. Delete droopingHusk. Enlarge the two hugging husk leaves to hugLeaf(frame, +/-1, 0.6, 4.2, 1.8), stroke 2, so they flare out either side of the lower half like the corn emoji. Keep p0 (29,46) and p1 (23.4,21.8). In Farmhand, check that the husk leaves no longer touch the white bandana V. If they do, rotate p1 to (21,23) so the leaves lean back off the chest."),
  v("country-show", "acoustic-guitar", "a", "keep",
    "A white guitar in playing position across the belly: the strongest read on the country page.",
    "At 76px it is clearly a white guitar in playing position: a big white figure-eight low on the belly and a neck rising up and back to a pegged headstock. Blurred at 130 it is still unmistakably a guitar. In Honky-tonk, over the ink yoke and ink sleeve, it is the strongest read on the whole country page (prop/sleeve 18.73:1). There is no mark inside the body, so no eye or mouth read. Rules pass (reach 3.8, floor 69.0, boot-scoot toe lowest y 70.4)."),
  v("country-show", "acoustic-guitar", "b", "fix",
    "White reads as a slung troubadour guitar; the ink style is a black frying pan. White only.",
    "The white style reads at 76 and blurred: a white guitar slung behind, its neck rising over the tail. The ink style does not. The black figure-eight sits on the rear of the bird, and its lower bout runs into the bird's own ink bottom and rear outline, so the waist disappears. At 76 it is a black frying pan or bomb with a grey-cased stick, and blurred it is a black mass at the back. Rules pass in both styles, but ink fails the read.",
    "Set styles to [\"white\"] and drop ink, since the white troubadour reads and is distinct from a (behind and rising versus across the belly). If an ink guitar must survive, lift the whole body 3u so the lower bout clears the belly outline: lx 32, ly 53.6, lr 7.4, ux 24.6, uy 44.8, ur 5.4. Neck from (23,42.4) to (14,33.4), then re-check the hair, chin and reach rules. Also draw a mutedWarm rim under the body casing (a stroke=STRAW, width 6 shape set drawn before the 4u ink casing), so the figure-eight is separated from the bird's outline the way the neck already is."),
  v("country-show", "hay-bale", "a", "cut",
    "An 86-unit slab under the hen reads as a plank or bench. Replace with an upright bale behind the tail.",
    "It is an 86x10 slab with the bird hiding its middle, so at 76 and blurred it reads as a plank, bench or skateboard ramp under the hen. The 3u spikes are a fuzz line and the shaded end barely shows. Its twine is 1.4u, under the 2u minimum stroke. Replace it with an upright bale standing on its end behind the tail: front face x -10..8, y 58..71.6, left end face dx 3.6 dy 3.2 in mutedWarm, shaggy top 3.5u tall, two horizontal 2.2u twine bands at y 62.5 and 67. It is a chunky 18x14 block clear of the body, the opposite side from b."),
  v("country-show", "hay-bale", "b", "fix",
    "Reads as a crate or block of cheese. Bigger, rounded corners, long wisps, thicker twine.",
    "At 76px it is a small square ember box with two straps and crisp corners in front of the feet. It reads as a crate, a block of cheese or a parcel more than hay. The 3u spike fringe and the ragged ends are a fuzz line at this size, and blurred it is an orange block. The twine is 1.4u, below the 2u minimum stroke. The concept (one chunky bale in front of the breast) is right.",
    "(1) Twine stroke from 1.4 to 2.2. (2) Bigger and softer: x0 60, x1 88, body top 59, bottom 71.6, so spikes reach y 55, inside the stage band. Round the four corners with r 2.6 and bow the top edge up 1u at its middle, so it is a soft straw block, not a crate. (3) Replace the uniform spike row with five longer wisps, 3.5 to 4.5u tall and leaning outward 30 to 45 degrees: two at each top corner and one mid-top. Splay the ragged-end tufts 3u (out 2.2 to 3) with 4 tufts per end, so the outline itself is shaggy at 76. (4) Twine bands at x 67 and 80."),
  v("country-show", "sawdust-ring", "a", "keep",
    "A hooped barrel on the arena floor: the disc reads as an arena, not a plate.",
    "At 76 and blurred the team-orange bulged barrel with ink hoops and a lid reads clearly as a barrel standing on the floor in front of the breast. With it, the mutedWarm disc reads as an arena floor, not a plate. Both styles pass and nothing is near the head. Minor: the 1.2u staves are below the 2u minimum and invisible at 76, so delete them or take them to 2u. That does not change the read."),
  v("country-show", "sawdust-ring", "b", "keep",
    "A white saguaro on the floor: the trident outline says Western at any size.",
    "The white saguaro on its ink casing is unmistakable at 76 and blurred: the trident outline says Western at any size, standing on the floor band clear of the head. Both styles pass, and its value differs from both the barrel and the disc."),
  v("country-show", "sawdust-ring", "c", "keep",
    "A white Stetson in the dirt: somebody just got bucked. The most recognisable genre shape.",
    "At 76 the white Stetson on the arena floor reads as a cowboy hat: a pinched crown, an ink band and a brim flicked up at both ends. Blurred it is still a white cowboy hat. That is the most recognisable genre shape on the page, and it tells a fun story (somebody just got bucked). There is no eye or teeth read, since the band is one smooth stroke. Both styles pass."),

  // ---------------------------------------------------------- disco-kit --
  v("disco-kit", "open-shirt", "a", "cut",
    "Third try at a white open shirt: a white belly with an orange crisp. b and c carry the item.",
    "At 76px this is the stock white belly with a small orange triangle on it, like a crisp or a name tag. The cyan V merges into the neck, so the shirt never reads as open. In the Fever Look, next to the ink flare sleeve, the bird reads as a magpie. This is the third round that tried to make a white open shirt work. b and c already carry the item, so swap the Fever Look to b or c with flare-sleeve/c in white, which clears the pair rule on value."),
  v("disco-kit", "open-shirt", "b", "keep",
    "A black shirt open in a cyan V with an ember medallion on a chain: the gold-chain read.",
    "At 76px: a black shirt open in a cyan V with one solid ember disc on a chain at the neck. It reads as the gold-chain medallion, a clear disco read. It passes every rule, there is no eye read from a single disc on the chest, and it sits on cyan, not on the belly line."),
  v("disco-kit", "open-shirt", "c", "keep",
    "A black shirt with two orange sparkles of different sizes on a diagonal: a sequin shirt.",
    "At 76px: a black shirt with a cyan V and two orange four-point sparkles of clearly different sizes on a diagonal. It reads as a sequin shirt. The thin rays keep them glints, not a pair of eyes. It passes every rule and separates from b (a disc against stars)."),
  v("disco-kit", "dagger-collar", "b", "keep",
    "White suit, black spread collar: the Night Fever icon, the strongest disco read in the kit.",
    "At 76px: a white chest with one black spread-collar shape, the white suit and black shirt of Night Fever, the strongest disco icon in the kit. At 130px blurred it reads as a black arrowhead on white, with no fang or jaw read because the notch is light into dark and only one. Gold trial reads as lamé. All rules pass."),
  v("disco-kit", "dagger-collar", "c", "cut",
    "The kipper tie reads as an office suit at 76. Replace with b's suit plus an ember medallion.",
    "At 76px the fat ember tie on a black shirt and white chest reads as an office or wedding suit and tie, not disco: at this size nobody sees a kipper as a 1975 tie. Replace it with b's white suit and collar plus a 10-unit solid ember medallion (r 4.6 with 1.6 ink casing) at about (56,46) on a narrow cyan V (M 51 37 L 61 37 L 56 52 Z) under the collar. That is Travolta with the chain, and it parts from open-shirt/b by its white jacket."),
  v("disco-kit", "satin-jacket", "a", "fix",
    "Same black-chest-plus-star read as open-shirt c. Add a zip, a wide rib collar, a bigger star.",
    "At 76px in ink: a black chest with a small cyan star and a hairline rib. It is the same read as open-shirt/c (a black chest with a star-shaped glint), so Brad gets two of one item. The rib and piping are sub-pixel, so nothing says closed jacket rather than open shirt. White style reads as a stock belly with a star.",
    "Make it read as a zipped jacket. (1) Add a zip: a 2.6-unit white stroke cased with 1.2 ink from (57,40.5) to (55.5,58), clipped to the chest, in every style (ink zip in white style). The closed vertical line is the opposite of the open shirt's V. (2) Widen RIB to 7 units (lower edge y +2.5 at both ends, so 46 40.1 to 62.5 47.8) so the team collar reads as a band at 76px, and drop the 1.6 piping. (3) Grow the star to r 7.5 at (40,49.5), still team-colour with a 1.2 ink edge, so it is a 15-unit patch and not a glint."),
  v("disco-kit", "satin-jacket", "b", "cut",
    "Four stripes across a black chest: a prison or Breton shirt. Replace with a raglan yoke and zip.",
    "At 76px: four horizontal stripes across a black chest, which reads as a prison, Breton or rugby shirt, not a disco or roller-rink jacket, and the stripes are close to texture. Replace it with a second rink-jacket signifier: for example a team-colour raglan yoke (a 6-unit band from the throat diagonally to the wing's leading edge) over the ink body, with a white zip."),
  v("disco-kit", "flare-sleeve", "b", "fix",
    "Ink keeps (a bell sleeve); team melts into the body and leaves a paper cup. Add the cuff band.",
    "Ink style keeps: at 76px a black wing whose white bell flares past the back tip clearly reads as a bell sleeve. Team style fails: the cyan wing melts into the cyan body, so all you see is a white paper cup poking out of the bird's rear, with no sleeve joint.",
    "In the team style only, add c's cuff band: an ink stroke 3.4 wide with a round cap along BELL_CUFF (M 27 34 C 24 39 25 45 29 49), drawn after the bell, so the cyan sleeve has a dark seam where it meets the white bell. Or drop the team style and ship ink only."),
  v("disco-kit", "flare-sleeve", "c", "keep",
    "A white satin wing flaring into a wide bell with a bold ink band: Travolta's white suit sleeve.",
    "At 76px: a white satin wing flaring into a wide bell with a bold ink band at the joint. It reads as one flared sleeve by silhouette and is a strong 70s read. It contrasts with every ink Top, so it is the right partner for open-shirt b and c in Fever. The gold trial is lamé. All rules pass."),
  v("disco-kit", "satin-sleeve", "a", "keep",
    "A white wing with two cyan bands square to it: a striped rink sleeve, not wing bars.",
    "At 76px: a white wing with two cyan ink-cased bands square to the wing near its back end. It reads as a striped track or rink sleeve, a garment mark, not wing bars, because the bands are flat cyan between white and run edge to edge. All rules pass and it differs from b (stripes against a star)."),
  v("disco-kit", "satin-sleeve", "b", "keep",
    "A white wing with one cyan star: a glam appliqué sleeve, no pupil read.",
    "At 76px: a white wing with one cyan star about 9px across, still star-shaped and not a ringed dot. It reads as a glam appliqué sleeve. There is no pupil read because it is light-on-light with points. All rules pass."),
  v("disco-kit", "tinsel", "a", "fix",
    "S-wiggles with tiny glints read as stink lines: a sparkly fart. Crinkled drooping ribbons, big sparkles.",
    "At 76px the two thin white S-wiggles rising off the tail with tiny glints read as cartoon stink or steam lines with sparkles: a sparkly fart, not tinsel. The S wave is the steam shape, and the glints' rays are too thin to register as more than dots.",
    "Lose the S. Draw each strand as a crinkled ribbon that droops in one gentle curve, using crinkleC with large, visible teeth: the long one from (9,10) through controls (4,18) and (2,28) to (3,37), n=12, amp 1.6; the short one from (17,0) through (21,5) and (22,11) to (21,17), n=7, amp 1.6. Use the cased stroke with core 3.4 and edge 1.2, stroke-linejoin miter, so the zigzag edge reads as tinsel foil at 76px. End each strand in a sparkle of r 6 and k 0.5 (12 tip to tip, fatter rays), keeping the two at different heights."),
  v("disco-kit", "tinsel", "b", "cut",
    "A fuzzy white hoop round the tail: Christmas garland, and a copy of the boa. Replace with a sequin-capped sickle.",
    "At 76px the 0.55-amplitude crinkle is far below a pixel, so this is a fuzzy white hoop round the tail. It reads as Christmas garland or fur trim and duplicates the boa (a white fluffy rope on the tail), so it is neither tinsel nor disco. Replace it with a different disco tail, for example one sickle sheathed in a mirror-tile sequin cap with a single large sparkle at its tip."),
  v("disco-kit", "feather-boa", "a", "fix",
    "A hard white L: a bent pipe or hockey stick. Re-path as a sagging swag with fat, visible fluff.",
    "At 76px: a fat white L, a straight horizontal bar with a right-angle drop, lying across the tail. It reads as a bent pipe, a hockey stick or a sock. The 3.6-period lumps stick out only 1.3 units, so no fluff shows and nothing says feathers. The intent, a scarf thrown over the tail, is lost in the hard corner.",
    "Re-path it as a swag that sags, then drops: M 33.5 31 C 26 34 15 31 10 16 C 4 20 1 30 3.5 42. It droops gently from the back to the low sickle, curves over it, and falls in one long end. Make the fluff readable: core 7 with a 4.4 inner, fluff 12.5 with a 9.6 inner, period 5.5. The lumps then stand about 2.75 units proud and show as a scalloped edge at 76px. Check that the low point stays above y 42.75 and x stays under 22 near the wing."),
  v("disco-kit", "feather-boa", "b", "fix",
    "An arch with a knob each side: a bag handle or horseshoe. Show one streaming end, fatter fluff.",
    "At 76px a white arch over the tail top with a round knob hanging at each side (21.5,7 and -0.5,20). It reads as a bag handle or a horseshoe, close to the banned two round end-tufts. The fluff is sub-pixel, as in a.",
    "Hide the start: begin the path at the high sickle tip, M 17 1.5, instead of at (21.5,7), so only ONE free end shows and it streams: M 17 1.5 C 15 -2.5 10 -1 8 3 C 6 7 3 8.5 0.5 11 C -2 13.5 -2 18 -0.5 23. Use the fat fluff settings from a's fix (fluff 12.5 with a 9.6 inner, period 5.5) so the scallops read."),
  v("disco-kit", "platforms", "a", "fix",
    "Overlapping flat soles make one two-tone brick. Give each shoe a heel, an arch and a toe.",
    "At 76px each foot is a thin white strip on a flat-topped cyan rectangle, and the two soles touch (near x 23.5–39, far x 35.5–51 overlap by 3.5 units), so the bird stands on one long two-tone brick or crate. It does not read as platform shoes. On the lit-floor stage in Fever the cyan soles vanish into the cyan tiles.",
    "Give the sole a shoe's silhouette: a tall heel and a lower toe joined over an arch, replacing the rectangle with M x-5 63.5 L x+1 63.5 L x+8 65.5 L x+8 72.5 L x+2 72.5 Q x+0.5 69.5 x-1 72.5 L x-5 72.5 Z (a 9-unit heel, a 7-unit toe, and a 3-unit arch notch showing floor). Narrow each shoe to x-5..x+8 and bring the upper's back edge to x-4, so near (26–39) and far (38–51) only kiss. Draw the far shoe 10% darker, as now. In the white style use a white sole with an ink upper instead of cyan, so the shoe never drops into a cyan stage."),
  v("disco-kit", "platforms", "b", "cut",
    "Indistinguishable from a. Replace with a stacked glam boot: white-over-ember sole, a star on the heel.",
    "At 76px this is a with a taller white sock, the same two-tone block under the bird, so Brad cannot tell them apart. Replace it with a different platform silhouette, for example a stacked glam boot whose sole is split into two value bands (white over ember) with one 9-unit white star on the heel."),
  v("disco-kit", "roller-skates", "a", "keep",
    "A high-top on a black plate with two spaced wheels: can only be roller skates.",
    "At 76px: a white high-top on a black plate with two cyan wheels clearly spaced under heel and toe, and in ink, white wheels under black boots. The wheels carry it, so it can only be roller skates, and it is fun with the Roller Look. Wheels are solid with no hub, so no eye read, and the floor line holds."),
  v("disco-kit", "roller-skates", "b", "keep",
    "A knee-high boot banded in ember on white wheels: roller-girl skates.",
    "At 76px: a knee-high boot banded in ember across the shin, on white wheels. It reads as roller-girl skates, and the ember band separates it from a (cyan wheels, short boot). All rules pass in both styles."),

  // --------------------------------------------------------- disco-show --
  v("disco-show", "mirror-ball-egg", "a", "keep",
    "A gridded white egg with a sparkle, low in the back pocket: a fair disco ball. Touches the near leg.",
    "At 76 I see a white egg with a grey checker grid and a black lower-back quarter, low in the back pocket, with a white four-point sparkle off its back. Grid plus sparkle reads as a disco ball, and it holds at 130 blurred. Every measured rule passes: rest maxY 65.2, flap 74.8 against the soft floor of 76.75, reach 8.6, no eye read. Weak points: its front touches the near leg at 76, the grid lines are 0.9u (under the 2u minimum, but the value cells carry the read) and the dark quarter pushes it slightly towards a grenade. Looks problem: in Full kit it fails 1.00:1 against the white satin sleeve, so that Look should wear c, which sits up and away from the sleeve.",
    "(Optional) Nudge LOW to cx 23.6 so the front clears the near leg by about 1.5u at 76."),
  v("disco-show", "mirror-ball-egg", "b", "cut",
    "The short dark chain reads as a handle: a tennis racket or whisk. a and c cover the ball.",
    "At 76 the round gridded ball on its 7-unit sagging chain reads as a tennis racket or a whisk behind the wing, because the short dark chain reads as a handle. The 0.7u diamond lattice is a grey cross-hatch texture, and a and c already cover the ball."),
  v("disco-show", "mirror-ball-egg", "c", "keep",
    "A checkered ball held up in the pocket behind the head: unmistakably a mirror ball. Best disco prop.",
    "The strongest disco prop on this rail. At 76 a white checkered ball floats up in the dark pocket between the upper tail sickle and the head, held up like a performer would, and it is unmistakably a mirror ball at 130 blurred. Reach 9.2, rest and walk tuck are clear, and it passes behind the head only on the up extremes, which is allowed. The string vanishes on the dark pocket, so it floats, which is fine for a balloon. Gold reads as a waffle or pineapple but is trial-only. Use it in Full kit instead of a."),
  v("disco-show", "hand-fan", "a", "cut",
    "A dashed arc under the tail: a sprocket or teeth, never a fan. Replace with a fan flicked open up and back.",
    "At 76, in every style, it is a dashed white arc of separate wedges hanging down-back under the tail. It reads as a sprocket, as a row of teeth, or as the bird's own ruffled tail plume, never as a hand fan. It is also still the hung-low pose the new rule frees us from.",
    "Replacement: a fan flicked open up and back. Rivet at the wing tip (26.5,48), solid white leaf from r 3 to r 13 opening from 180 to 290 degrees (straight back round to just past up), lying over the cyan lower tail sickle. Draw 4 ink pleat strokes at 2u from r 5 to r 11, a 2u ink outline, and an outer edge of 5 rounded scallops each bulging 1.5u (scallops, never points, so no teeth). The silhouette must stay one unbroken half-disc. Farthest point from the pivot is about 34u."),
  v("disco-show", "hand-fan", "b", "fix",
    "The hold is right but it reads as an eggshell with a teeth edge. Solid ink leaf, rounded scallops.",
    "The hold is right (up across the back), but at 76 it is a white jagged half-disc on the lower belly. It reads as a hatched eggshell or a crown, and the upward zigzag edge reads as a jaw of teeth. The sticks are sub-2u and invisible, and on the white Studio 54 collar it drops to 1.00:1.",
    "Make ink the default (styles [\"ink\",\"white\",\"gold\"]): an ink leaf on the cyan back is 7.72:1. Rivet at (26.5,48). Make the leaf SOLID from r 3 to r 14 with no bare-stick band, because the hollow band is what reads as an eggshell. Open it 140 degrees, from 200 to 340: back tip about (13.3,43.2), top (26.5,34), front tip (39.7,43.2). This stays out of the head box, since the 320-degree point is (37.2,39), below y 37. Draw 6 white radial pleat strokes at 2u from r 5 to r 12 (ink strokes in the white style). The outer edge is 7 rounded scallops bulging 1.5u, never points. Run two ink guard sticks 2.5u wide along the two edge angles, ending 1u past the rim. No light rivet dot. The farthest point from the pivot is about 34.7u, inside 41."),
  v("disco-show", "vinyl", "a", "cut",
    "A black ball with a highlight: a bowling ball or an eye, not a record. Replace with a raised ember sleeve.",
    "At 76 it is a black ball behind the tail with a white crescent and a tiny cyan star in the middle. That reads as a bowling ball or 8-ball, or as a dark eye with a highlight, not as a flat record. In Roller its ink body vanishes into the ink satin jacket. The 7.72:1 check passed falsely because it measured the cyan label, not the black disc.",
    "Replacement: a second sleeve hold so vinyl has two strong variants. Raise an ember (#ffb35a) 12.5u square jacket into the upper dark pocket (x 20..33, y 6..24) on the wing-tip line, with the ink record slid 60% out of its top-back corner, one 2u white sheen arc, and no label."),
  v("disco-show", "vinyl", "b", "keep",
    "A tilted sleeve with a record sliding out: the LP icon. Small and only generically musical.",
    "At 76 a tilted white square with a cyan diagonal and a black dome with a white sheen coming out of its top-back corner is the LP-sleeve icon, and it holds at 130 blurred. No label and no ring, so no eye. Reach 1.9 and the sweep is clear. It is small and only generically musical, but it reads. Roller should wear this instead of a.",
    "(Optional) Slide the record another 2u out so about 60% of the disc shows, and change the cover band from cyan to ember so the sleeve does not look split by the body colour showing through."),
  v("disco-show", "lit-floor", "a", "keep",
    "A perspective chequer of white and cyan tiles: the Saturday Night Fever floor at a glance.",
    "At 76 a perspective chequer of white and cyan tiles in ink grout under the feet is the Saturday Night Fever floor at a glance. The strongest stage, clear at 130 blurred, and the orange feet stand out on it."),
  v("disco-show", "lit-floor", "b", "keep",
    "A thick slab with big panels, two lit: one dance-floor tile, a different rhythm from a.",
    "At 76 a thicker slab with big panels and two white panels lit reads as one lit dance-floor tile, a clearly different silhouette and rhythm from a's busy chequer. It holds at 130 blurred."),
  v("disco-show", "neon-flames", "a", "keep",
    "Two neon flame signs either side of the bird: the Disco Inferno answer.",
    "At 76 two white flame drops inside cyan neon tubes stand on a glowing floor line, one behind the tail and one in front of the chest. Neon outline flames are the spec's Disco Inferno answer, and they read as flame signs, not fire. At 130 blurred they hold as two glowing flames. No dark centre, so no eye read, and the bird never covers them."),
  v("disco-show", "neon-flames", "b", "keep",
    "A neon flame behind and a tipped neon star in front: two signs on one tube.",
    "At 76 a big neon flame behind the tail and a tipped neon star in front read as two different signs on one tube. The star outline with its white centre reads as a star, not a wand, and it differs from a's mirrored pair. Clear at 130 blurred in both styles."),

  // ------------------------------------------------------------- shared --
  v("shared", "wing-night-bib", "a", "keep",
    "A black lobster bib with one ember sauce splat, on all four bodies. No face read.",
    "At 76 on all four bodies it is a solid black panel from the neck to the belly with one ember splat on it. It reads as a sauced lobster bib, and on metal's chrome it is the darkest shape on the bird (ink 13.9:1). At 130 blurred the splat stays a single ember blob: it has no dots or arcs, so nothing reads as a face. It fits in the Wing night Look (top/prop 5.3 to 13.9:1)."),
  v("shared", "wing-night-bib", "b", "keep",
    "A white napkin with a heavy ink edge and a team-colour splat: the light opposite of a.",
    "At 76 it is a white napkin block with a heavy ink edge, a curled tie corner and a splat in the team colour (ink on chrome). It is the light opposite of a, so the pair separates by value. On metal the white is outline only (1.35:1), but the 2.4u edge and the ink splat carry it. At 130 blurred it reads as a stained paper bib, with no eye or teeth read. All rules pass on every body."),
  v("shared", "team-sash", "a", "keep",
    "One unbroken diagonal from shoulder to back hip: an obvious sash on every body.",
    "At 76 it is one unbroken diagonal from the shoulder to the back hip. It is an obvious sash on pop, country and disco in both styles. On metal, white is outline only, but the two ink edges still draw the band. Ink is a strong black slash on every body. Nothing reads as a slash sign at 76. The Team colours Look problem is logged under golden-egg a."),
  v("shared", "team-sash", "b", "fix",
    "Thin tails between the hips read as a third leg or comb. Lower knot, 8-unit tails swung back.",
    "The two tails are 5.2u wide (hw 2.6), which is under the 8u minimum feature, and each notch is 2.2u. They hang almost straight down at x 36-40, right between the hips (32 and 44). At 76 white on pop and country they read as a third leg or a comb under the band. At 304 the band plus the cinch plus the tails reads as a white blade with a crossguard. On the preener only a 4u nub shows, so at 76 b looks the same as a. In ink on metal and pop the cinch lines and stubs blur to an X-like buckle.",
    "Keep a's full diagonal. (1) Slide the knot down the band from t 0.5 to t 0.68 (stock kc about (28.6,48.6), spiky (28.6,48.3), broody (31.3,48.0)). For the preener use t 0.6, kc about (39.6,46.2), with its tails sent back as below. (2) Knot 9 along the band x 13 across, k 1 on every body (drop the preener's 0.85). (3) Tails 8u wide (hw 4.0) with a 3.5u V notch. Swing them back toward the tail instead of hanging between the legs: directions 115 and 138 degrees (down and back), roots 3.5u apart along the band. Make each as long as the body allows with its tip 2u inside the outline (about 9-11u). Stock tips should land near x 18-25, y 57-60, over the rump and clear of the near hip at x 32. (4) On the preener, if a second 8u tail cannot get 6u clear of the band, draw one 8u tail at 125 degrees. Never draw a 4u nub. (5) Ink style keeps the team-colour rim on the tails and the two cinch lines, now 13u long. Pass check: at 76 the tails sit on the back half of the body as two forked ribbons, with no orange leg next to them."),
  v("shared", "golden-egg", "a", "fix",
    "Reads alone, but fuses with the white sash into a white club in Team colours. Ink sash, or move the egg.",
    "On its own it reads at 76: a white (or gold) egg tucked under the wing and poking below the belly, and a fun 'she laid one' gag. But in the Team colours Look (looks.js, team-sash a white plus golden-egg a white) the sash's low end crosses x 26-36 at y 43-52. The egg's outlined top is at about y 52 at x 31, so the two whites touch. At 76 on all four bodies they fuse into one white L: a golf club on country, a white boot on disco. The harness flags top/prop 1.00:1 on every genre. The rubric needs a keep to contrast with its Look neighbours.",
    "Preferred, one line in looks.js: in Team colours wear team-sash a in style 'ink', so the band is black and the egg white (two values). If the Look must stay all white, move the egg off the band instead: CLUTCH c +3u x and +2u y (stock [34,62.5], spiky [34,61.5], broody [37,61], preener [32,61]). That leaves at least 3u of team colour between the egg's outline and the sash band. Re-run the sweep, because the egg bottom must stay at or above 72.75 at rest and at the walk tuck."),
  v("shared", "golden-egg", "b", "keep",
    "An egg crowning a stemmed cup held up over the tail: a trophy. Weakest on metal's chrome.",
    "At 76 it is a stemmed cup held up behind over the tail with a white egg crowning it. With no handles it reads as a trophy or chalice, not a dog bone or a cone, and it is the only raised egg in the rail. In gold it is clearly a prize. It is weakest on metal, where the mutedWarm cup sits on chrome spikes (similar value) and is carried only by its 2.4u edge. Even there, at 130 blurred it reads as a goblet with an egg. Rules pass: extension 2.1 to 7, and it only passes behind the head at the clap."),
  v("shared", "drumstick", "a", "fix",
    "The meat lies over the near foot: a club foot or boot. Hang it behind the legs, a bigger meat.",
    "The meat tip sits at (38.5,69), between the hips at foot level, so the ember meat lies over the near shin and foot (ember vs leg orange is about 1.2:1). At 76 on disco and metal the bird looks one-legged with a club foot, which is the 'boots' read §2.1 calls out. In team style on metal the chrome meat is 1.00:1 against the body, so what remains is a white bone with an orange dot.",
    "Keep it hanging (the mic drop, as opposed to b's raised toast), but hang it BEHIND the legs, under the tail, against the dark room. stock and spiky: k [24,52], t [15,67]; broody: k [27,50], t [17,69], glazeEnd 70.5; preener: k [24,52], t [17,66.5] (right of x 9 for the Night Fever drop). Meat r 5.5 (up from 4.8) so the meat is at least 11u across, meat 0.55, glaze drip ending at or above 70.6. Re-run the sweep. If the flap (-62) or a Move dips past 76.75, steepen by moving t +3u in x. Pass check: at 76 both legs are fully orange and unbroken, and the drumstick hangs on its own behind the near foot."),
  v("shared", "drumstick", "b", "keep",
    "The classic cartoon drumstick held up behind, bitten in one smooth arc. Fun on every body.",
    "At 76 in white it is the classic cartoon drumstick held up behind the bird: a big ember meat ball over the tail and a white bone with a two-lobed knuckle angled down toward the wing tip. It is unmistakable and fun. The bite is one smooth arc, so it never reads as a mouth or teeth. Team style on metal and country is weaker (meat 1.00:1 over a tail of the same colour), but the ink outline keeps the drumstick silhouette and the bone carries it. Gold reads. All sweeps pass (extension at most 7.2)."),
  v("shared", "egg-nest", "a", "keep",
    "Clusters of eggs either side of the feet: instantly eggs, a fun brag, legs kept clear.",
    "At 76 it is clusters of white (or gold) eggs on both sides of the feet on a thin ink pad: three behind, two in front. It reads instantly as 'eggs', it is a fun brag, and it keeps the orange legs clear. At 130 blurred the eggs overlap and differ in size, so no same-size pair reads as eyes. It fits in the Wing night Look on every body."),
  v("shared", "egg-nest", "b", "fix",
    "A grey tray with pointed ends: a gravy boat or turtle shell. Ember straw, lumpy rim, bigger egg.",
    "It is not a nest at 76. It is a small pewter-grey (mutedWarm) tray at the back-left of the feet with one white blob. The smooth dished wall and the long tapered points out of both ends make, at 130 blurred, a gravy boat, a canoe or a turtle shell; at 304 it looks like a grey fish with an egg in its back. On country and disco the broody tail half covers it. The grey reads as stone or metal, never straw.",
    "(1) Fill the straw with ember #ffb35a instead of mutedWarm: warm straw, and it stays clear of the legs because the nest ends at x 20 and the feet start around x 26. (2) Replace the smooth NEST_WALL with a lumpy, woven silhouette that spans x -9..22. Rim at y 64.5 with three rounded bumps, each 9-10u wide and 2.5u high. Underside down to y 74.5 with three rounded bumps, each about 10u wide and 2u deep. All bumps round, none pointed, so the rim never reads as teeth. (3) Remove the two front strands and the low back flick; together they make the prow and stern that read as a boat. Keep one back curl, rooted 8u wide inside the wall and tapering to a point at about (-8,56). (4) Enlarge the front egg to 14 x 17 so at least 9u of white stands above the rim at 76. Keep the other two eggs, all three different sizes. (5) Keep the ink pad under the feet. Pass check at 76: a warm golden bowl with a lumpy edge and eggs in it, beside the tail."),
  v("shared", "egg-nest", "c", "keep",
    "One giant egg behind the legs and one ordinary egg in front: 'she laid THAT?'",
    "At 76 it is one giant white (or gold) egg lying back behind the legs on the ink pad and one ordinary egg in front of the toes. The scale gag lands ('she laid THAT?'). At 130 blurred the big egg is a clear egg oval, not a rock, and the two eggs are far apart on either side of the feet, so they never pair up as eyes. Gold adds the glint arc and shade. Every style passes on every body."),

  // -------------------------------------------------------------- moves --
  v("moves", "horns-pump", "a", "fix",
    "The fist never gets above ear height: a hump or flap, not a pump. Raise the up pose behind the head.",
    "The rules pass (photo −19..14°, lowest y 72.71, parts only), but it doesn't read as a fist pump. Nothing on the bird rises above y 1.3 (minY), so the 'fist' never gets past ear height. At 130px blurred, the up pose looks like a rounded hump behind the hair and the down pose like a flat spread wing, so it reads as flapping behind the back. The 'thrust' frame is the same shape as 'pump up', so the stamp on beat 2 has no extra punch. It is also generic arena rock, not metal.",
    "The fist has to go above the head. Slide the up pose further back and up (around wingX −24…−26, wingY −12…−16, wing ~70–80°) so the wing tip clears the hair top (y < −12) as a separate spike behind the head. Wings paint under the head, so it can pass behind the hair but must not lie flat on it. Make beat 2's thrust the tallest frame, taller than the pumps. Keep the down pose a low spread wing so each pump travels from shoulder height to above the head."),
  v("moves", "double-headbang", "a", "keep",
    "The strongest Move: two pitched bangs with the hair hanging forward read even in silhouette.",
    "The strongest Move on the page. Both bang frames (whole upper body pitched, hair hanging forward, tail spikes flared) look nothing like the wind-backs and read as a headbang even in silhouette at 130px blurred. Photo −18..38° is inside the cap, lowest y 72.71, parts only. The stomp and tail flare set it apart from the shipping headbang dance."),
  v("moves", "heart-point", "a", "fix",
    "The swoon reads; the point is a crab pincer under the chin. Turn the notch down, push the arm out.",
    "The swoon reads (lean back, head thrown back, wing up behind) and the rules pass (photo −34..11°, y 72.71). The point does not. At −176° the wing is a short stub at chin height, and its tip notch opens up and forward, so at 130px and blurred it looks like a crab pincer under the chin, not a pointing arm. YOU is barely longer than point, so the three jabs don't build. A claw shape right under the face is also close to the 'nothing reads as a mouth' rule.",
    "Turn or flip the pointing wing so the notch faces down or back and the leading edge is one clean taper (try −160…−165 with wingY lower, or mirror the wing for this pose). Push it 4–6 units further out (wingX 18–20) so the arm sticks out clearly past the chest. Make YOU obviously the longest and highest (tip at about chin height, never above it). Keep the folded-back pose between jabs."),
  v("moves", "sporty-hop", "a", "keep",
    "Squash, a scissored 18-unit hop, landing and a victory wing: four distinct silhouettes.",
    "Reads well. The squash, an 18-unit hop with the legs scissored (a clear star at the apex), the squash landing and a raised victory wing are four different silhouettes. Photo −15..16°, lowest y 72.71, parts only. The victory wing is a bit lumpy behind the head but stands apart from the dropped tail. Run 3 still needs the ~30 units of headroom the note asks for."),
  v("moves", "boot-scoot", "a", "fix",
    "Only the rocking reads; the heel-toe pokes are tiny and the STOMP looks like rest. Lift the knee clear.",
    "Only the body rocking reads. The heel and toe pokes are a 3.5-unit leg stroke, and the beat-3 heel uses the far leg at 0.7 opacity, which nearly disappears at 130px blurred. The silhouettes of 'lift' and 'stomp', the punchline of heel-toe-heel-toe-STOMP, are the same as rest: the stomping foot stays tucked under the broody belly and the stomp is just a 3.5-unit squash. Rules pass (photo −18..16°, y 72.71).",
    "Make the stomp visible. On 3a bring the near knee up and forward, clear of the belly front (legNearLift 6–8, legNearX +14…+18, legNear −40), with a small hop (y −3), then drive it down on beat 4 with a bigger sink (drop 4–5) and a tail flick. Do the beat-3 heel on the near leg as well (swap the order, or repeat the near heel) so both heels are the bright leg. Push the lean into each heel a little further (−16…−18) so the rock carries at TV distance."),
  v("moves", "yeehaw-buck", "a", "keep",
    "Buck and rear are opposite outlines: a bronco seesaw with no prop. New in 1b, suits the broody bird.",
    "A good replacement for thumbs-in-belt and lasso-twirl, and it suits the small broody bird. Buck (pitched flat, heels up behind) and rear (upright, head back, feet forward) are opposite outlines, so the seesaw reads in silhouette and blurred. It's lively and the rodeo idea comes across with no prop. Photo −32..22°, lowest y 72.71, parts only. Minor nit: on rear and yee-haw the +30/+50° broody wing reads as a hump on the back, not a whooping arm. Fine as it is, but more lift (with the X kept at −9) would sell the yee-haw better. Run 3 needs ~24 units of headroom."),
  v("moves", "night-fever", "a", "keep",
    "One clean diagonal: wing spiked up-back, leg kicked out, tail low. The Travolta pose.",
    "Reads as the pose. A clear up-back spike of wing, kicked-out near leg and the tail sweeping low behind give one diagonal line, clearly different from the 'down' frame. Holding the up with the hip pop through beat 4 gives it its posey Travolta moment. Photo −22..14°, y 72.71, parts only. Nit: the wing points up-back, not up-across, but at 130px it still reads as the Night Fever point. At parade spacing the low tail sits at the bird-behind's leg height, not its face."),
  v("moves", "the-bump", "a", "keep",
    "The bird behind gets knocked back, feet forward: funny and unmistakably a hip bump.",
    "The 'knocked' frame is the payoff and it lands: the bird behind leaps back, feet forward, head and wing thrown back. That's funny and unmistakably two birds bumping hips. Both roles stay in the photo cap (front −26..9°, answer −10..6°), solo −10..6°, lowest y 72.71 everywhere, parts only. The solo reads as a rump flick. Flag for run 3, not this Move: at 53.3-unit spacing the front preener's upright tail at REST (and the same at the 3e shimmy, tail +12) already crosses the bird-behind's face, because the front bird paints over it. The parade's paint order or spacing has to solve that for every preener, with or without the Bump. During the bump itself the tail swoops down off the partner's face, which helps."),
  v("moves", "chicken-dance", "a", "fix",
    "Peck, flap, squat read on two birds; the preener's flap merges with its tail and the clap is a pincer.",
    "Peck, flap and squat read on the stock bird and the spiky one, and the rules pass on all four (photo −10.8..18°, y 72.71, parts only). Three problems. (1) On the disco preener the flap-up wing merges with the upright tail feathers into one rounded mass in silhouette (tail −10 doesn't move them), and the flap is the signature figure. (2) On the broody bird the flap-up wing is a small nub, weak but readable. (3) The clap (wing −135°, wingX 4) puts the notched wing tip forward under the chin on every silhouette, so at 130px it reads as a pincer or open jaw under the face, the same claw problem as heart-point's point. The two wiggle frames differ only in the tail, and on the broody bird that barely shows.",
    "Give the flap-up a per-silhouette tail override for the preener (tail around −95, the low swoosh from Night Fever and the Bump) so the wing stands alone. If shared keyframes are a hard rule, use a tail value that clears the preener and still looks fine on the others. Redo the clap so the wing folds flat against the chest with the notch turned down or back, not sticking out under the chin: try −110…−120 with wingY +3, or the mirrored wing used for the point fix. Widen the wiggle with the hips: x ±4 and the lean alternating ±6, not just the tail.")
];

// ------------------------------------------------------------- Gate 1 --
// Brad's keep-or-cut pass over this sheet, 2026-10-20
// (docs/bird-wardrobe-gate-1.md), laid over run 1b. A cut variant is gone
// from its module and from the sheet. A kept "fix" ships only with the
// critic's fix made: GATE_1_FIXED says what was drawn, and the tile becomes a
// keep that carries `critic: "fix"` and `landed`. The eight country-kit
// drawings no critic re-judged were kept by Brad's eye at 76px.

const GATE_1_CUT = new Set([
  "metal-kit:bandolier:a",
  "metal-kit:chain-loop:a",
  "metal-kit:spiked-cuff:a",
  "metal-kit:spiked-boots:b",
  "metal-show:drumsticks:b",
  "metal-show:drumsticks:c",
  "country-show:hay-bale:a",
  "disco-kit:open-shirt:a",
  "disco-kit:dagger-collar:c",
  "disco-kit:satin-jacket:b",
  "disco-kit:tinsel:b",
  "disco-kit:platforms:b",
  "disco-show:mirror-ball-egg:b",
  "disco-show:hand-fan:a",
  "disco-show:vinyl:a"
]);

const GATE_1_KEPT_BY_EYE = new Set([
  "country-kit:western-yoke:a",
  "country-kit:trophy-buckle:b",
  "country-kit:fringed-vest:b",
  "country-kit:fringe-sleeve:a",
  "country-kit:suede-sleeve:b",
  "country-kit:tail-bandana:b",
  "country-kit:rope-coil:a",
  "country-kit:rope-coil:b"
]);

/** The fix as drawn: [the tile's one line, what was changed]. Keyed "unit:item:variant". */
const GATE_1_FIXED = {
  "metal-kit:battle-vest:b": [
    "Fix made: the flame patch has three sharp tongues with V notches the black vest shows through, so it reads as a flame, not an egg.",
    "VEST_FLAME is the critic's path exactly: three tips joined with straight lines, notches 4 to 6 deep, solid ember with the 1.5 ink edge. At 130 blurred it is still a flame."
  ],
  "metal-kit:chain-loop:b": [
    "Fix made: six big spikes on the flail ball instead of eight studs, so it reads as a mace on a chain.",
    "spikeBall({x:5.4,y:40.8}, 4.6, 4.2, fill, 6, 20°) with a 1.5 mitred edge, and the lowest link nudged to (5.2,35.6) to meet the ball. Exactly as asked; the tail rule passes."
  ],
  "metal-kit:combat-boots:c": [
    "Fix made: no heel plate, one big angular steel toe cap, so it is a steel-toe boot, not a two-tone sneaker.",
    "The heel plate is gone and the toe cap is the critic's 9.2 × 6.8 path wrapped over the instep, chrome with a 1.5 mitred edge. The boot is unchanged."
  ],
  "metal-kit:spiked-boots:a": [
    "Fix made: the horn is a fat 7-unit cone, so it reads as a spike, not a stripe or a skate blade.",
    "The spike is the critic's cone, 13 long and 7 at the base (ax−3 61.8 → ax+10 65 → ax−3 68.8), stroked 1.5 mitred. Both styles pass. It is still a modest shape on the whole bird."
  ],
  "metal-show:flying-v:a": [
    "Fix made: the ink style is gone; white is the default and gold stays optional.",
    "styles [\"white\", \"gold\"], as b already was. The ink-only detail colour code went with it. Geometry unchanged."
  ],
  "metal-show:flying-v:c": [
    "Fix made: the ink style is gone; white is the default and gold stays optional.",
    "styles [\"white\", \"gold\"]. Geometry unchanged (J [25.5,37], deg 74, n 23)."
  ],
  "metal-show:drumsticks:a": [
    "Fix made: the crossbones are raised and the meats splayed out past the legs, so the orange legs stand clear.",
    "Stick 1 runs k [31,42.5] to t [64,55], stick 2 k [49,42.5] to t [14,55], r 3.7, meat 0.33, exactly as asked; the head box passes without the 1-unit fallback. In Drummer the raised meats lined up with biker-jacket b's ember hem into one orange bar, so Drummer now wears biker-jacket a."
  ],
  "pop-kit:crop-jacket:a": [
    "Fix made: the white stops 5 units short of the front outline, so pink shows down an open front, and the hem is raised to y 50.",
    "A 2u ink front edge follows the outline's curve with a 5u pink strip in front of it, the ink rib at y 50–54 stops at the opening, and the V notch is gone. The critic's x values sat about 10u right of the real chest (front edge x 61–64), so the shapes are moved onto it at the critic's spacing. The optional lapel line is skipped (it cut the white into scraps). Still a fairly blocky white panel at 76."
  ],
  "pop-kit:tracksuit-top:a": [
    "Fix made: two straight parallel white bars plus a zip line, so nothing curves and there is no rib-cage read.",
    "Bars at the critic's 6:17 slant and 4.5u spacing, moved 10u left onto the real chest: (51,39)→(57.7,58) and (55.5,39)→(62.2,58), squared off by the hem at y 56, with a 2u white zip (48,38)→(52.4,58). The zip reads mostly as a third, thinner stripe. Ink bars on the white style stay straight, so white is kept."
  ],
  "pop-kit:little-black-dress:a": [
    "Fix made: a straight neckline at y 44 on two straps, a 9-unit hourglass pinch and an A-line skirt, so the chest is pink above a black dress.",
    "Straps (54.6,37.4)→(56,44.5) and (59.4,39.6)→(60.4,44.5); the skirt flares in a straight A-line to the body's front-bottom corner (61.2,55.8). NOT as asked: the critic's 3u flare past the outline can't be drawn, because the Top region rule allows 1u and bird-wardrobe §1.3 keeps kit inside the body (the game colliders are the body), so the flare is inside the outline. The lower skirt still reads as a dark band under the wing."
  ],
  "pop-kit:union-jack-dress:a": [
    "Fix made: the jack is a bodice over a separate ink skirt with a white hem band, so a is the flag dress and b the straight tube. Team style dropped.",
    "Jack bodice y 40–52 with a pink waist seam, an ink skirt hemmed (44,60)→(61.2,55.8) with a 3u white band along it; styles [\"ink\"]. NOT as asked: the 3u flare past the outline, for the same reason as little-black-dress a (region rule and §1.3), so at the front the skirt is only about 4u tall."
  ],
  "pop-kit:puff-sleeve:a": [
    "Fix made: three big overlapping lobes hang from a team-pink cuff band, so it is one frill, not teeth.",
    "Three 9 × 6 lobes centred at x 29, 36 and 43, overlapping about 2u and inked round the outside only, under a 3u team-pink cuff band. They span x 24.5–47.5 (past 48 a lobe showed on the chest) and sit 0.6u higher than asked to keep the sleeve fringe under 7u. A row of white scallops under a dark line can still faintly suggest teeth at 76."
  ],
  "pop-kit:ribbon-streamers:a": [
    "Fix made: two wide 20-unit ribbons tied at one knot on the middle tail tip, splayed 35 degrees. Team style dropped.",
    "Ribbons 5u tapering to 4u, one S-wave of amplitude 4, 5u swallowtails, tied at a 6u knot with a short loop at (2,20); styles [\"white\", \"ink\"], the ink style alternating an ink and a white ribbon. Tail reach 8.0."
  ],
  "pop-kit:ribbon-streamers:b": [
    "Fix made: the gymnast's baton, a 10-unit stick up and back from the top tail tip, with the ribbon cascading off its end. Team style dropped.",
    "A 10u baton along (−6,−8) from (11.4,11), the 5u ribbon in its S from the baton's end; styles [\"white\", \"ink\"]. NOT as asked: the baton is white with an ink edge, because a plain ink stick vanished on the dark room. Tail reach 9.6."
  ],
  "pop-kit:go-go-boots:a": [
    "Fix made: a wider flared white boot with a long pointed toe; white is now the default.",
    "Shank 8u flaring to a 10u mouth at y 56, heel 3u behind a 3u notch, styles [\"white\", \"ink\"] with a 3u shine on the ink. The toe stops at x+10, not x+11 (x+11 breaks the 9-unit boots band), and the arch notch is filled with ink because open it showed the orange toes."
  ],
  "pop-show:star-mic:b": [
    "Fix made: the mic tilts up toward the beak, about 33 degrees, so it is a star mic held under the chin, not a sheriff's badge.",
    "Handle half-width 2.4 to 3, star r 8.6 tip up, inner 0.5, as asked, but 2.4u lower than the critic's spot: handle (49,57.4)→(58.6,51), star centre (63.2,48.2). At the critic's spot the star crossed the face line and the walk tuck lifted its tip into the head box."
  ],
  "pop-show:corded-mic:a": [
    "Fix made: the mic is raised to the chin at about 43 degrees, so it is a sung mic, not an ice cream at crotch height.",
    "Cone 14 long tapering 3.2 to 1.8 with the 1.6 outline and 2.4 collar, egg centre (61.5,46.3): 2.3u lower than asked, which crossed the face line and the head box at the tuck. The critic's butt and U points sat on the belly's bottom edge, where the cable merged with the outline, so the 2.4 cable loops back up onto the pink under the wing. The cable is weak at 76: it looks like another wing scallop."
  ],
  "pop-show:pom-pom:c": [
    "Fix made: the pom is lifted clear of the back on a visible stick, so it is held up, not a cottontail.",
    "The stick is a 4.4 ink line with a 2.4 mutedWarm core (#b3a89a) from (36,45) to (19.5,25); same pom size, white only. NOT at the critic's centre: (19.5,17.5) and the fallback (21,19) both break reach (14.2 and 13.4, limit 10), and the back is at y 28.5 there, not 31. Centre (15.5,20), over the upper tail feathers, is the highest that passes."
  ],
  "pop-show:union-jack-flag:a": [
    "Fix made: a waving flag flown forward off the breast on its pole, so it is a flag, not a patch on the belly.",
    "wavyJack from the pole top along (1,0.12), 17 long and 9 deep, one wave growing to 1.8, ink with the white inset hem. The pole sits 8u further back than asked, (53,58)→(54.5,40.6): at the critic's spot the fly end was 17u past the breast (limit 10). The fly half waves on the dark page about 8u out. Ginger keeps flag c."
  ],
  "country-kit:tail-bandana:a": [
    "Fix made: redrawn inside the Tail region as a kerchief knotted round the lower plume, so it reads as cloth tied on the tail, not a speck or a cursor.",
    "A full redraw (moving the old point inside the region still read as a cursor): the kerchief wraps the lower plume's bend from (2.2,45.2) to the body edge and hangs to one point at (6.8,62.4), about 9u under the plume, with a square knot behind and one broad tie end flying back to (−6.8,52). The knot is in the style colour (an ink knot on white read as a blob). Both styles pass the region rule; the ink style is weaker, a dark rag tied on. Not judged by a critic, only by the drawing session."
  ],
  "country-show:corn-cob:a": [
    "Fix made: blunt bullet cobs with gentle lumps and two lengthwise kernel rows, each between two hugging white husk leaves: the corn emoji, twice.",
    "Bumps 0.9 every 3.4, dims w0 8 / wMax 10.5 / wTip 7, kernel rows stroke 2 at ±width/5 from t 0.2 to 0.85, droopingHusk deleted, hugLeaf(±1, 0.62, 4, 1.8) at stroke 2, as asked. The V is narrower than asked (about 46 against 52 degrees): the up cob's leaf crossed the chin rule at (28,22), so it leans back to (21.8,23) and the back cob drops to (7.8,36). Corn at 130 blurred, but busy at 76, where the four white leaves fan a little like feathers."
  ],
  "country-show:corn-cob:c": [
    "Fix made: one fat blunt cob with kernel rows between two flaring white husk leaves: the corn emoji, no torch, no flower.",
    "Bumps 0.9 every 3.4, dims 9.4 / 13.5 / 9, kernel rows, droopingHusk deleted, hugLeaf(±1, 0.6, 4.2, 1.8) at stroke 2, as asked. p1 is (19.4,23.6): the asked (23.4,21.8) and the fallback (21,23) both crossed the chin rule. The leaves' right edge is at x 34.3, about 9u clear of either white bandana."
  ],
  "country-show:acoustic-guitar:b": [
    "Fix made: white only. The ink style (the black frying pan) is gone.",
    "styles [\"white\"], and the ink-only drawing paths shared with a are deleted, since no guitar uses ink now. Geometry unchanged."
  ],
  "country-show:hay-bale:b": [
    "Fix made: a bigger, softer bale with rounded corners, a bowed top, long wisps, shaggy ends and thicker twine, so it is straw, not a crate or cheese.",
    "Twine 2.2 at x 67 and 80, top 59, bottom 71.6, corners r 2.6, top bowed up 1u, five wisps leaning 30 to 42 degrees, four tufts per end splayed 2.4 to 3u. The right end is x 85, not 88 (with the tufts, 88 passed the stage's x 88 limit), and the wisps are 2.8 to 3.8 tall, not 3.5 to 4.5 (taller ones crossed y 55 on the bowed top)."
  ],
  "disco-kit:satin-jacket:a": [
    "Fix made: a cased white zip down the front, a 7-unit team rib collar and a 15-unit star patch, so it is a zipped jacket, not the open shirt.",
    "Zip 2.6 white cased 1.2 ink from (57,40.5) to (55.5,58) (ink in the white style), the rib widened to 7 with its lower edge 46 40.1 to 62.5 47.8 and no piping, star r 7.5 at (40,49.5) in the team colour, as asked. The zip and the star are also clipped to the body (the preener's belly is about y 54.5, so the star's bottom tips lose about 2u), and the rib is cut at y 37 for the hair rule; the neck already covered that part. The team rib sits close in value to the cyan neck."
  ],
  "disco-kit:flare-sleeve:b": [
    "Fix made: the team style has c's ink cuff band, so the cyan sleeve has a dark seam into the white bell.",
    "An ink stroke 3.4 wide with round caps along BELL_CUFF, drawn after the bell, in the team style only. The ink style is unchanged."
  ],
  "disco-kit:tinsel:a": [
    "Fix made: crinkled foil ribbons that droop in one gentle curve, each ending in a fat sparkle at a different height. No S, no stink lines.",
    "crinkleC with n 12 and 7, amp 1.6, cased stroke core 3.4 and edge 1.2, mitred; sparkles r 6, k 0.5, as asked. The long strand ends at (6,37), not (3,37), with its second control at (3,28): at the asked numbers it reached 12.5u from the tail (limit 10). The short strand is a little lightning-bolt-like."
  ],
  "disco-kit:feather-boa:a": [
    "Fix made: a sagging swag that drops in one long end, with fat scalloped fluff, not a hard white L.",
    "The critic's path exactly (M 33.5 31 C 26 34 15 31 10 16 C 4 20 1 30 3.5 42), core 7 with a 4.4 inner, fluff 12.5 with a 9.6 inner, period 5.5."
  ],
  "disco-kit:feather-boa:b": [
    "Fix made: the boa starts hidden at the high sickle tip, so one fluffy end streams off it: no arch, no bag handle.",
    "The critic's path exactly, from M 17 1.5, with fluff 12.5 / 9.6 inner, period 5.5. The core stays at 6.6 with a 3.8 inner; the fix gave only the fluff."
  ],
  "disco-kit:platforms:a": [
    "Fix made: each sole is a shoe, a tall heel and a lower toe over an arch notch, so the two shoes no longer merge into one brick.",
    "The critic's sole path, a white sole under an ink upper (a gold upper in gold), the shoe narrowed to x−5..x+8 with the upper's back edge at x−4. The near heel runs back to x−8, because at x−5 the back toe showed as an orange nub; the two shoes still only kiss. The ink style is dropped (styles [\"white\", \"gold\"]): the fix's white style is the old ink shoe."
  ],
  "disco-show:hand-fan:b": [
    "Fix made: a solid ink leaf opened 140 degrees with white pleats, rounded scallops and two guard sticks; ink is the default. A fan, not an eggshell.",
    "styles [\"ink\", \"white\", \"gold\"]; the leaf solid from r 3 to 14 between 200 and 340 degrees, 7 round scallops 1.5 proud, 6 pleat strokes 2u from r 5 to 12 (white on ink, ink on white and gold), two 2.5 ink guards to r 15, no rivet dot. The rivet is at (26.5,49.5), not (26.5,48): higher, the scallops at 300 to 315 degrees entered the head box at rest."
  ],
  "shared:team-sash:b": [
    "Fix made: the knot slides down to the back hip and the tails swing back over the rump as 8-unit forked ribbons, so nothing hangs between the legs.",
    "Knot 9 × 13, k 1 on every body; tails 8u wide with 3.5u V notches, painted over the band and under the knot; ink style keeps the team rim and two 13u cinch lines. Per body, because the body under the band is shallower than the fix assumed: broody as asked (t 0.68, two tails at 138 and 115 degrees); stock (t 0.64) and spiky (t 0.62) take the fix's own one-tail fallback at 125 degrees; the preener's chest is about 4u deep under the band, so by \"never draw a 4u nub\" it wears the knot only. Every tail point stays left of x 29.5 below y 55, so both legs stay orange."
  ],
  "shared:golden-egg:a": [
    "Fix made: the egg moves off the sash band, so at least 3 units of team colour separate it from a white sash.",
    "Team colours already wears team-sash a in ink. The egg also moved, further than the asked +3/+2 (which left only 0.25 to 1.6u): stock [36,63.5], spiky [34,64], broody [37,63], preener [32,64], 3.0 to 3.4u from the band, with the sweep re-run. It now sits lower and further forward by the near leg, less tucked under the wing."
  ],
  "shared:drumstick:a": [
    "Fix made in part: a bigger meat hanging behind the legs off the rump, so both legs are fully orange. It cannot hang as low as asked.",
    "Meat r 5.5, meat 0.55, as asked. The asked placement (and its +3u fallback) dips 3 to 8u under the soft floor in the chicken-dance flap and the horns-pump stamp, and fails the walk tuck and reach, so it hangs as low as the sweep allows: stock k [26,46] t [19,59.5], spiky k [26,46] t [18.5,59], broody and preener k [25,46] t [20.5,60.5]. Against the room on three bodies; on the broody it lies on the body, ember on orange held apart by its ink outline."
  ],
  "shared:egg-nest:b": [
    "Fix made: ember straw, a lumpy round rim and underside, no prow or stern strands, and a bigger front egg: a golden nest, not a gravy boat.",
    "Rim three round bumps 9.8 × 2.5 topping at y 64.5, underside three bumps 9.2 × 2 down to y 74.5, one back curl rooted 8u wide tapering to (−7.8,56), front egg 14 × 17 with 9u above the rim, the ink pad kept. The wall's back end is x −7.5, not −9 (the stage limit is −8). The underside bumps lean a little toward a row of buns."
  ],
  "moves:horns-pump:a": [
    "Fix made: the fist goes above the head, a separate spike behind the hair, and the beat-2 thrust is the tallest frame.",
    "Up +82 degrees, wingX −24, wingY −20 (tip y −14.2); the thrust +84, wingY −22 with a 4u hop (tip y −20.4); down a low spread wing at +20, wingX −18, wingY −4, so each pump swings 62 degrees. wingY is −20 not −12..−16 (at −14 the tip only reached y −8.8), and the lean on up beats is −3..−4 not −7. The raised wing's root floats a little off the back; a tail spike joins it in silhouette."
  ],
  "moves:heart-point:a": [
    "Fix made: the pointing wing is mirrored, so its leading edge is one clean taper with the notches underneath. No pincer.",
    "A new rig field, wingFlip, mirrors the wing about its shoulder (no angle alone turns the notch down). Point −26 mirrored at wingX 11; YOU −42 mirrored at wingX 15, wingY 6, lean 7, the longest and highest, tip at chin height; fold-back +45 mirrored between jabs. wingX 15, not 18..20: further out the mirrored wing's root leaves the chest. It still ends in the stock wing's broad mitten. Porting needs wingFlip on CharacterFigure's wing."
  ],
  "moves:boot-scoot:a": [
    "Fix made: a visible knee lift and a big stomp, with both heel-toes on the near (bright) leg and a deeper lean into each heel.",
    "Lean −17 into each heel; on 3a a 3u hop, lean −12, legNearLift 8, legNearX 27, legNear −75; the beat-4 stomp drops 4.5 with a +28 tail flick. The lift is steeper than the asked −40 / +14..18, which left the foot inside the belly outline."
  ],
  "moves:chicken-dance:a": [
    "Fix made: the flap's tail clears the preener's wing, the clap folds the wing flat down the chest, and the wiggle swings the hips.",
    "Flap-up tail −65 on every silhouette (the page has no per-silhouette keyframes; −95 turned the spiky tail into a kickstand). Clap: the mirrored wing (wingFlip) flat down the chest at +60, notches back, opening to +10 between claps; the asked −110..−120 still stuck out under the chin. Wiggle x ±4 with the lean alternating ±6."
  ]
};

const gate1 = (v) => {
  const key = `${v.unit}:${v.item}:${v.variant}`;
  const fixed = GATE_1_FIXED[key];
  if (fixed) return { ...v, critic: v.verdict, verdict: "keep", gate: "fixed", line: fixed[0], landed: fixed[1] };
  if (GATE_1_KEPT_BY_EYE.has(key))
    return { ...v, critic: v.verdict, verdict: "keep", gate: "by-eye", line: "Kept by Brad's eye at 76px at Gate 1. No critic has re-judged this drawing (the run 1b country-kit critic failed).", fix: undefined };
  return v;
};

export const VERDICTS = RUN_1B.filter((v) => !GATE_1_CUT.has(`${v.unit}:${v.item}:${v.variant}`)).map(gate1);

/**
 * What the Looks critic said about each Look at 76px: does the full kit hold?
 * holds: "yes" | "partly" | "no". Keyed by genre, then Look name (the names
 * in looks.js); the shared Looks are shown on every genre. Run 1b rewrote
 * looks.js so every Look wears only kept art (the one exception is noted).
 */
export const LOOK_NOTES = {
  metal: {
    Thrash: { holds: "yes", note: "battle-vest a, leather-sleeve a ink, combat-boots a ink, flying-v b white. The vest and sleeve merge into leather on purpose and the white V is the brightest shape (18.7:1 against the sleeve). The strongest Look on the page." },
    Pyro: { holds: "yes", note: "flame-sleeve b ink, lava-tips b, lava-disc c: fire on the wing, the tail and the floor, the chrome chest left clear. The bandolier was dropped (it turned the back half into an orange tangle in six tries) and now sits in Full kit." },
    Drummer: { holds: "yes", note: "Gate 1: biker-jacket a (the whole body in black leather), drumsticks a white (the splayed crossbones; c was cut) and bolt-disc a in place of the speaker cab, which was never drawn. With jacket b the raised meats lined up with its ember hem into one orange bar, so Drummer wears a: white bones and ember meats on black. Judged by the art pass, not a critic." },
    "Full kit": { holds: "yes", note: "bandolier b, flame-sleeve a, chain-loop b (Gate 1 cut a: the morning-star flail now), combat-boots b, battle-axe a white, lava-disc a. Busy but legible; the axe is the brightest shape." },
  },
  pop: {
    Sporty: { holds: "yes", note: "tracksuit-top b (shell suit), stripe-sleeve b team (the three stripes), platform-trainers a white, pom-pom a white. Pom against the sleeve 3.53:1." },
    Ginger: { holds: "yes", note: "union-jack-dress b ink, union-jack-flag c ink waved high behind the back, led-star-riser a. The two jacks never touch: the amber top/prop 1.00 is apart in space, and the flag's white hem draws its outline." },
    Posh: { holds: "yes", note: "little-black-dress b (strapless, pink bow), go-go-boots b ink (white cuff), star-mic a white held out over the tail. Star-mic c, raised behind the head, crowded the photo head. The dress still reads mostly as a dark lower body." },
    Baby: { holds: "yes", note: "crop-jacket b ink star bomber, big-bow b white (ponytail bow), spotlight b white. No sleeve: puff-sleeve's only keep (b) is the same star and must not be worn with crop-jacket b. Puff-sleeve b with no top also holds and is an alternative." },
    "Full kit": { holds: "yes", note: "tracksuit-top b, stripe-sleeve a team, big-bow a white, platform-trainers b, corded-mic b white, led-star-riser b. Dense but holds." }
  },
  country: {
    Rodeo: { holds: "yes", note: "trophy-buckle a (star), fringe-sleeve b ink, lasso b white twirled behind the tail (18.7:1 against the sleeve), sawdust-ring a (barrel). Fringe-sleeve b was a run 1 fix (its team style, now dropped), the one exception to kept-only art. Amber: the white buckle and white lasso share a value but sit apart." },
    "Honky-tonk": { holds: "yes", note: "western-yoke b (ink, white bolo), suede-sleeve a ink, acoustic-guitar a white, sawdust-ring b (saguaro). The white guitar fixes run 1's one-black-chest merge." },
    Farmhand: { holds: "yes", note: "bandana b white, lasso c ink (the wind-up) and egg-nest a as a farm stage. (Written before Gate 1 kept corn-cob and rope-coil; the Look was not re-dressed.) The weakest country Look; the bandana and rope carry it." },
    "Full kit": { holds: "partly", note: "Gate 1: fringed-vest a, fringe-sleeve b ink, tail-bandana b white (country's first kept Tail, kept by eye), lasso b white, sawdust-ring a. The white bandana sits under the white lasso twirl and is mostly lost in it at 76; the rest holds. Judged by the art pass, not a critic." }
  },
  disco: {
    Fever: { holds: "yes", note: "open-shirt b (ink, medallion), flare-sleeve c white (the bell cuff breaks the outline: Travolta's white suit over a black shirt), lit-floor a. No platforms. Reads a little magpie in black and white; the lit floor makes it disco." },
    "Studio 54": { holds: "yes", note: "dagger-collar b white, mirror-ball-egg c white raised overhead, neon-flames b. The amber top/prop pair (white collar, white ball) sits apart in space." },
    Roller: { holds: "yes", note: "open-shirt c (ink with sparkles), roller-skates a white, vinyl b. The skates carry it; the vinyl is small and weak at 76. The satin-sleeve version failed rule 8 at 2.43:1." },
    "Full kit": { holds: "yes", note: "Gate 1: open-shirt c, satin-sleeve b white, tinsel a white, roller-skates b, hand-fan b ink, neon-flames a. The fixed hand fan is disco's first ink Prop, so the white Sleeve and the Prop pass rule 8 (18.7:1) where vinyl failed at 2.43:1. Very busy: the tinsel is the loudest shape. Judged by the art pass, not a critic." }
  },
  shared: {
    "Wing night": { holds: "yes", note: "wing-night-bib a ink, drumstick b white (raised and bitten), egg-nest c (one giant egg). Holds on all four genres." },
    "Team colours": { holds: "yes", note: "team-sash a in ink with golden-egg b white (the trophy). That fixes run 1's 1.00:1 white-on-white club. The hoisted egg reads more as a trophy cup than an egg." }
  }
};

/** What is still open after Gate 1 (2026-10-20): every kept tile ships, so these are the reads to watch, not gaps. */
export const GAPS = {
  metal: "Gate 1 cut the crossed bandolier (b is the slung belt only), chain-loop a, spiked-cuff a, spiked-boots b and drumsticks b and c. spiked-cuff and spiked-boots keep one variant each. The bandolier has no gold. All seven metal fixes are made.",
  pop: "All twelve pop fixes are made. Two could not be drawn as asked: the dresses' skirts (little-black-dress a, union-jack-dress a) cannot flare 3u past the outline, because the Top region rule and §1.3 keep kit inside the body. Weakest after the fixes: corded-mic a's cable reads as another wing scallop; crop-jacket a is still a blocky white panel. The pom-pom has no gold.",
  country: "Gate 1 cut hay-bale a and took gold off every country item (1.30:1 on the orange). All five fixes are made and tail-bandana a now passes the region rule, so country has three kept Tails. The eight drawings no critic re-judged were kept by Brad's eye. Weakest after the fixes: corn-cob a is busy at 76 (four white leaves fan like feathers).",
  disco: "Gate 1 cut open-shirt a, dagger-collar c, satin-jacket b, tinsel b, platforms b, mirror-ball-egg b, hand-fan a and vinyl a; the mirror ball has no gold. All seven disco fixes are made. hand-fan b is now ink by default, disco's first ink Prop, so the Full kit passes rule 8. platforms a dropped its ink style (the fix made it the same shoe as white).",
  shared: "All four shared fixes are made. drumstick a cannot hang as low as asked (the chicken-dance flap and the horns-pump stamp sweep it 3–8u under the floor), so it hangs off the rump as low as the sweep allows. team-sash b wears two tails only on the broody, one on stock and spiky, and the knot alone on the preener.",
  moves: "All four Move fixes are made. heart-point and chicken-dance mirror the wing (a new wingFlip rig field), which CharacterFigure needs before run 3 can port them. The fist pump's raised wing floats a little off the back. For run 3: sporty-hop needs about 30 units of headroom and yeehaw-buck about 24; at the 53.3-unit parade spacing the front preener's upright tail already covers the face of the bird behind at rest."
};
