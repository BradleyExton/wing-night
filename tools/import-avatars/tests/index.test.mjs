import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAvatarSrc,
  assemblePrompt,
  buildContactSheet,
  buildGeminiRequest,
  extractGeneratedImage,
  pickStyleReference,
  planImports,
  slugifyName
} from "../lib.mjs";

const players = [{ name: "Alex" }, { name: "Steve B" }, { name: "Jazz", avatarSrc: "/x.png" }];

test("does slug a name with spaces and case into a filename when planning", () => {
  assert.equal(slugifyName("  Steve B "), "steve-b");
  assert.equal(slugifyName("Joleeza!"), "joleeza");
});

test("does skip a player when no source photo exists", () => {
  const plan = planImports({ players, sourceFiles: ["steve-b.jpg"], generated: {} });

  assert.equal(plan[0].skipReason, "no source photo");
  assert.equal(plan[1].skipReason, null);
  assert.equal(plan[1].sourceFile, "steve-b.jpg");
  assert.equal(plan[1].outputFile, "steve-b.png");
});

test("does ignore a source file that is not an image", () => {
  const plan = planImports({ players, sourceFiles: ["alex.txt", "contact-sheet.html"], generated: {} });

  assert.equal(plan[0].skipReason, "no source photo");
});

test("does skip a player already in the manifest unless forced", () => {
  const generated = { alex: { file: "alex.png" } };

  assert.match(planImports({ players, sourceFiles: ["alex.jpg"], generated })[0].skipReason, /already generated/);
  assert.equal(planImports({ players, sourceFiles: ["alex.jpg"], generated, force: true })[0].skipReason, null);
});

test("does limit generation to the --only slugs when given", () => {
  const plan = planImports({ players, sourceFiles: ["alex.jpg", "steve-b.jpg"], generated: {}, only: ["steve-b"] });

  assert.equal(plan[0].skipReason, "not in --only");
  assert.equal(plan[1].skipReason, null);
});

test("does add the style reference clause only when a reference is given", () => {
  assert.doesNotMatch(assemblePrompt({ hasStyleReference: false }), /STYLE REFERENCE/);
  assert.match(assemblePrompt({ hasStyleReference: true }), /STYLE REFERENCE/);
  assert.match(assemblePrompt({ hasStyleReference: false }), /^Use the locked illustration system below/);
  assert.match(assemblePrompt({ hasStyleReference: false }), /Do not add glasses/);
  assert.match(assemblePrompt({ hasStyleReference: true }), /DIFFERENT person/);
});

test("does pick the first generated head in roster order as the style reference", () => {
  const plan = planImports({ players, sourceFiles: ["alex.jpg", "steve-b.jpg"], generated: {} });

  assert.equal(pickStyleReference({ plan, generated: {} }), null);
  assert.equal(pickStyleReference({ plan, generated: { "steve-b": { file: "steve-b.png" } } }), "steve-b.png");
});

test("does attach the photo and the style reference as inline image parts", () => {
  const request = buildGeminiRequest({
    prompt: "p",
    photo: { fileName: "alex.jpg", base64: "AAA" },
    styleReference: { fileName: "steve-b.png", base64: "BBB" }
  });
  const parts = request.contents[0].parts;

  assert.equal(parts.length, 3);
  assert.deepEqual(parts[1], { inlineData: { mimeType: "image/jpeg", data: "AAA" } });
  assert.deepEqual(parts[2], { inlineData: { mimeType: "image/png", data: "BBB" } });
  assert.deepEqual(request.generationConfig.responseModalities, ["IMAGE"]);
});

test("does extract the png from a Gemini response", () => {
  const image = extractGeneratedImage({
    candidates: [{ content: { parts: [{ text: "here" }, { inlineData: { mimeType: "image/png", data: "CCC" } }] } }]
  });

  assert.deepEqual(image, { mimeType: "image/png", base64: "CCC" });
});

test("does surface the model's text when a response has no image", () => {
  assert.throws(
    () => extractGeneratedImage({ candidates: [{ finishReason: "SAFETY", content: { parts: [{ text: "nope" }] } }] }),
    /SAFETY.*nope/
  );
});

test("does write avatarSrc as a client-root path when applying results", () => {
  const updated = applyAvatarSrc({ players }, ["steve-b"]);

  assert.equal(updated.players[1].avatarSrc, "/local-assets/avatars/steve-b.png");
  assert.equal(updated.players[0].avatarSrc, undefined);
  assert.equal(updated.players[2].avatarSrc, "/x.png");
  assert.equal(players[1].avatarSrc, undefined);
});

test("does render one contact sheet row per player with the skip reason where nothing was generated", () => {
  const plan = planImports({ players, sourceFiles: ["steve-b.jpg"], generated: { "steve-b": { file: "steve-b.png" } } });
  const html = buildContactSheet({ plan, generated: { "steve-b": { file: "steve-b.png" } }, sourcesDirRelative: ".", avatarsDirRelative: "../avatars" });

  assert.equal((html.match(/<tr><th>[^<]*<small>/g) ?? []).length, 3);
  assert.match(html, /no source photo/);
  assert.match(html, /\.\.\/avatars\/steve-b\.png/);
});
