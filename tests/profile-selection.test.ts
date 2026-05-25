import assert from "node:assert/strict";
import test from "node:test";
import { selectProfileId } from "../src/shared/profile-selection";
import type { TranslationProfile } from "../types";

const profile = (id: string, isDefault = false): TranslationProfile => ({
  id,
  name: id,
  provider: "gemini",
  baseUrl: "https://generativelanguage.googleapis.com",
  model: "gemini-3.1-flash-lite",
  hasApiKey: false,
  isDefault,
});

test("profile selection prefers the newly saved profile over the previous active default", () => {
  assert.equal(
    selectProfileId([profile("browser-gemini", true), profile("local")], "browser-gemini", "local"),
    "local",
  );
});

test("profile selection keeps current profile when no preferred profile is supplied", () => {
  assert.equal(
    selectProfileId([profile("browser-gemini", true), profile("local")], "local"),
    "local",
  );
});

test("profile selection falls back to default when preferred profile is missing", () => {
  assert.equal(
    selectProfileId([profile("browser-gemini", true)], "missing", "also-missing"),
    "browser-gemini",
  );
});
