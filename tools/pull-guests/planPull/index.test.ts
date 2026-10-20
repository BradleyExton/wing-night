import assert from "node:assert/strict";
import test from "node:test";

import type { AdminGuestExport } from "../../../packages/shared/src/guestPortal/export/index.ts";
import type { OutfitsByGenre } from "../../../packages/shared/src/outfit/index.ts";
import {
  describePlan,
  listPlannedWrites,
  planPull,
  readAvatarManifest,
  readPlayersFile,
  type AvatarManifest,
  type PlayersFile
} from "./index.ts";

const NOW = new Date("2026-10-07T12:00:00.000Z");
const ROB_HASH = `1a2b3c4d${"0".repeat(56)}`;
const KIM_HASH = `ffee0011${"9".repeat(56)}`;

// The manifest after Rob's head was pulled.
const PULLED_ROB: AvatarManifest = {
  generated: { rob: { file: "rob-1a2b3c4d.png", source: "online", at: "earlier", sha256: ROB_HASH, guestId: "g_rob" } },
  onlineGuests: { g_rob: "rob" }
};

const ONLY_OLD_ROB_ON_DISK = (file: string): boolean => file === "rob-1a2b3c4d.png";

const guest = (
  guestId: string,
  displayName: string,
  sha256: string | null = null,
  team: string | null = null
): AdminGuestExport => ({
  guestId,
  displayName,
  head: sha256 === null ? null : { sha256, contentType: "image/png", bytes: 100 },
  team
});

const plan = (
  playersFile: PlayersFile,
  guests: AdminGuestExport[],
  manifest: AvatarManifest = { generated: {} },
  headFileExists: (file: string) => boolean = () => false
) => planPull({ playersFile, manifest, guests, headFileExists, now: NOW });

test("does add an unmatched guest as an unseated player and keep every existing player when merging", () => {
  const playersFile = { players: [{ name: "Alex", team: "Disco" }, { name: "Jazz" }] };
  const result = plan(playersFile, [guest("g_kim", "Kim"), guest("g_jazz", "Jazz")]);

  assert.deepEqual(result.players.players, [{ name: "Alex", team: "Disco" }, { name: "Jazz" }, { name: "Kim" }]);
  assert.deepEqual(result.addedPlayers, ["Kim"]);
  assert.equal(result.playersChanged, true);
  assert.deepEqual(playersFile.players.length, 2, "the input is not mutated");
});

test("does match a guest by slug and never rename the player or drop their team when merging", () => {
  const playersFile = {
    version: 2,
    players: [{ name: "Steve B", team: "Metal", avatarSrc: "avatars/steve-b.png", nickname: "Stevie" }]
  };
  const result = plan(playersFile, [guest("g_steve", "  steve b! ", ROB_HASH)]);

  assert.deepEqual(result.players, {
    version: 2,
    players: [{ name: "Steve B", team: "Metal", avatarSrc: "avatars/steve-b-1a2b3c4d.png", nickname: "Stevie" }]
  });
  assert.deepEqual(result.addedPlayers, []);
  assert.deepEqual(result.avatarChanges, [
    { name: "Steve B", from: "avatars/steve-b.png", to: "avatars/steve-b-1a2b3c4d.png" }
  ]);
});

test("does leave a player's avatarSrc alone when their guest has no head", () => {
  const result = plan({ players: [{ name: "Rob", avatarSrc: "avatars/rob.png" }] }, [guest("g_rob", "Rob")]);

  assert.deepEqual(result.players.players, [{ name: "Rob", avatarSrc: "avatars/rob.png" }]);
  assert.deepEqual(result.manifest, { generated: {}, onlineGuests: { g_rob: "rob" } });
  assert.deepEqual(listPlannedWrites(result), ["local/avatar-sources/manifest.json"]);
});

test("does name the head file by slug and hash prefix and record it as online in the manifest when a head is new", () => {
  const manifest = { generated: { alex: { file: "alex.png", model: "m", at: "then" } } };
  const result = plan({ players: [{ name: "Alex" }] }, [guest("g_rob", "Rob", ROB_HASH)], manifest);

  assert.deepEqual(result.downloads, [
    { guestId: "g_rob", name: "Rob", file: "rob-1a2b3c4d.png", sha256: ROB_HASH, bytes: 100 }
  ]);
  assert.deepEqual(result.manifest, {
    generated: {
      alex: { file: "alex.png", model: "m", at: "then" },
      rob: { file: "rob-1a2b3c4d.png", source: "online", at: NOW.toISOString(), sha256: ROB_HASH, guestId: "g_rob" }
    },
    onlineGuests: { g_rob: "rob" }
  });
  assert.deepEqual(result.players.players[1], { name: "Rob", avatarSrc: "avatars/rob-1a2b3c4d.png" });
  assert.deepEqual(listPlannedWrites(result), [
    "local/assets/avatars/rob-1a2b3c4d.png",
    "local/avatar-sources/manifest.json",
    "local/players.json"
  ]);
});

test("does plan no write when the head's hash is unchanged and its file is on disk", () => {
  const players = { players: [{ name: "Rob", avatarSrc: "avatars/rob-1a2b3c4d.png" }] };
  const manifest = PULLED_ROB;
  const settled = plan(players, [guest("g_rob", "Rob", ROB_HASH)], manifest, () => true);

  assert.deepEqual(listPlannedWrites(settled), []);
  assert.deepEqual(describePlan(settled), ["Nothing to pull: the pack already has every guest and every head."]);

  const fileGone = plan(players, [guest("g_rob", "Rob", ROB_HASH)], manifest, () => false);

  assert.deepEqual(listPlannedWrites(fileGone), ["local/assets/avatars/rob-1a2b3c4d.png", "local/avatar-sources/manifest.json"]);
});

test("does give a changed head a new versioned file when the guest kept a different one", () => {
  const players = { players: [{ name: "Rob", avatarSrc: "avatars/rob-1a2b3c4d.png" }] };
  const manifest = PULLED_ROB;
  const result = plan(players, [guest("g_rob", "Rob", KIM_HASH)], manifest, ONLY_OLD_ROB_ON_DISK);

  assert.equal(result.downloads[0]?.file, "rob-ffee0011.png");
  assert.equal(result.players.players[0]?.avatarSrc, "avatars/rob-ffee0011.png");
});

test("does refuse when two guests would become the same player", () => {
  assert.throws(
    () => plan({ players: [] }, [guest("g_1", "Steve B"), guest("g_2", "steve-b")]),
    /Pull refused, nothing written:[\s\S]*Guests "Steve B", "steve-b" would all be the new player "steve-b"; rename all but one on wingnight\.tv/
  );
});

test("does refuse when a guest matches two players", () => {
  assert.throws(
    () => plan({ players: [{ name: "Jo Jo" }, { name: "jo-jo" }] }, [guest("g_jo", "Jo Jo")]),
    /Guest "Jo Jo" matches players "Jo Jo", "jo-jo"/
  );
});

test("does refuse when a guest's name has nothing to match by", () => {
  assert.throws(() => plan({ players: [] }, [guest("g_x", "!!!")]), /Guest "!!!" \(g_x\) has no letters or digits/);
});

test("does list every collision at once when there are several", () => {
  assert.throws(
    () => plan({ players: [] }, [guest("g_1", "Ana"), guest("g_2", "ANA"), guest("g_3", "?")]),
    (error: Error) => error.message.split("\n").length === 3
  );
});

test("does refuse a roster or manifest when it cannot read it rather than guess", () => {
  assert.throws(() => readPlayersFile({ players: [{ team: "x" }] }, "p.json"), /p\.json is not a roster/);
  assert.throws(() => readPlayersFile([], "p.json"), /not a roster/);
  assert.throws(() => readAvatarManifest({ generated: [] }, "m.json"), /m\.json is not an avatar manifest/);
  assert.throws(() => readAvatarManifest({ generated: {}, onlineGuests: { g_1: 3 } }, "m.json"), /not an avatar manifest/);
  assert.deepEqual(readAvatarManifest({}, "m.json"), { generated: {} });
});

test("does describe added players, avatar changes and files with sizes when there is a diff", () => {
  const result = plan({ players: [{ name: "Rob", avatarSrc: "avatars/rob.png" }] }, [
    guest("g_rob", "Rob", ROB_HASH),
    guest("g_kim", "Kim")
  ]);

  assert.deepEqual(describePlan(result), [
    "Players to add (1):",
    "  + Kim",
    "Avatar changes (1):",
    "  Rob: avatars/rob.png -> avatars/rob-1a2b3c4d.png",
    "Team changes (0):",
    "Outfit changes (0):",
    "Files to write (3):",
    "  local/assets/avatars/rob-1a2b3c4d.png (100 bytes)",
    "  local/avatar-sources/manifest.json",
    "  local/players.json"
  ]);
});

test("does keep the player and only update the head when a pulled guest is renamed on the portal", () => {
  const players = { players: [{ name: "Rob", team: "Metal", avatarSrc: "avatars/rob-1a2b3c4d.png" }] };
  const result = plan(players, [guest("g_rob", "Robert", KIM_HASH)], PULLED_ROB, ONLY_OLD_ROB_ON_DISK);

  assert.deepEqual(result.players.players, [{ name: "Rob", team: "Metal", avatarSrc: "avatars/rob-ffee0011.png" }]);
  assert.deepEqual(result.addedPlayers, []);
  assert.deepEqual(result.nameNotes, [{ name: "Rob", portalName: "Robert" }]);
  assert.deepEqual(result.downloads.map((download) => download.file), ["rob-ffee0011.png"]);
  assert.equal(describePlan(result)[0], 'Note: portal name is now "Robert"; player keeps "Rob".');
});

test("does still note a renamed guest when nothing else changed", () => {
  const players = { players: [{ name: "Rob", avatarSrc: "avatars/rob-1a2b3c4d.png" }] };

  assert.deepEqual(describePlan(plan(players, [guest("g_rob", "🔥", ROB_HASH)], PULLED_ROB, () => true)), [
    'Note: portal name is now "🔥"; player keeps "Rob".',
    "Nothing to pull: the pack already has every guest and every head."
  ]);
});

test("does refuse when a new guest's name matches the player another guest already is", () => {
  const players = { players: [{ name: "Rob" }] };

  assert.throws(
    () => plan(players, [guest("g_rob", "Robert"), guest("g_new", "rob")], PULLED_ROB),
    /Guests "Robert", "rob" all match the player "Rob"; rename the ones who are not them on wingnight\.tv/
  );
});

test("does write a pick onto a matched player's team in place of the one players.json had", () => {
  const players = { players: [{ name: "Rob", team: "Metal", avatarSrc: "avatars/rob.png" }, { name: "Alex", team: "Metal" }] };
  const result = plan(players, [guest("g_rob", "Rob", null, "Disco")]);

  assert.deepEqual(result.players.players, [
    { name: "Rob", team: "Disco", avatarSrc: "avatars/rob.png" },
    { name: "Alex", team: "Metal" }
  ]);
  assert.deepEqual(result.teamChanges, [{ name: "Rob", from: "Metal", to: "Disco" }]);
  assert.equal(result.playersChanged, true);
  assert.deepEqual(listPlannedWrites(result), ["local/avatar-sources/manifest.json", "local/players.json"]);
  assert.equal(players.players[0]?.team, "Metal", "the input is not mutated");
});

test("does seat an added player on their picked team when a new guest has picked", () => {
  const result = plan({ players: [{ name: "Alex" }] }, [guest("g_kim", "Kim", KIM_HASH, "Pop")]);

  assert.deepEqual(result.players.players, [{ name: "Alex" }, { name: "Kim", team: "Pop", avatarSrc: "avatars/kim-ffee0011.png" }]);
  assert.deepEqual(result.addedPlayers, ["Kim"]);
  assert.deepEqual(result.teamChanges, [{ name: "Kim", from: null, to: "Pop" }]);
});

test("does leave a player's team exactly as it is when their guest has not picked", () => {
  const players = { players: [{ name: "Rob", team: "Metal" }, { name: "Alex" }] };
  const result = plan(players, [guest("g_rob", "Rob"), guest("g_alex", "Alex")]);

  assert.deepEqual(result.players.players, [{ name: "Rob", team: "Metal" }, { name: "Alex" }]);
  assert.deepEqual(result.teamChanges, []);
  assert.equal(result.playersChanged, false);
  assert.deepEqual(listPlannedWrites(result), ["local/avatar-sources/manifest.json"]);
});

test("does plan no team change when the pick is the team the player already has", () => {
  const result = plan({ players: [{ name: "Rob", team: "Metal" }] }, [guest("g_rob", "Rob", null, "Metal")]);

  assert.deepEqual(result.teamChanges, []);
  assert.equal(result.playersChanged, false);
});

test("does write the picked name as the export sent it without reading teams.json", () => {
  // The export already drops a pick whose team the roster no longer has (an orphan exports as
  // null), so the pull trusts the name: a second check here would need teams.json, which it
  // never reads.
  const result = plan({ players: [{ name: "Rob", team: "Metal" }] }, [guest("g_rob", "Rob", null, "Mirror Balls")]);

  assert.deepEqual(result.players.players, [{ name: "Rob", team: "Mirror Balls" }]);
  assert.deepEqual(result.teamChanges, [{ name: "Rob", from: "Metal", to: "Mirror Balls" }]);
});

test("does list team changes in the dry-run description when picks land", () => {
  const players = { players: [{ name: "Rob", team: "Metal" }, { name: "Alex" }] };
  const result = plan(players, [guest("g_rob", "Rob", null, "Disco"), guest("g_alex", "Alex", null, "Metal"), guest("g_kim", "Kim", null, "Pop")]);

  assert.deepEqual(describePlan(result), [
    "Players to add (1):",
    "  + Kim",
    "Avatar changes (0):",
    "Team changes (3):",
    "  Rob: Metal -> Disco",
    "  Alex: (unseated) -> Metal",
    "  Kim: (unseated) -> Pop",
    "Outfit changes (0):",
    "Files to write (2):",
    "  local/avatar-sources/manifest.json",
    "  local/players.json"
  ]);
});

test("does match an accented guest to a plain-spelled player when the names fold together", () => {
  const players = { players: [{ name: "Zoe", team: "Pop" }, { name: "Jos", team: "Metal" }] };
  const result = plan(players, [guest("g_zoe", "Zoë", ROB_HASH), guest("g_jose", "José", KIM_HASH)]);

  assert.deepEqual(result.addedPlayers, ["José"], "José is not Jos");
  assert.deepEqual(result.players.players, [
    { name: "Zoe", team: "Pop", avatarSrc: "avatars/zoe-1a2b3c4d.png" },
    { name: "Jos", team: "Metal" },
    { name: "José", avatarSrc: "avatars/jose-ffee0011.png" }
  ]);
});

const ROB_METAL: OutfitsByGenre = { metal: { top: { item: "battle-vest-a" }, prop: { item: "flying-v-a", style: "gold" } } };

test("does replace a player's whole outfits map with a dressed guest's", () => {
  const playersFile = { players: [{ name: "Rob", outfits: { pop: { top: { item: "crop-jacket-a" } } } }] };
  const result = plan(playersFile, [{ ...guest("g_rob", "Rob"), outfits: ROB_METAL }]);

  assert.deepEqual(result.players.players, [{ name: "Rob", outfits: ROB_METAL }]);
  assert.deepEqual(result.outfitChanges, [{ name: "Rob", from: ["pop"], to: ["metal"] }]);
  assert.equal(result.playersChanged, true);
});

test("does dress an added player in their guest's outfits", () => {
  const result = plan({ players: [] }, [{ ...guest("g_kim", "Kim"), outfits: ROB_METAL }]);

  assert.deepEqual(result.players.players, [{ name: "Kim", outfits: ROB_METAL }]);
});

test("does leave a hand-dressed player alone when their guest never opened the wardrobe", () => {
  const playersFile = { players: [{ name: "Rob", outfits: ROB_METAL }, { name: "Ada", outfits: ROB_METAL }] };
  const result = plan(playersFile, [guest("g_rob", "Rob"), { ...guest("g_ada", "Ada"), outfits: {} }]);

  assert.deepEqual(result.players.players, playersFile.players);
  assert.deepEqual(result.outfitChanges, []);
});

test("does plan no outfit change when the guest's outfits are already the player's", () => {
  const result = plan({ players: [{ name: "Rob", outfits: ROB_METAL }] }, [{ ...guest("g_rob", "Rob"), outfits: ROB_METAL }]);

  assert.deepEqual(result.outfitChanges, []);
});

test("does list outfit changes in the dry-run description", () => {
  const result = plan({ players: [{ name: "Rob" }] }, [{ ...guest("g_rob", "Rob"), outfits: ROB_METAL }]);

  assert.ok(describePlan(result).includes("  Rob: (bare) -> metal"));
});
