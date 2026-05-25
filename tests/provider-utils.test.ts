import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIndexedBatchContent,
  splitBatchByCharacterBudget,
  parseIndexedBatchTranslations,
  splitBatchByOpenAICompatibleContext,
} from "../src/shared/provider-utils";
import { listBrowserProfileModels } from "../services/browserProviderService";

test("indexed batch parser accepts object responses", () => {
  assert.deepEqual(parseIndexedBatchTranslations('{"0":"하나","1":"둘"}', 2, "Test"), [
    "하나",
    "둘",
  ]);
});

test("indexed batch parser uses the final valid JSON value when the model echoes input", () => {
  assert.deepEqual(
    parseIndexedBatchTranslations(
      'Input Array: ["こんにちは","世界"]\nOutput JSON: {"0":"안녕","1":"세계"}',
      2,
      "Test",
    ),
    ["안녕", "세계"],
  );
});

test("indexed batch prompt requests stable zero-based object keys", () => {
  const prompt = buildIndexedBatchContent(["こんにちは", "世界"], "");
  assert.match(prompt, /valid JSON object/);
  assert.match(prompt, /"0" to "1"/);
});

test("OpenAI-compatible batch splitter caps item count", () => {
  const chunks = splitBatchByOpenAICompatibleContext(
    Array.from({ length: 65 }, (_, index) => `line-${index}`),
    "",
    "Translate.",
    200_000,
  );

  assert.deepEqual(
    chunks.map((chunk) => chunk.length),
    [32, 32, 1],
  );
});

test("character budget batch splitter caps item count for structured LLM output", () => {
  const chunks = splitBatchByCharacterBudget(
    Array.from({ length: 97 }, (_, index) => `行${index}`),
    4000,
    32,
  );

  assert.deepEqual(
    chunks.map((chunk) => chunk.length),
    [32, 32, 32, 1],
  );
});

test("browser OpenAI-compatible model discovery allows localhost without api key", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://localhost:1234/v1/models");
    assert.deepEqual(init?.headers, { "content-type": "application/json" });
    return new Response(
      JSON.stringify({
        data: [{ id: "gemma-3-4b-it" }],
      }),
      { headers: { "content-type": "application/json" } },
    );
  };

  try {
    assert.deepEqual(
      await listBrowserProfileModels({
        id: "local",
        name: "Local",
        provider: "openai-compatible",
        baseUrl: "http://localhost:1234",
        model: "gemma-3-4b-it",
        isDefault: true,
      }),
      [{ id: "gemma-3-4b-it", name: "gemma-3-4b-it" }],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
