import assert from "node:assert/strict";
import test from "node:test";

import {
  isFiniteNumber,
  isNonEmptyString,
  isNonNegativeInteger,
  isNumberRecord,
  isPositiveInteger,
  isRecord,
  isRecordOf,
  isStringArray
} from "./index.js";

test("isRecord accepts a plain object when it has keys or none", () => {
  assert.equal(isRecord({}), true);
  assert.equal(isRecord({ a: 1 }), true);
});

test("isRecord rejects an array when given one", () => {
  assert.equal(isRecord([]), false);
  assert.equal(isRecord([{ a: 1 }]), false);
});

test("isRecord rejects null and primitives when given them", () => {
  for (const value of [null, undefined, 0, "a", true]) {
    assert.equal(isRecord(value), false);
  }
});

test("isNonEmptyString rejects a whitespace-only string when given one", () => {
  assert.equal(isNonEmptyString("   "), false);
  assert.equal(isNonEmptyString(""), false);
  assert.equal(isNonEmptyString(" a "), true);
  assert.equal(isNonEmptyString(1), false);
});

test("isFiniteNumber rejects NaN and infinities when given them", () => {
  assert.equal(isFiniteNumber(1.5), true);
  assert.equal(isFiniteNumber(Number.NaN), false);
  assert.equal(isFiniteNumber(Number.POSITIVE_INFINITY), false);
  assert.equal(isFiniteNumber("1"), false);
});

test("isNonNegativeInteger accepts zero when the value is an integer", () => {
  assert.equal(isNonNegativeInteger(0), true);
  assert.equal(isNonNegativeInteger(3), true);
  assert.equal(isNonNegativeInteger(-1), false);
  assert.equal(isNonNegativeInteger(1.5), false);
});

test("isPositiveInteger rejects zero when the value is an integer", () => {
  assert.equal(isPositiveInteger(0), false);
  assert.equal(isPositiveInteger(1), true);
  assert.equal(isPositiveInteger(2.5), false);
  assert.equal(isPositiveInteger("1"), false);
});

test("isStringArray rejects a mixed array when one entry is not a string", () => {
  assert.equal(isStringArray([]), true);
  assert.equal(isStringArray(["a", "b"]), true);
  assert.equal(isStringArray(["a", 1]), false);
  assert.equal(isStringArray("a"), false);
});

test("isRecordOf checks every value when given a record", () => {
  const isString = (entry: unknown): entry is string => typeof entry === "string";

  assert.equal(isRecordOf({}, isString), true);
  assert.equal(isRecordOf({ a: "x" }, isString), true);
  assert.equal(isRecordOf({ a: "x", b: 1 }, isString), false);
  assert.equal(isRecordOf(["x"], isString), false);
});

test("isNumberRecord rejects a non-finite value when one is present", () => {
  assert.equal(isNumberRecord({ a: 1, b: 0 }), true);
  assert.equal(isNumberRecord({ a: Number.NaN }), false);
  assert.equal(isNumberRecord({ a: "1" }), false);
  assert.equal(isNumberRecord([1]), false);
});
