import type {DictionaryEntry, TranslationJobResponse, TranslationJobResult} from "../types";
import {DEFAULT_DICTIONARY, DEFAULT_SYSTEM_PROMPT} from "../src/shared/prompts";

export {DEFAULT_DICTIONARY, DEFAULT_SYSTEM_PROMPT};

export interface TranslationResponseData {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

export interface BatchTranslationResult {
  translations: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
    cost: number;
  };
}

const postJson = async <T>(url: string, body: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `${response.status} ${response.statusText}`);
  }

  return await response.json() as T;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `${response.status} ${response.statusText}`);
  }

  return await response.json() as T;
};

const runTranslationJob = async <T>(body: unknown): Promise<T> => {
  const job = await postJson<TranslationJobResponse>("/api/translation-jobs", body);
  const startedAt = Date.now();
  const maxWaitMs = 30 * 60 * 1000;

  while (Date.now() - startedAt < maxWaitMs) {
    await delay(1000);
    const state = await getJson<TranslationJobResult>(`/api/translation-jobs/${job.id}`);
    if (state.status === "completed") {
      return state.result as T;
    }
    if (state.status === "failed") {
      throw new Error(state.error || "Translation job failed.");
    }
  }

  throw new Error("Translation job timed out after 30 minutes.");
};

export const translateSelection = async (
  textToTranslate: string,
  customDict: DictionaryEntry[] = [],
  useDefaultDict: boolean = true,
  systemInstruction: string = DEFAULT_SYSTEM_PROMPT,
  profileId?: string,
): Promise<TranslationResponseData> => {
  return runTranslationJob<TranslationResponseData>({
    mode: "single",
    profileId,
    text: textToTranslate,
    customDictionary: customDict,
    useDefaultDictionary: useDefaultDict,
    systemInstruction,
  });
};

export const translateBatch = async (
  texts: string[],
  customDict: DictionaryEntry[] = [],
  useDefaultDict: boolean = true,
  systemInstruction: string = DEFAULT_SYSTEM_PROMPT,
  profileId?: string,
): Promise<BatchTranslationResult> => {
  return runTranslationJob<BatchTranslationResult>({
    mode: "batch",
    profileId,
    texts,
    customDictionary: customDict,
    useDefaultDictionary: useDefaultDict,
    systemInstruction,
  });
};
