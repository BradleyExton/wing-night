// The small value guards every content validator, rules check and runtime-state
// guard reads unknown input with. They live here once because the copies had
// already drifted: some object checks let arrays through and some did not.

// A plain keyed object. Arrays are objects too, and they are rejected: nothing
// that asks "is this a record?" wants `[]` to answer yes.
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

// Whitespace-only counts as empty, so a name or prompt of "   " is refused.
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

export const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

export const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

export const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
};

// A record whose every value passes `isEntry` — an empty record passes.
export const isRecordOf = <Entry>(
  value: unknown,
  isEntry: (entry: unknown) => entry is Entry
): value is Record<string, Entry> => {
  return isRecord(value) && Object.values(value).every((entry) => isEntry(entry));
};

// Points, scores and tallies keyed by id: every value a finite number.
export const isNumberRecord = (value: unknown): value is Record<string, number> => {
  return isRecordOf(value, isFiniteNumber);
};
