// Pure pieces of the avatar importer, kept apart from index.mjs so they can be
// tested without a network, a filesystem or an API key.

export const AVATAR_PUBLIC_PATH = "/local-assets/avatars";
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
      "Head and shoulders, facing slightly to the right, centred, head filling about 80% of the frame.",
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
      "- Background: solid #1C1C1C, nothing else behind the figure.",
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
        ? { ...player, avatarSrc: `${AVATAR_PUBLIC_PATH}/${slug}.png` }
        : player;
    })
  };
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
img{width:180px;height:180px;object-fit:cover;border-radius:50%;background:#1c1c1c}
.empty{width:180px;height:180px;border-radius:50%;border:2px dashed #3a3a3a;display:flex;align-items:center;justify-content:center;color:#a3a3a3;font-size:.8rem;text-align:center;padding:1rem;box-sizing:border-box}
p{color:#a3a3a3;max-width:60ch}
</style></head><body>
<h1>Avatar contact sheet</h1>
<p>Left: source photo. Right: generated head, shown in the circle the bird clips it to. To redo one, run <code>pnpm import:avatars --force --only &lt;slug&gt;</code>.</p>
<table><thead><tr><th>Player</th><th>Photo</th><th>Head</th></tr></thead><tbody>
${rows}
</tbody></table></body></html>
`;
};
