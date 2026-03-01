# Prompt Templates

Use these templates with `design/illustration-spec.md` as source of truth.

## Template A: First-Pass Variation Prompt

Use the locked illustration system below. Do not modify it.

[LOCKED SYSTEM BLOCK]
- Style System (LOCKED)
- Measurable Constraints
- Composition Rules
- Color System

Scene Brief:
[SCENE_BRIEF]

Asset Type:
[ASSET_TYPE]

Generate [VARIATION_COUNT] composition variations:
A) Symmetrical layout
B) Dynamic diagonal
C) Minimal
D) Energetic but clean

Output Requirements:
- Aspect ratio: [ASPECT_RATIO]
- Size: [SIZE]
- Background: [solid|transparent]
- No text
- No logos

## Template B: Diff-Only Iteration Prompt

Use Variation [BASE_VARIATION] as base.

Diff v[VERSION]:
- [CHANGE_1]
- [CHANGE_2]
- [CHANGE_3]

Do not alter locked illustration system.
Do not introduce new colors.
Do not modify layout unless specified.

## Template C: Region-Targeted Diff Prompt

Use Variation [BASE_VARIATION] as base.

Diff v[VERSION]:
- [CHANGE_1]
- [CHANGE_2]

Edit Zone:
- [exact region to modify]

Keep Unchanged:
- [element_1]
- [element_2]
- [element_3]

Do not alter locked illustration system.
Do not introduce new colors.
Apply changes only inside the Edit Zone.
Do not modify any other region.

## Template D: Save Block (Optional)

When saving generated prompts in `/design/prompts/generated/`, prepend:

- Timestamp: [YYYY-MM-DD HH:mm:ss]
- Asset Type: [hero|card|icon|other]
- Mode: [variation|diff|region-diff]
- Source Spec: `/design/illustration-spec.md`
- Output Filename: `[YYYYMMDD-HHmmss]-[assetType]-[sceneSlug].md`
