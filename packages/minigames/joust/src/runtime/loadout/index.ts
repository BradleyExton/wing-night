import type {
  JoustShooterColor,
  JoustShooterProfile,
  JoustShooterView
} from "@wingnight/shared";
import {
  JOUST_STANDARD_SHOOTER_PROFILE,
  isJoustShooter,
  resolveJoustShooterProfile
} from "@wingnight/shared";

/**
 * One kind of projectile as the runtime holds it: the content's kind with every gap filled.
 * `usesPerTurn` is `null` rather than absent and `profile` is the FULL profile rather than a
 * diff, so the shape is plain JSON the room snapshot can carry and the client never has to
 * resolve a profile of its own — what the tablet draws is exactly what the integrator flew.
 */
export type JoustRuntimeShooter = {
  id: string;
  name: string;
  blurb: string;
  color: JoustShooterColor;
  usesPerTurn: number | null;
  profile: JoustShooterProfile;
};

export const JOUST_STANDARD_SHOOTER_ID = "standard";

/**
 * The kind every pack gets whether it authors one or not: today's shot, in the primary orange
 * it has always worn. A content file with no `shooters` loads this alone, and a picker with one
 * thing in it is not shown.
 */
export const JOUST_STANDARD_SHOOTER: JoustRuntimeShooter = {
  id: JOUST_STANDARD_SHOOTER_ID,
  name: "The Standard",
  blurb: "The house shot. Ploughs a row, folds a tower if you hit the legs hard, lobs to a shelf.",
  color: { fill: "#f97316", dark: "#b8410a", light: "#fdba74" },
  usesPerTurn: null,
  profile: JOUST_STANDARD_SHOOTER_PROFILE
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Reads one kind out of whatever the content carries: the file's own shape (`usesPerTurn`
 * absent, `profile` a diff) or the runtime's (`usesPerTurn: null`, `profile` full), because the
 * dev sandbox hands the runtime the raw file and the server hands it the parsed one. Anything
 * malformed reads as nothing, the way a malformed lane does.
 */
export const readJoustShooter = (value: unknown): JoustRuntimeShooter | null => {
  if (!isObjectLike(value)) {
    return null;
  }

  const candidate =
    value.usesPerTurn === null ? { ...value, usesPerTurn: undefined } : value;

  if (!isJoustShooter(candidate)) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    blurb: candidate.blurb,
    color: { fill: candidate.color.fill, dark: candidate.color.dark, light: candidate.color.light },
    usesPerTurn: candidate.usesPerTurn ?? null,
    profile: { ...resolveJoustShooterProfile(candidate.profile) }
  };
};

/**
 * The turn's loadout from a content file's `shooters`: every well-formed kind, first use of an
 * id winning, or the Standard kind alone when the file authors none. Never empty — a band with
 * nothing to load is not a turn.
 */
export const resolveJoustLoadout = (shooters: unknown): JoustRuntimeShooter[] => {
  if (!Array.isArray(shooters)) {
    return [JOUST_STANDARD_SHOOTER];
  }

  const seen = new Set<string>();
  const loadout: JoustRuntimeShooter[] = [];

  for (const entry of shooters) {
    const kind = readJoustShooter(entry);

    if (kind === null || seen.has(kind.id)) {
      continue;
    }

    seen.add(kind.id);
    loadout.push(kind);
  }

  return loadout.length === 0 ? [JOUST_STANDARD_SHOOTER] : loadout;
};

/** How many pulls of this kind the team has left this turn; null when there is no limit. */
export const resolveShooterUsesLeft = (
  kind: JoustRuntimeShooter,
  usedShooterIds: readonly string[]
): number | null => {
  if (kind.usesPerTurn === null) {
    return null;
  }

  const used = usedShooterIds.filter((id) => id === kind.id).length;

  return Math.max(0, kind.usesPerTurn - used);
};

export const hasShooterUsesLeft = (
  kind: JoustRuntimeShooter,
  usedShooterIds: readonly string[]
): boolean => {
  const left = resolveShooterUsesLeft(kind, usedShooterIds);

  return left === null || left > 0;
};

/**
 * What the band reloads with between shots: the first unlimited kind, so a team is never left
 * with a spent kind selected — or, in a loadout where everything is rationed, the first kind
 * with a pull left, or failing that the first listed.
 */
export const resolveDefaultShooterId = (
  loadout: readonly JoustRuntimeShooter[],
  usedShooterIds: readonly string[] = []
): string => {
  const unlimited = loadout.find((kind) => kind.usesPerTurn === null);

  if (unlimited !== undefined) {
    return unlimited.id;
  }

  const spare = loadout.find((kind) => hasShooterUsesLeft(kind, usedShooterIds));

  return (spare ?? loadout[0] ?? JOUST_STANDARD_SHOOTER).id;
};

export const findJoustShooter = (
  loadout: readonly JoustRuntimeShooter[],
  shooterId: string
): JoustRuntimeShooter | null => {
  return loadout.find((kind) => kind.id === shooterId) ?? null;
};

export const toShooterView = (
  kind: JoustRuntimeShooter,
  usedShooterIds: readonly string[]
): JoustShooterView => {
  return {
    id: kind.id,
    name: kind.name,
    blurb: kind.blurb,
    color: { ...kind.color },
    usesLeft: resolveShooterUsesLeft(kind, usedShooterIds),
    profile: { ...kind.profile }
  };
};
