import { CHROMA_KEY_HEX } from "../chromaKey/index.ts";

export type HeadPromptInput = {
  // True when a finished head rides along as the second image, so the new one matches its hand.
  hasStyleReference: boolean;
};

// Assembled in the order design/illustration-spec.md §8 prescribes: locked system block, scene
// brief, then output constraints. Two lines were learned the expensive way on the first batch
// (2026-09-18): naming "glasses" in the keep-list made the model ADD glasses to a man who wears
// none, twice — so the keep-list names only shape-level features and the accessory rule is an
// explicit "draw only what is in the photo"; and a style reference has to be fenced as a
// DIFFERENT person or its face and hair bleed into the subject. The one deliberate departure from
// the locked palette is called out inline: a face needs flat skin and hair tints, which the
// palette does not carry.
export const assemblePrompt = ({ hasStyleReference }: HeadPromptInput): string => {
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
