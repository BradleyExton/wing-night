import { validatePromptPackFile } from "../promptPack/index.js";
import {
  prefixIssuePaths,
  type ValidationIssue
} from "../validationIssue/index.js";

// CONTRAPTION levels are authored on the same 100×100 field the integrator's
// fixtures use, and the team builds on a coarse grid laid over it: 10 cells a
// side, one piece per cell. Coarse on purpose — placing pieces with sauce on
// your fingers is the comedy; pixel-perfect placement would be the misery.
export const CONTRAPTION_FIELD_UNITS = 100;

export const CONTRAPTION_GRID_COLUMNS = 10;

export const CONTRAPTION_GRID_ROWS = 10;

export const CONTRAPTION_CELL_UNITS =
  CONTRAPTION_FIELD_UNITS / CONTRAPTION_GRID_COLUMNS;

// Every piece is a single straight segment inside its cell. Two gradients in
// each direction plus a flat shelf is enough to route a wing anywhere a level
// asks for and few enough that the palette fits a tablet deck without a scroll.
export const CONTRAPTION_PIECE_KINDS = [
  "shelf",
  "slope-right",
  "slope-left",
  "steep-right",
  "steep-left"
] as const;

export type ContraptionPieceKind = (typeof CONTRAPTION_PIECE_KINDS)[number];

export type ContraptionPlacedPiece = {
  kind: ContraptionPieceKind;
  // Grid cell, zero-based from the top-left of the field.
  column: number;
  row: number;
};

export type ContraptionPoint = {
  x: number;
  y: number;
};

// Where the wing starts and how it is thrown, in field units and units/second.
export type ContraptionWingStart = ContraptionPoint & {
  velocity: ContraptionPoint;
};

// The target. Stands on the floor; `x` is its left edge.
export type ContraptionBucket = {
  x: number;
  width: number;
  height: number;
};

// Fixed scenery the level ships with — a ledge the wing has to clear, a wall it
// has to get around. Same shape as an integrator segment.
export type ContraptionObstacle = {
  id: string;
  from: ContraptionPoint;
  to: ContraptionPoint;
};

// A bonus the wing collects by passing through it en route, so a near-miss
// still scores something and the run stays worth watching to the end.
export type ContraptionPickup = ContraptionPoint & {
  id: string;
  points: number;
};

export type ContraptionLevel = {
  id: string;
  title: string;
  wing: ContraptionWingStart;
  bucket: ContraptionBucket;
  obstacles?: ContraptionObstacle[];
  pickups?: ContraptionPickup[];
  // How many pieces the team may place.
  pieceBudget: number;
  // Awarded for landing in the bucket; pickups add on top.
  pointsLanded: number;
  // A known-good build. Never projected to a client — the active team holds
  // the tablet — and pinned by a test that runs it through the real integrator,
  // so a level that stops being solvable fails the gate rather than the party.
  solution: ContraptionPlacedPiece[];
};

export type ContraptionContentFile = {
  prompts: ContraptionLevel[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isFieldCoordinate = (value: unknown): value is number => {
  return isFiniteNumber(value) && value >= 0 && value <= CONTRAPTION_FIELD_UNITS;
};

const isPieceKind = (value: unknown): value is ContraptionPieceKind => {
  return CONTRAPTION_PIECE_KINDS.some((kind) => kind === value);
};

const isGridColumn = (value: unknown): value is number => {
  return isNonNegativeInteger(value) && value < CONTRAPTION_GRID_COLUMNS;
};

const isGridRow = (value: unknown): value is number => {
  return isNonNegativeInteger(value) && value < CONTRAPTION_GRID_ROWS;
};

const validatePoint = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object with x and y" }];
  }

  return (["x", "y"] as const)
    .filter((axis) => !isFiniteNumber(value[axis]))
    .map((axis) => ({ path: axis, message: "must be a finite number" }));
};

const validateFieldPoint = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object with x and y" }];
  }

  return (["x", "y"] as const)
    .filter((axis) => !isFieldCoordinate(value[axis]))
    .map((axis) => ({
      path: axis,
      message: `must be a number between 0 and ${CONTRAPTION_FIELD_UNITS}`
    }));
};

export const validateContraptionPlacedPiece = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  if (!isPieceKind(value.kind)) {
    issues.push({
      path: "kind",
      message: `must be one of ${CONTRAPTION_PIECE_KINDS.join(", ")}`
    });
  }

  if (!isGridColumn(value.column)) {
    issues.push({
      path: "column",
      message: `must be an integer from 0 to ${CONTRAPTION_GRID_COLUMNS - 1}`
    });
  }

  if (!isGridRow(value.row)) {
    issues.push({
      path: "row",
      message: `must be an integer from 0 to ${CONTRAPTION_GRID_ROWS - 1}`
    });
  }

  return issues;
};

export const isContraptionPlacedPiece = (
  value: unknown
): value is ContraptionPlacedPiece => {
  return validateContraptionPlacedPiece(value).length === 0;
};

// Two pieces in one cell would be two segments on top of each other — a build
// the tablet cannot show and the physics resolves in layout order, silently.
const findDuplicateCellIssues = (pieces: unknown[]): ValidationIssue[] => {
  const seenCells = new Set<string>();
  const issues: ValidationIssue[] = [];

  pieces.forEach((piece, index) => {
    if (!isContraptionPlacedPiece(piece)) {
      return;
    }

    const cellKey = `${piece.column},${piece.row}`;

    if (seenCells.has(cellKey)) {
      issues.push({
        path: `[${index}]`,
        message: `must not share a cell with an earlier piece (${cellKey} is taken)`
      });
      return;
    }

    seenCells.add(cellKey);
  });

  return issues;
};

export const validateContraptionPieces = (value: unknown): ValidationIssue[] => {
  if (!Array.isArray(value)) {
    return [{ path: "", message: "must be an array of placed pieces" }];
  }

  const pieceIssues = value.flatMap((piece, index) =>
    prefixIssuePaths(validateContraptionPlacedPiece(piece), `[${index}]`)
  );

  return [...pieceIssues, ...findDuplicateCellIssues(value)];
};

const validateWing = (value: unknown): ValidationIssue[] => {
  const pointIssues = validateFieldPoint(value);

  if (!isObjectLike(value)) {
    return pointIssues;
  }

  return [
    ...pointIssues,
    ...prefixIssuePaths(validatePoint(value.velocity), "velocity")
  ];
};

const validateBucket = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  if (!isFieldCoordinate(value.x)) {
    issues.push({
      path: "x",
      message: `must be a number between 0 and ${CONTRAPTION_FIELD_UNITS}`
    });
  }

  if (!isFiniteNumber(value.width) || value.width <= 0) {
    issues.push({ path: "width", message: "must be a positive number" });
  } else if (isFieldCoordinate(value.x) && value.x + value.width > CONTRAPTION_FIELD_UNITS) {
    issues.push({
      path: "width",
      message: `must keep the bucket inside the ${CONTRAPTION_FIELD_UNITS}-unit field`
    });
  }

  if (!isFiniteNumber(value.height) || value.height <= 0) {
    issues.push({ path: "height", message: "must be a positive number" });
  }

  return issues;
};

const validateObstacle = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  if (!isNonEmptyString(value.id)) {
    issues.push({ path: "id", message: "must be a non-empty string" });
  }

  issues.push(...prefixIssuePaths(validateFieldPoint(value.from), "from"));
  issues.push(...prefixIssuePaths(validateFieldPoint(value.to), "to"));

  return issues;
};

const validatePickup = (value: unknown): ValidationIssue[] => {
  const pointIssues = validateFieldPoint(value);

  if (!isObjectLike(value)) {
    return pointIssues;
  }

  const issues = [...pointIssues];

  if (!isNonEmptyString(value.id)) {
    issues.push({ path: "id", message: "must be a non-empty string" });
  }

  if (!isPositiveInteger(value.points)) {
    issues.push({ path: "points", message: "must be a positive integer" });
  }

  return issues;
};

const findDuplicateIdIssues = (entries: unknown[], field: string): ValidationIssue[] => {
  const seenIds = new Set<string>();
  const issues: ValidationIssue[] = [];

  entries.forEach((entry, index) => {
    if (!isObjectLike(entry) || typeof entry.id !== "string") {
      return;
    }

    if (seenIds.has(entry.id)) {
      issues.push({
        path: `${field}[${index}].id`,
        message: `must be unique within the level ("${entry.id}" is already used)`
      });
      return;
    }

    seenIds.add(entry.id);
  });

  return issues;
};

const validateOptionalList = (
  value: unknown,
  field: string,
  validateEntry: (entry: unknown) => ValidationIssue[]
): ValidationIssue[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return [{ path: field, message: "must be an array" }];
  }

  const entryIssues = value.flatMap((entry, index) =>
    prefixIssuePaths(validateEntry(entry), `${field}[${index}]`)
  );

  return [...entryIssues, ...findDuplicateIdIssues(value, field)];
};

export const validateContraptionLevel = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = (["id", "title"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  issues.push(...prefixIssuePaths(validateWing(value.wing), "wing"));
  issues.push(...prefixIssuePaths(validateBucket(value.bucket), "bucket"));
  issues.push(...validateOptionalList(value.obstacles, "obstacles", validateObstacle));
  issues.push(...validateOptionalList(value.pickups, "pickups", validatePickup));

  if (!isPositiveInteger(value.pieceBudget)) {
    issues.push({ path: "pieceBudget", message: "must be a positive integer" });
  }

  if (!isNonNegativeInteger(value.pointsLanded)) {
    issues.push({ path: "pointsLanded", message: "must be a non-negative integer" });
  }

  const solutionIssues = validateContraptionPieces(value.solution);

  issues.push(...prefixIssuePaths(solutionIssues, "solution"));

  if (
    solutionIssues.length === 0 &&
    isPositiveInteger(value.pieceBudget) &&
    Array.isArray(value.solution) &&
    value.solution.length > value.pieceBudget
  ) {
    issues.push({
      path: "solution",
      message: "must not use more pieces than pieceBudget allows"
    });
  }

  return issues;
};

export const validateContraptionContentFile = (value: unknown): ValidationIssue[] => {
  return validatePromptPackFile(value, validateContraptionLevel);
};

export const isContraptionLevel = (value: unknown): value is ContraptionLevel => {
  return validateContraptionLevel(value).length === 0;
};

export const isContraptionContentFile = (
  value: unknown
): value is ContraptionContentFile => {
  return validateContraptionContentFile(value).length === 0;
};
