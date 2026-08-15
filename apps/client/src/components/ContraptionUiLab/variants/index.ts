// The three directions WN-25 exists to choose between. They are deliberately structural, not
// stylistic: AC#3 requires they differ in where the thrower sits, how much of the scene the throw
// occupies, and whether the target is foregrounded or embedded. Those three axes are recorded on
// each variant so the human at the pick can read what they are comparing rather than infer it.
export type VariantId = "sidestage" | "arena" | "character-first";

export const DEFAULT_VARIANT_ID: VariantId = "sidestage";

export type VariantMeta = {
  id: VariantId;
  label: string;
  /** Where the thrower sits relative to the contraption field. */
  throwerPlacement: string;
  /** How much of the scene the throw itself occupies. */
  throwScale: string;
  /** Whether the trash can is foregrounded or embedded in the scene. */
  targetTreatment: string;
};

export const VARIANTS: readonly VariantMeta[] = [
  {
    id: "sidestage",
    label: "A · Sidestage",
    throwerPlacement: "Left edge, in profile, outside the field",
    throwScale: "Full-width traverse — the throw is the whole scene",
    targetTreatment: "Foregrounded: the can sits in front of the ramps, oversized"
  },
  {
    id: "arena",
    label: "B · Arena",
    throwerPlacement: "Bottom-centre, small, camera pulled back",
    throwScale: "Short arc into a large field — the field dominates",
    targetTreatment: "Embedded: the can is one object among the ramps"
  },
  {
    id: "character-first",
    label: "C · Character-first",
    throwerPlacement: "Foreground panel, large — the eat is the hero",
    throwScale: "Small — the throw reads as an exit from the character's panel",
    targetTreatment: "Embedded at the far end of a narrow backdrop strip"
  }
];

const VARIANT_IDS: readonly string[] = VARIANTS.map((variant) => variant.id);

const isVariantId = (value: string): value is VariantId => {
  return VARIANT_IDS.includes(value);
};

/**
 * Resolves the `?variant=` query value to a variant, falling back to the default rather than
 * throwing — an unknown or absent param should still render something drivable.
 */
export const resolveVariantId = (raw: string | null): VariantId => {
  if (raw === null) {
    return DEFAULT_VARIANT_ID;
  }

  const normalized = raw.trim().toLowerCase();

  if (!isVariantId(normalized)) {
    return DEFAULT_VARIANT_ID;
  }

  return normalized;
};

export const resolveVariantMeta = (id: VariantId): VariantMeta => {
  const found = VARIANTS.find((variant) => variant.id === id);

  // VariantId is closed over VARIANTS, so this is unreachable — but returning the default keeps the
  // lab drivable rather than crashing the page a human is trying to judge.
  return found ?? VARIANTS[0];
};
