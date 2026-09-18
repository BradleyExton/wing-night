// Pure pieces of the avatar importer, kept apart from index.mjs so they can be
// tested without a network, a filesystem or an API key.

// Pack-relative, with no leading slash: `resolveContentAssetSrc` reads that as
// "this lives in the content pack" and addresses it against the SERVER origin,
// which is the only spelling that loads on the TV. A leading slash would mean
// "Vite serves this" and 404 there.
export const AVATAR_PACK_PATH = "avatars";
// The head is generated on this background and the background is then keyed
// out to alpha, so the bird can wear the head's own silhouette. Magenta,
// because nothing in a face, beard or hair comes near it — the palette's
// #1C1C1C surface cannot be keyed, it is also the colour of every outline.
export const CHROMA_KEY = { r: 255, g: 0, b: 255 };
export const CHROMA_KEY_HEX = "#FF00FF";
// Nano Banana 2. The older gemini-2.5-flash-image is retired on 2026-10-02.
export const DEFAULT_MODEL = "gemini-3.1-flash-image";
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const slugifyName = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Assembled in the order design/illustration-spec.md §8 prescribes: locked
// system block, scene brief, then output constraints. Two lines were learned
// the expensive way on the first batch (2026-09-18): naming "glasses" in the
// keep-list made the model ADD glasses to a man who wears none, twice — so the
// keep-list names only shape-level features and the accessory rule is an
// explicit "draw only what is in the photo"; and a style reference has to be
// fenced as a DIFFERENT person or its face and hair bleed into the subject. The one deliberate
// departure from the locked palette is called out inline: a face needs flat
// skin and hair tints, which the palette does not carry.
export const assemblePrompt = ({ hasStyleReference }) => {
  const sections = [
    "Use the locked illustration system below. Do not modify it.",
    [
      "LOCKED SYSTEM:",
      "- Flat vector only. Clean geometric shapes. Crisp edges.",
      "- No photorealism. No textures, grain or noise. No gradients that reduce readability.",
      "- No tiny decorative details. The silhouette must read at thumbnail scale.",
      "- One stroke family, 2px baseline. Corner radii only from 0, 8, 16, 24.",
      "- At most 15 distinct shapes. At most two accent colours, under 10% of the area.",
      "- Palette: bg #121212, surface #1C1C1C, surfaceAlt #242424, text #FFFFFF, muted #A3A3A3, primary #F97316, gold #FBBF24.",
      "- Skin, hair and clothing may use flat, muted tints. No new saturated accents. No red."
    ].join("\n"),
    [
      "SCENE BRIEF:",
      "A flat vector caricature portrait of the person in the attached photo.",
      "Head ONLY, facing slightly to the right, centred, filling about 80% of the frame.",
      "The drawing ENDS at the jawline (or the bottom of the beard): nothing below the chin. No neck, no shoulders, no clothing, no collar.",
      "Keep what makes them recognisable: hair length, shape and colour, facial hair, face shape, skin tone, expression. Simplify everything else.",
      "Draw ONLY what is in the photo. Do not add glasses, hats, jewellery or any accessory the person is not wearing in it.",
      "Friendly party game show mood. Two simple white eyes with dark pupils."
    ].join("\n")
  ];

  if (hasStyleReference) {
    sections.push(
      [
        "STYLE REFERENCE:",
        "The FIRST attached image is the person to draw. The SECOND is a finished portrait of a DIFFERENT person from the same set, included only as a style reference.",
        "Match the second image's line weight, level of simplification and colour handling exactly, so the two read as drawn by the same hand.",
        "Take nothing else from it: no facial features, hair, clothing or accessories."
      ].join("\n")
    );
  }

  sections.push(
    [
      "OUTPUT CONSTRAINTS:",
      "- Aspect ratio 1:1, 1024x1024.",
      `- Background: solid ${CHROMA_KEY_HEX} magenta, nothing else behind the head. It is keyed out afterwards, so use no magenta anywhere on the head.`,
      "- No text. No logos. No frame or border."
    ].join("\n")
  );

  return sections.join("\n\n");
};

const mimeTypeForFile = (fileName) => {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic") return "image/heic";
  return null;
};

export const isSupportedSource = (fileName) => mimeTypeForFile(fileName) !== null;

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
// booth sprite) are never picked, because they are not in the manifest.
export const pickStyleReference = ({ plan, generated }) => {
  for (const row of plan) {
    if (generated[row.slug] !== undefined) {
      return generated[row.slug].file;
    }
  }
  return null;
};

export const buildGeminiRequest = ({ prompt, photo, styleReference = null }) => {
  const parts = [
    { text: prompt },
    { inlineData: { mimeType: mimeTypeForFile(photo.fileName), data: photo.base64 } }
  ];

  if (styleReference !== null) {
    parts.push({
      inlineData: { mimeType: mimeTypeForFile(styleReference.fileName), data: styleReference.base64 }
    });
  }

  return {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } }
  };
};

export const buildGeminiUrl = (model) => `${GEMINI_API_BASE}/${model}:generateContent`;

// Returns { mimeType, base64 } for the first image part, or throws with the
// model's own text so a refusal reads as a reason rather than a crash.
export const extractGeneratedImage = (response) => {
  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (imagePart === undefined) {
    const text = parts.map((part) => part.text).filter(Boolean).join(" ").trim();
    const finishReason = response?.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`No image in response (finishReason: ${finishReason})${text ? `: ${text}` : ""}`);
  }

  return { mimeType: imagePart.inlineData.mimeType, base64: imagePart.inlineData.data };
};

// Immutable: returns a new players file with avatarSrc set for the given slugs.
export const applyAvatarSrc = (playersFile, generatedSlugs) => {
  const generatedSet = new Set(generatedSlugs);

  return {
    ...playersFile,
    players: playersFile.players.map((player) => {
      const slug = slugifyName(player.name);
      return generatedSet.has(slug)
        ? { ...player, avatarSrc: `${AVATAR_PACK_PATH}/${slug}.png` }
        : player;
    })
  };
};

// Chebyshev distance from the key colour, on one RGBA pixel.
const keyDistance = (pixels, offset, key) =>
  Math.max(
    Math.abs(pixels[offset] - key.r),
    Math.abs(pixels[offset + 1] - key.g),
    Math.abs(pixels[offset + 2] - key.b)
  );

// Knocks the generated background out to alpha 0. Two rules, because the
// JPEG the model returns smears the key colour into the edge pixels: a pixel
// within `strict` of the key is background wherever it is (the prompt forbids
// magenta on the head, and a gap between two hair strands is background the
// border cannot reach); a pixel within the looser `tolerance` is background
// only when a flood fill from the image border reaches it, so a near-key
// tint ENCLOSED by the head survives. Then the remaining edge is eroded by
// `erode` pixels to drop the fringe. Mutates `pixels` (RGBA, row-major) and
// returns the number of pixels cleared.
export const knockOutBackground = ({
  pixels,
  width,
  height,
  key = CHROMA_KEY,
  tolerance = 80,
  strict = 28,
  erode = 2
}) => {
  const cleared = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x += 1) stack.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y += 1) stack.push(y * width, y * width + width - 1);
  for (let index = 0; index < width * height; index += 1) {
    if (keyDistance(pixels, index * 4, key) <= strict) stack.push(index);
  }

  let count = 0;
  while (stack.length > 0) {
    const index = stack.pop();
    if (cleared[index] === 1 || keyDistance(pixels, index * 4, key) > tolerance) continue;
    cleared[index] = 1;
    count += 1;
    const x = index % width;
    const y = (index - x) / width;
    if (x > 0) stack.push(index - 1);
    if (x < width - 1) stack.push(index + 1);
    if (y > 0) stack.push(index - width);
    if (y < height - 1) stack.push(index + width);
  }

  for (let pass = 0; pass < erode; pass += 1) {
    const edge = [];
    for (let index = 0; index < width * height; index += 1) {
      if (cleared[index] === 1) continue;
      const x = index % width;
      const y = (index - x) / width;
      if (
        (x > 0 && cleared[index - 1] === 1) ||
        (x < width - 1 && cleared[index + 1] === 1) ||
        (y > 0 && cleared[index - width] === 1) ||
        (y < height - 1 && cleared[index + width] === 1)
      ) {
        edge.push(index);
      }
    }
    for (const index of edge) {
      cleared[index] = 1;
      count += 1;
    }
  }

  for (let index = 0; index < width * height; index += 1) {
    if (cleared[index] === 1) pixels[index * 4 + 3] = 0;
  }
  return count;
};

// Bounding box of the pixels that are still opaque, or null when none are.
export const opaqueBounds = ({ pixels, width, height }) => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > 127) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

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
