# ADR-0004: One Shared Photo Library, Resolved in the Content Loader

Status: Proposed
Date: 2026-09-18

## Context

Photos are becoming the substance of this game, not a decoration on one minigame. GEO already runs
on them; an image-Codenames game (`docs/minigames/ideas/photo-codenames.md`) wants the same friend
photos in a grid; PETMON and the avatar cast pull from the same shoebox of party pictures.

Today a photo is not a thing the codebase knows about. It is a file path typed into one game's
prompt bank, and everything true about the photo is retyped next to that path:

- `imageSrc` names the file, per prompt, per game.
- `answer: { lat, lng }` restates where it was taken, though the camera already knew.
- `featuredPlayers` restates who is in it. That concept is already shared
  (`packages/shared/src/content/featuredPlayers`) and already applied at load
  (`filterPromptsByRoster` drops prompts featuring nobody on tonight's roster), but the TAG lives on
  the prompt.

With one game that is merely redundant. With two it is a correctness problem: the same cottage photo
gets tagged once for GEO and again for Codenames, and the two copies drift the first time a name is
fixed in one of them. Nine party photos are sitting in the night pack right now with no prompts and
no tags at all, so the migration cost is at its minimum.

The sourcing question is settled and it pushes the same way. Google Takeout, exported per album,
ships a JSON sidecar per photo carrying `photoTakenTime`, `geoData` and a `people` array populated
from named face groups. Verified against the real account on 2026-09-18: twenty named clusters
already exist, the event albums already exist, and "estimate missing locations" is on, so even
photos whose EXIF was stripped usually arrive with coordinates. Location and people therefore arrive
**per photo, together, once** — which is the shape of a library, not the shape of a prompt bank.

## Decision

1. **One photo library per content pack**, authored as one manifest plus one served image tree:

   ```text
   <pack>/local/photos.json                       the manifest — content, never served
   <pack>/local/assets/photos/<event>/<file>.jpg  the served copies
   ```

   Images go under `assets/` so the existing `CONTENT_ASSET_ROUTE_PATH` mount serves them with no
   new route, and their manifest paths are the pack-relative spelling `resolveContentAssetSrc`
   already resolves (`photos/mexico-2024/0007.jpg`). The manifest is one file rather than a sidecar
   per photo because the loaders read content files once at boot, and because a library nobody can
   open and read in one view is a library nobody will curate.

2. **A photo entry carries everything true about the photo**, and nothing about any game:

   ```json
   {
     "id": "mexico-2024-0007",
     "file": "photos/mexico-2024/0007.jpg",
     "event": { "id": "mexico-2024", "label": "Mexico 2024", "date": "2024-02" },
     "takenAt": "2024-02-11T18:22:04Z",
     "location": { "lat": 20.6534, "lng": -105.2253, "source": "sidecar" },
     "people": ["Rob", "Rosie"],
     "review": ["people-unverified"]
   }
   ```

   `location.source` is `sidecar`, `exif`, `estimated` or `authored`, because a Google-estimated
   location is a fine Codenames grid card and a questionable GEO answer key, and the difference has
   to survive to the point where a game decides. `review` carries importer flags for the curation
   pass and is ignored at runtime.

3. **Game content references a photo by id, not by path.** A GEO prompt becomes
   `{ id, photoId, title, hint?, answer? }`, where an omitted `answer` means "use the library's
   location". Codenames content is a list of photo ids, or a query over events.

4. **The library is resolved in the content loader, and nowhere else.** `loadContent` already joins
   the roster to the prompt banks — it is the one place holding both — and `filterPromptsByRoster`
   already runs there. Photo resolution joins it: a prompt naming a `photoId` comes out of the
   loader with `imageSrc` and `featuredPlayers` already filled in from the manifest, before the
   roster filter sees it. Runtimes, projections, host and display surfaces learn nothing new.

5. **`imageSrc` on a prompt keeps working.** A pack with no library, including the committed sample
   pack, is unaffected. `photoId` is additive, and a prompt carrying both is a content error.

6. **`pnpm import:photos <unzipped-takeout-dir>`** builds the manifest: album folder to event,
   sidecar to time, location and people, file EXIF as the second source, HEIC converted with `sips`,
   copies resized and metadata-stripped into the pack. Re-running merges by id and never overwrites
   a hand-authored field, because curation happens in the manifest after the first import. It prints
   a review list rather than guessing: photos with no location, no people, or fewer faces detected
   than the file suggests.

## Non-Goals

1. No database, no photo service, no upload UI. The library is authored files in the pack, like
   every other content file, and the pack is already the one directory every worktree shares.
2. No face detection or clustering of our own. Google already did it; we read the result.
3. No per-team photo targeting. That is the separate backlog item, and it needs runtime roster data
   the loader does not have.
4. No re-homing of avatars or audio. Heads stay on `import:avatars`, music stays on its drop-folder
   convention.

## Consequences

- **Tagging becomes a one-time job in Google Photos, not a per-game job in JSON.** Fourteen labelled
  clusters plus a review pass replaces hundreds of hand-typed tags.
- **GEO gets its answer key for free** on any photo whose location survived, which is what the
  importer was originally supposed to do and could not, because the download path strips GPS.
- **A new photo game costs a content file, not a photo pipeline.**
- **The roster filter needs a decision about non-players before Codenames ships.** The manifest's
  `people` is the truth about the photo, and most party photos include friends who are not playing
  tonight. `isFeaturedOnRoster` drops a prompt whose tags name nobody present, and unknown tags are
  reported at boot — so copying `people` straight into `featuredPlayers` would both drop good grid
  cards and fill the log with warnings about people who simply are not playing. The likely answer is
  that the loader copies only roster-matching names into `featuredPlayers` and keeps the full list
  on the resolved photo, but it is a real decision and it belongs to whoever builds this.
- **Privacy stays local.** Names and faces live in the pack outside the repo, gitignored by
  construction, and the served copies are metadata-stripped.

## Verification

Unit: manifest validation in `packages/shared`, photo resolution and the `photoId`/`imageSrc`
exclusivity rule in the content loader, importer sidecar parsing against fixture files. E2E is
unaffected — the seeded e2e root carries no library and exercises the `imageSrc` path.
