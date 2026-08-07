import assert from "node:assert/strict";
import { test } from "node:test";

import { resolvePort } from "./index.mjs";

const VARIABLE = "WN_E2E_CLIENT_PORT";
const FALLBACK = 5173;

function resolve(rawValue) {
  const env = rawValue === undefined ? {} : { [VARIABLE]: rawValue };
  return resolvePort(env, VARIABLE, FALLBACK);
}

test("falls back to the interactive default when the override is unset", () => {
  assert.equal(resolve(undefined), FALLBACK);
});

test("falls back to the interactive default when the override is blank", () => {
  assert.equal(resolve("   "), FALLBACK);
});

test("uses the override when it is a valid port", () => {
  assert.equal(resolve("5273"), 5273);
});

test("tolerates surrounding whitespace in the override", () => {
  assert.equal(resolve(" 5273 "), 5273);
});

test("throws rather than falling back when the override is not a number", () => {
  assert.throws(() => resolve("not-a-port"), /not a valid port/);
});

test("throws rather than falling back when the override is out of range", () => {
  assert.throws(() => resolve("70000"), /not a valid port/);
});

test("throws rather than falling back when the override is zero", () => {
  assert.throws(() => resolve("0"), /not a valid port/);
});

test("throws rather than falling back when the override is fractional", () => {
  assert.throws(() => resolve("5273.5"), /not a valid port/);
});

test("names the offending variable when it throws", () => {
  assert.throws(() => resolve("not-a-port"), new RegExp(VARIABLE));
});

test("resolves each variable independently from the same env", () => {
  const env = { WN_E2E_SERVER_PORT: "3100" };

  assert.equal(resolvePort(env, "WN_E2E_SERVER_PORT", 3000), 3100);
  assert.equal(resolvePort(env, "WN_E2E_CLIENT_PORT", 5173), 5173);
});
