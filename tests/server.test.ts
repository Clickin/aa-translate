import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { createApp } from "../src/server/app";
import { ProfileStore } from "../src/server/profiles/store";

test("health endpoint returns ok", async () => {
  const app = createApp({ profiles: new ProfileStore("unused.json") });
  const response = await app.request("/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test("profile endpoint redacts api key", async () => {
  const store = new ProfileStore(
    join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
  );
  await store.save({
    name: "Local",
    provider: "openai-compatible",
    baseUrl: "http://127.0.0.1:11434",
    model: "llama3.1",
    apiKey: "secret",
    isDefault: true,
  });

  const app = createApp({ profiles: store });
  const response = await app.request("/api/profiles");
  const payload = (await response.json()) as {
    profiles: Array<{ apiKey?: string; hasApiKey: boolean }>;
  };
  assert.equal(
    payload.profiles.some((profile) => profile.apiKey),
    false,
  );
  assert.equal(
    payload.profiles.some((profile) => profile.hasApiKey),
    true,
  );
});

test("default Gemini profile uses a current generateContent model", async () => {
  const store = new ProfileStore(
    join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
  );

  const app = createApp({ profiles: store });
  const response = await app.request("/api/profiles");
  const payload = (await response.json()) as {
    profiles: Array<{ provider: string; model: string }>;
  };

  assert.deepEqual(
    payload.profiles.map((profile) => ({ provider: profile.provider, model: profile.model })),
    [{ provider: "gemini", model: "gemini-2.5-flash" }],
  );
});

test("stored profiles normalize the removed Gemini preview default", async () => {
  const path = join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`);
  await writeFile(
    path,
    JSON.stringify([
      {
        id: "old-gemini",
        name: "Gemini",
        provider: "gemini",
        baseUrl: "https://generativelanguage.googleapis.com",
        model: "gemini-3-flash-preview",
        isDefault: true,
      },
    ]),
    "utf8",
  );

  const app = createApp({ profiles: new ProfileStore(path) });
  const response = await app.request("/api/profiles");
  const payload = (await response.json()) as {
    profiles: Array<{ provider: string; model: string }>;
  };

  assert.deepEqual(
    payload.profiles.map((profile) => ({ provider: profile.provider, model: profile.model })),
    [{ provider: "gemini", model: "gemini-2.5-flash" }],
  );
});

test("profile model discovery returns advertised OpenAI-compatible models", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://127.0.0.1:11434/v1/models");
    const headers = init?.headers as Record<string, string> | undefined;
    assert.equal(headers?.authorization, "Bearer secret");
    return new Response(
      JSON.stringify({
        data: [
          { id: "qwen/qwen3.6-27b", object: "model", owned_by: "organization_owner" },
          {
            id: "gemma-4-e4b-uncensored-hauhaucs-aggressive@q4_k_m",
            object: "model",
            owned_by: "organization_owner",
          },
          {
            id: "gemma-4-e4b-uncensored-hauhaucs-aggressive@?",
            object: "model",
            owned_by: "organization_owner",
          },
          { id: "google/gemma-4-e4b", object: "model", owned_by: "organization_owner" },
          { id: "aya-expanse-32b-ungated", object: "model", owned_by: "organization_owner" },
          { id: "aya-expanse-8b", object: "model", owned_by: "organization_owner" },
          {
            id: "text-embedding-nomic-embed-text-v1.5",
            object: "model",
            owned_by: "organization_owner",
          },
        ],
      }),
      { headers: { "content-type": "application/json" } },
    );
  };

  try {
    const store = new ProfileStore(
      join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
    );
    const profile = await store.save({
      name: "Local",
      provider: "openai-compatible",
      baseUrl: "http://127.0.0.1:11434",
      model: "llama3.1",
      apiKey: "secret",
      isDefault: true,
    });

    const app = createApp({ profiles: store });
    const response = await app.request(`/api/profiles/${profile.id}/models`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      models: [
        { id: "aya-expanse-32b-ungated", name: "aya-expanse-32b-ungated" },
        { id: "aya-expanse-8b", name: "aya-expanse-8b" },
        {
          id: "gemma-4-e4b-uncensored-hauhaucs-aggressive@?",
          name: "gemma-4-e4b-uncensored-hauhaucs-aggressive@?",
        },
        {
          id: "gemma-4-e4b-uncensored-hauhaucs-aggressive@q4_k_m",
          name: "gemma-4-e4b-uncensored-hauhaucs-aggressive@q4_k_m",
        },
        { id: "google/gemma-4-e4b", name: "google/gemma-4-e4b" },
        { id: "qwen/qwen3.6-27b", name: "qwen/qwen3.6-27b" },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("translation jobs complete asynchronously and split local batches by context", async () => {
  const originalFetch = globalThis.fetch;
  let chatRequests = 0;

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "http://127.0.0.1:11434/v1/chat/completions");
    chatRequests += 1;

    const request = JSON.parse(String(init?.body)) as {
      messages: Array<{ role: string; content: string }>;
    };
    const userContent = request.messages.find((message) => message.role === "user")?.content ?? "";
    const inputArray = JSON.parse(
      userContent.match(/Input Array: (.*)$/s)?.[1] ?? "[]",
    ) as string[];

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(inputArray.map((text) => `ko:${text}`)) } }],
        usage: { prompt_tokens: 10, completion_tokens: 2 },
      }),
      { headers: { "content-type": "application/json" } },
    );
  };

  try {
    const store = new ProfileStore(
      join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
    );
    const profile = await store.save({
      name: "LM Studio",
      provider: "openai-compatible",
      baseUrl: "http://127.0.0.1:11434",
      model: "gemma-local",
      maxContextTokens: 1200,
      isDefault: true,
    });

    const app = createApp({ profiles: store });
    const createResponse = await app.request("/api/translation-jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "batch",
        profileId: profile.id,
        texts: ["あ".repeat(260), "い".repeat(260), "う".repeat(260)],
        useDefaultDictionary: false,
        systemInstruction: "Translate to Korean.",
      }),
    });
    assert.equal(createResponse.status, 202);

    const created = (await createResponse.json()) as { id: string };
    let state: any;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const stateResponse = await app.request(`/api/translation-jobs/${created.id}`);
      state = await stateResponse.json();
      if (state.status === "completed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    assert.equal(state.status, "completed");
    assert.deepEqual(state.result.translations, [
      `ko:${"あ".repeat(260)}`,
      `ko:${"い".repeat(260)}`,
      `ko:${"う".repeat(260)}`,
    ]);
    assert.equal(state.result.usage.requestCount, chatRequests);
    assert.ok(chatRequests > 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local async batch jobs accept reasoning text around JSON translations", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '<think>この入力を韓国語に翻訳します。</think>\n["ko:こんにちは","ko:世界"]',
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 4 },
      }),
      { headers: { "content-type": "application/json" } },
    );

  try {
    const store = new ProfileStore(
      join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
    );
    const profile = await store.save({
      name: "LM Studio",
      provider: "openai-compatible",
      baseUrl: "http://127.0.0.1:11434",
      model: "gemma-local",
      maxContextTokens: 4096,
      isDefault: true,
    });

    const app = createApp({ profiles: store });
    const createResponse = await app.request("/api/translation-jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "batch",
        profileId: profile.id,
        texts: ["こんにちは", "世界"],
        useDefaultDictionary: false,
        systemInstruction: "Translate to Korean.",
      }),
    });

    const created = (await createResponse.json()) as { id: string };
    let state: any;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const stateResponse = await app.request(`/api/translation-jobs/${created.id}`);
      state = await stateResponse.json();
      if (state.status === "completed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    assert.equal(state.status, "completed");
    assert.deepEqual(state.result.translations, ["ko:こんにちは", "ko:世界"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local async batch jobs use translated JSON when the model echoes the input array", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                'Input Array: ["こんにちは","世界"]\nOutput JSON: ["ko:こんにちは","ko:世界"]',
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 4 },
      }),
      { headers: { "content-type": "application/json" } },
    );

  try {
    const store = new ProfileStore(
      join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
    );
    const profile = await store.save({
      name: "LM Studio",
      provider: "openai-compatible",
      baseUrl: "http://127.0.0.1:11434",
      model: "gemma-local",
      maxContextTokens: 4096,
      isDefault: true,
    });

    const app = createApp({ profiles: store });
    const createResponse = await app.request("/api/translation-jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "batch",
        profileId: profile.id,
        texts: ["こんにちは", "世界"],
        useDefaultDictionary: false,
        systemInstruction: "Translate to Korean.",
      }),
    });

    const created = (await createResponse.json()) as { id: string };
    let state: any;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const stateResponse = await app.request(`/api/translation-jobs/${created.id}`);
      state = await stateResponse.json();
      if (state.status === "completed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    assert.equal(state.status, "completed");
    assert.deepEqual(state.result.translations, ["ko:こんにちは", "ko:世界"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local async batch jobs accept index-keyed JSON object translations", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"0":"ko:こんにちは","1":"ko:世界"}',
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 4 },
      }),
      { headers: { "content-type": "application/json" } },
    );

  try {
    const store = new ProfileStore(
      join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
    );
    const profile = await store.save({
      name: "LM Studio",
      provider: "openai-compatible",
      baseUrl: "http://127.0.0.1:11434",
      model: "gemma-local",
      maxContextTokens: 4096,
      isDefault: true,
    });

    const app = createApp({ profiles: store });
    const createResponse = await app.request("/api/translation-jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "batch",
        profileId: profile.id,
        texts: ["こんにちは", "世界"],
        useDefaultDictionary: false,
        systemInstruction: "Translate to Korean.",
      }),
    });

    const created = (await createResponse.json()) as { id: string };
    let state: any;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const stateResponse = await app.request(`/api/translation-jobs/${created.id}`);
      state = await stateResponse.json();
      if (state.status === "completed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    assert.equal(state.status, "completed");
    assert.deepEqual(state.result.translations, ["ko:こんにちは", "ko:世界"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("local async batch jobs split large item counts before asking the model", async () => {
  const originalFetch = globalThis.fetch;
  const chunkSizes: number[] = [];

  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as {
      messages: Array<{ role: string; content: string }>;
    };
    const userContent = request.messages.find((message) => message.role === "user")?.content ?? "";
    const inputArray = JSON.parse(
      userContent.match(/Input Array: (.*)$/s)?.[1] ?? "[]",
    ) as string[];
    chunkSizes.push(inputArray.length);

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(inputArray.map((text) => `ko:${text}`)) } }],
        usage: { prompt_tokens: 10, completion_tokens: 4 },
      }),
      { headers: { "content-type": "application/json" } },
    );
  };

  try {
    const store = new ProfileStore(
      join(process.env.TEMP || process.cwd(), `aa-translator-${crypto.randomUUID()}.json`),
    );
    const profile = await store.save({
      name: "LM Studio",
      provider: "openai-compatible",
      baseUrl: "http://127.0.0.1:11434",
      model: "gemma-local",
      maxContextTokens: 200_000,
      isDefault: true,
    });
    const texts = Array.from({ length: 208 }, (_, index) => `行${index}`);

    const app = createApp({ profiles: store });
    const createResponse = await app.request("/api/translation-jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "batch",
        profileId: profile.id,
        texts,
        useDefaultDictionary: false,
        systemInstruction: "Translate to Korean.",
      }),
    });

    const created = (await createResponse.json()) as { id: string };
    let state: any;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const stateResponse = await app.request(`/api/translation-jobs/${created.id}`);
      state = await stateResponse.json();
      if (state.status === "completed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    assert.equal(state.status, "completed");
    assert.deepEqual(
      state.result.translations,
      texts.map((text) => `ko:${text}`),
    );
    assert.ok(chunkSizes.length > 1);
    assert.ok(chunkSizes.every((size) => size <= 32));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
