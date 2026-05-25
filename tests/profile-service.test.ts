import assert from "node:assert/strict";
import test from "node:test";
import {
  __resetProfileServiceForTests,
  fetchProfiles,
  saveProfile,
} from "../services/profileService";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  clear(): void {
    this.values.clear();
  }
}

test("profile service falls back to local storage when static preview has no backend", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new MemoryStorage() as Storage;
  let apiRequests = 0;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  globalThis.fetch = async () => {
    apiRequests += 1;
    return new Response("Not found", { status: 404 });
  };
  __resetProfileServiceForTests();

  try {
    const profiles = await fetchProfiles();
    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].id, "browser-gemini");
    assert.equal(profiles[0].model, "gemini-3.1-flash-lite");

    const saved = await saveProfile({
      name: "Local",
      provider: "openai-compatible",
      baseUrl: "http://localhost:1234",
      model: "gemma-local",
      isDefault: true,
    });

    assert.equal(saved.name, "Local");
    assert.equal(saved.provider, "openai-compatible");
    assert.equal(saved.isDefault, true);
    assert.equal(apiRequests, 1);
  } finally {
    __resetProfileServiceForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
});

test("profile save falls back to local storage when backend endpoint is missing", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new MemoryStorage() as Storage;
  let apiRequests = 0;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  globalThis.fetch = async () => {
    apiRequests += 1;
    return new Response("Not found", { status: 404 });
  };
  __resetProfileServiceForTests();

  try {
    const saved = await saveProfile({
      name: "Local",
      provider: "openai-compatible",
      baseUrl: "http://localhost:1234",
      model: "gemma-local",
      isDefault: true,
    });

    assert.equal(saved.name, "Local");
    assert.equal(saved.provider, "openai-compatible");
    assert.equal(saved.isDefault, true);
    assert.equal(apiRequests, 1);
  } finally {
    __resetProfileServiceForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
});

test("profile save falls back when static host returns html for api path", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new MemoryStorage() as Storage;
  let apiRequests = 0;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  globalThis.fetch = async () => {
    apiRequests += 1;
    return new Response("<!doctype html><html></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  };
  __resetProfileServiceForTests();

  try {
    const saved = await saveProfile({
      name: "Local",
      provider: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com",
      model: "gemini-3.1-flash-lite",
      isDefault: true,
    });

    assert.equal(saved.name, "Local");
    assert.equal(saved.provider, "gemini");
    assert.equal(saved.hasApiKey, false);
    assert.equal(apiRequests, 1);
  } finally {
    __resetProfileServiceForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
});

test("browser profiles preserve explicit Gemini preview model ids", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new MemoryStorage() as Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  storage.setItem(
    "aa-translator.browser-profiles.v1",
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
  );
  globalThis.fetch = async () => new Response("Not found", { status: 404 });
  __resetProfileServiceForTests();

  try {
    const profiles = await fetchProfiles();
    assert.equal(profiles[0].model, "gemini-3-flash-preview");
  } finally {
    __resetProfileServiceForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
});

test("browser profiles preserve explicit Gemini 2.5 model ids", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new MemoryStorage() as Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  storage.setItem(
    "aa-translator.browser-profiles.v1",
    JSON.stringify([
      {
        id: "old-gemini",
        name: "Gemini",
        provider: "gemini",
        baseUrl: "https://generativelanguage.googleapis.com",
        model: "gemini-2.5-flash",
        isDefault: true,
      },
    ]),
  );
  globalThis.fetch = async () => new Response("Not found", { status: 404 });
  __resetProfileServiceForTests();

  try {
    const profiles = await fetchProfiles();
    assert.equal(profiles[0].model, "gemini-2.5-flash");
  } finally {
    __resetProfileServiceForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
});

test("profile save reports browser storage write failures", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new MemoryStorage() as Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      ...storage,
      getItem: storage.getItem.bind(storage),
      setItem: () => {},
    },
  });
  globalThis.fetch = async () => new Response("Not found", { status: 404 });
  __resetProfileServiceForTests();

  try {
    await assert.rejects(
      () =>
        saveProfile({
          name: "Local",
          provider: "openai-compatible",
          baseUrl: "http://localhost:1234",
          model: "llama3.1",
          isDefault: false,
        }),
      /localStorage에 profile을 저장하지 못했습니다/,
    );
  } finally {
    __resetProfileServiceForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
});

test("browser profile update persists a manually entered model", async () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const storage = new MemoryStorage() as Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  globalThis.fetch = async () => new Response("Not found", { status: 404 });
  __resetProfileServiceForTests();

  try {
    const inserted = await saveProfile({
      name: "Local",
      provider: "openai-compatible",
      baseUrl: "http://localhost:1234",
      model: "llama3.1",
      isDefault: false,
    });
    const updated = await saveProfile({
      id: inserted.id,
      name: "Local",
      provider: "openai-compatible",
      baseUrl: "http://localhost:1234",
      model: "gemma-test",
      isDefault: false,
    });
    const profiles = await fetchProfiles();

    assert.equal(updated.model, "gemma-test");
    assert.equal(profiles.find((profile) => profile.id === inserted.id)?.model, "gemma-test");
  } finally {
    __resetProfileServiceForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
});
