// Pure pieces of the avatar importer, kept apart from index.mjs so they can be
// tested without a network, a filesystem or an API key. The head pipeline itself
// — prompt, request, reply, keying — lives in packages/avatar-head, shared with
// the server, the teaser Worker and the guest's browser; it is imported here by
// relative path (plain `node` strips its types) and re-exported under the names
// this tool has always used.
import {
  CHROMA_KEY,
  CHROMA_KEY_HEX,
  DEFAULT_GEMINI_IMAGE_MODEL,
  GEMINI_API_BASE,
  HEAD_ASPECT_RATIO,
  assemblePrompt,
  buildGeminiImageRequest,
  buildGeminiImageUrl,
  extractGeneratedImage,
  knockOutBackground,
  mimeTypeForImageFile,
  opaqueBounds,
  slugifyName
} from "../../packages/avatar-head/src/index.ts";

export {
  CHROMA_KEY,
  CHROMA_KEY_HEX,
  GEMINI_API_BASE,
  assemblePrompt,
  extractGeneratedImage,
  knockOutBackground,
  opaqueBounds,
  slugifyName
};
export const DEFAULT_MODEL = DEFAULT_GEMINI_IMAGE_MODEL;
export const buildGeminiUrl = buildGeminiImageUrl;

// Pack-relative, with no leading slash: `resolveContentAssetSrc` reads that as
// "this lives in the content pack" and addresses it against the SERVER origin,
// which is the only spelling that loads on the TV. A leading slash would mean
// "Vite serves this" and 404 there.
export const AVATAR_PACK_PATH = "avatars";

// The longest edge a head is written at. The model returns 1024x1024 however
// it is asked, and a crop of that lands ~700 kB — for pixels nothing samples.
// Measured on the TV at 1920x1080: the SETUP lineup paints a head at 86 CSS
// px and the parade's jig swells one to 112, so 224 device pixels at dpr 2 is
// today's worst case. The headroom on top of that is for the cast: a head is
// worn as an SVG <image> inside the bird, so it scales with the figure, and a
// hero bird, the host tablet's roster or a layout nobody has drawn yet can all
// ask for more than the lineup does. 512 is a bit over 2x the largest paint
// measured, covers any head drawn up to 256 CSS px at dpr 2, and costs ~250 kB
// rather than ~700. Going to 256 would save another 150 kB a head but leaves
// no room for a surface that ever wants a face bigger than a thumbnail.
export const AVATAR_MAX_EDGE = 512;

// Scales a box down so its longest edge is at most `maxEdge`. Never up: a
// head that already fits is written at its own size rather than blown up
// into a bigger, blurrier file. The aspect ratio is kept and the result is
// whole pixels, because a canvas cannot be a fraction wide.
export const fitWithin = ({ width, height, maxEdge = AVATAR_MAX_EDGE }) => {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
};

export const isSupportedSource = (fileName) => mimeTypeForImageFile(fileName) !== null;

// A manifest entry `pnpm pack:pull` wrote: `{ file, source: "online", at, sha256 }`, its file
// named `<slug>-<hash>.png` rather than `<slug>.png`.
export const isOnlineHead = (entry) => entry !== undefined && entry.source === "online";

// One plan row per roster entry. `sourceFiles` are bare filenames from the
// sources folder; `generated` is the manifest's slug -> file map.
export const planImports = ({ players, sourceFiles, generated, force = false, only = null }) => {
  const sourceBySlug = new Map(
    sourceFiles
      .filter(isSupportedSource)
      .map((fileName) => [slugifyName(fileName.replace(/\.[^.]+$/, "")), fileName])
  );

  return players.map((player) => {
    const slug = slugifyName(player.name);
    const sourceFile = sourceBySlug.get(slug) ?? null;
    const row = { name: player.name, slug, sourceFile, outputFile: `${slug}.png`, skipReason: null };

    if (only !== null && !only.includes(slug)) {
      row.skipReason = "not in --only";
    } else if (isOnlineHead(generated[slug])) {
      // The guest made this head on wingnight.tv and `pnpm pack:pull` owns it: painting over it
      // here, --force or not, would throw away the head they chose.
      row.skipReason = "head pulled from wingnight.tv (pnpm pack:pull owns it, even under --force)";
    } else if (sourceFile === null) {
      row.skipReason = "no source photo";
    } else if (!force && generated[slug] !== undefined) {
      row.skipReason = "already generated (use --force or delete it from the manifest)";
    }

    return row;
  });
};

// The style reference is the first head this tool generated, in roster order,
// so every later head is asked to match it. Hand-placed avatars (a photo, a
// booth sprite) are never picked, because they are not in the manifest, and
// neither is a head pulled from wingnight.tv: this tool did not paint it.
export const pickStyleReference = ({ plan, generated }) => {
  for (const row of plan) {
    if (generated[row.slug] !== undefined && !isOnlineHead(generated[row.slug])) {
      return generated[row.slug].file;
    }
  }
  return null;
};

// Photos arrive as file names; the request wants mime types.
export const buildGeminiRequest = ({ prompt, photo, styleReference = null }) =>
  buildGeminiImageRequest({
    prompt,
    images: [photo, ...(styleReference === null ? [] : [styleReference])].map((image) => ({
      mimeType: mimeTypeForImageFile(image.fileName),
      base64: image.base64
    })),
    aspectRatio: HEAD_ASPECT_RATIO
  });

// Immutable: returns a new players file with avatarSrc pointed at each manifest entry's file —
// the entry's own name, never `<slug>.png` assumed, because a pulled head's file is versioned.
export const applyAvatarSrc = (playersFile, generated) => ({
  ...playersFile,
  players: playersFile.players.map((player) => {
    const entry = generated[slugifyName(player.name)];
    return entry === undefined ? player : { ...player, avatarSrc: `${AVATAR_PACK_PATH}/${entry.file}` };
  })
});

const escapeHtml = (text) =>
  text.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

// Source beside result, one row per roster entry, for approving in a browser.
export const buildContactSheet = ({ plan, generated, sourcesDirRelative, avatarsDirRelative }) => {
  const rows = plan
    .map((row) => {
      const source =
        row.sourceFile === null
          ? '<div class="empty">no photo</div>'
          : `<img src="${sourcesDirRelative}/${escapeHtml(row.sourceFile)}" alt="">`;
      const result =
        generated[row.slug] === undefined
          ? `<div class="empty">${escapeHtml(row.skipReason ?? "not generated")}</div>`
          : `<img src="${avatarsDirRelative}/${escapeHtml(generated[row.slug].file)}" alt="">`;
      return `<tr><th>${escapeHtml(row.name)}<small>${escapeHtml(row.slug)}</small></th><td>${source}</td><td>${result}</td></tr>`;
    })
    .join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Avatar contact sheet</title>
<style>
body{margin:0;padding:2rem;background:#121212;color:#fff;font-family:ui-sans-serif,system-ui,sans-serif}
table{border-collapse:collapse}th,td{padding:.75rem 1rem;border-bottom:1px solid #2a2a2a;text-align:left;vertical-align:middle}
th{font-size:1.1rem}th small{display:block;color:#a3a3a3;font-weight:400;font-family:ui-monospace,monospace}
img{width:180px;height:180px;object-fit:contain;background:#1c1c1c;border-radius:16px}
.empty{width:180px;height:180px;border-radius:50%;border:2px dashed #3a3a3a;display:flex;align-items:center;justify-content:center;color:#a3a3a3;font-size:.8rem;text-align:center;padding:1rem;box-sizing:border-box}
p{color:#a3a3a3;max-width:60ch}
</style></head><body>
<h1>Avatar contact sheet</h1>
<p>Left: source photo. Right: generated head with its background knocked out, as the bird wears it. To redo one, run <code>pnpm import:avatars --force --only &lt;slug&gt;</code>.</p>
<table><thead><tr><th>Player</th><th>Photo</th><th>Head</th></tr></thead><tbody>
${rows}
</tbody></table></body></html>
`;
};
