import { GoogleGenAI } from '@google/genai';
import type { DictionaryEntry, ProviderModelInfo, TranslationProvider, TranslationUsage } from '../types';
import { generateDictionaryPrompt } from '../src/shared/prompts';
import {
  baseV1Url,
  buildIndexedBatchContent,
  chatEndpointFor,
  DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS,
  estimatePromptTokens,
  parseIndexedBatchTranslations,
  RESPONSE_TOKEN_RESERVE,
  splitBatchByOpenAICompatibleContext,
} from '../src/shared/provider-utils';

export interface BrowserStoredProfile {
  id: string;
  name: string;
  provider: TranslationProvider;
  baseUrl: string;
  model: string;
  maxContextTokens?: number;
  apiKey?: string;
  isDefault: boolean;
}

export interface BrowserTranslateOptions {
  profile: BrowserStoredProfile;
  text: string;
  customDictionary: DictionaryEntry[];
  useDefaultDictionary: boolean;
  systemInstruction: string;
}

export interface BrowserBatchTranslateOptions extends Omit<BrowserTranslateOptions, 'text'> {
  texts: string[];
}

export interface BrowserBatchTranslationResult {
  translations: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    requestCount: number;
    cost: number;
  };
}

const COST_PER_1M_INPUT_TOKENS = 0.5;
const COST_PER_1M_OUTPUT_TOKENS = 3.0;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateCost = (input: number, output: number): number => {
  return (input / 1_000_000) * COST_PER_1M_INPUT_TOKENS + (output / 1_000_000) * COST_PER_1M_OUTPUT_TOKENS;
};

const requireApiKey = (profile: BrowserStoredProfile): string => {
  const key = profile.apiKey?.trim();
  if (!key) {
    throw new Error(`${profile.name} API key가 필요합니다.`);
  }
  return key;
};

const getGeminiClient = (profile: BrowserStoredProfile) => {
  return new GoogleGenAI({ apiKey: requireApiKey(profile) });
};

const openAIHeadersFor = (profile: BrowserStoredProfile): Record<string, string> => {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const apiKey = profile.apiKey?.trim();
  if (apiKey) {
    headers.authorization = `Bearer ${apiKey}`;
  }
  return headers;
};

const friendlyNetworkError = (profile: BrowserStoredProfile, error: unknown): Error => {
  if (error instanceof TypeError) {
    return new Error(
      `${profile.name} 호출이 브라우저에서 차단되었습니다. HTTPS page에서 HTTP localhost를 호출하거나 provider CORS 정책에 막힌 경우 Server/SFX 모드를 사용하세요.`,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
};

const isGenerationModelId = (id: string): boolean => {
  const normalized = id.toLowerCase();
  return !/(^|[-_/])(embed|embedding|rerank|re-rank|moderation|whisper|tts|stt)([-_/]|$)/.test(normalized);
};

const assertOpenAIPromptFitsContext = (profile: BrowserStoredProfile, systemInstruction: string, content: string) => {
  const limit = profile.maxContextTokens ?? DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS;
  const promptLimit = Math.max(256, limit - RESPONSE_TOKEN_RESERVE);
  const estimated = estimatePromptTokens(systemInstruction, content);

  if (estimated > promptLimit) {
    throw new Error(
      `Request is too large for ${profile.name} (${estimated} estimated prompt tokens, ${limit} context tokens). Increase the profile context tokens, select fewer segments, or use a larger-context model.`,
    );
  }
};

const postOpenAIChat = async (
  options: BrowserTranslateOptions | BrowserBatchTranslateOptions,
  content: string,
) => {
  assertOpenAIPromptFitsContext(options.profile, options.systemInstruction, content);

  try {
    const response = await fetch(chatEndpointFor(options.profile.baseUrl), {
      method: 'POST',
      headers: openAIHeadersFor(options.profile),
      body: JSON.stringify({
        model: options.profile.model,
        messages: [
          { role: 'system', content: options.systemInstruction },
          { role: 'user', content },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = typeof payload.error?.message === 'string' ? payload.error.message : response.statusText;
      throw new Error(`OpenAI-compatible provider failed: ${response.status} ${message}`);
    }

    return await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
  } catch (error) {
    throw friendlyNetworkError(options.profile, error);
  }
};

const splitGeminiBatch = (texts: string[]): string[][] => {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentChunkLength = 0;

  for (const text of texts) {
    if (currentChunk.length > 0 && (currentChunkLength + text.length > 4000 || currentChunk.length >= 200)) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChunkLength = 0;
    }
    currentChunk.push(text);
    currentChunkLength += text.length;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export const listBrowserProfileModels = async (profile: BrowserStoredProfile): Promise<ProviderModelInfo[]> => {
  if (profile.provider === 'gemini') {
    const ai = getGeminiClient(profile);
    const pager = await ai.models.list();
    const models: ProviderModelInfo[] = [];

    for await (const model of pager) {
      const id = model.name?.replace(/^models\//, '');
      if (!id || !model.supportedActions?.includes('generateContent')) {
        continue;
      }
      models.push({
        id,
        name: model.displayName || id,
        description: model.description,
      });
    }

    return models.sort((a, b) => a.id.localeCompare(b.id));
  }

  try {
    const response = await fetch(`${baseV1Url(profile.baseUrl)}/models`, {
      headers: openAIHeadersFor(profile),
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible model discovery failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as { data?: Array<{ id?: string }> };
    return (payload.data ?? [])
      .map((model) => model.id)
      .filter((id): id is string => Boolean(id))
      .filter(isGenerationModelId)
      .sort((a, b) => a.localeCompare(b))
      .map((id) => ({ id, name: id }));
  } catch (error) {
    throw friendlyNetworkError(profile, error);
  }
};

export const testBrowserProfile = async (profile: BrowserStoredProfile): Promise<void> => {
  const models = await listBrowserProfileModels(profile);
  if (models.length === 0) {
    throw new Error('사용 가능한 생성 모델을 찾지 못했습니다.');
  }
};

export const translateWithBrowserProfile = async (
  options: BrowserTranslateOptions,
): Promise<{ text: string; usage: TranslationUsage }> => {
  const dictPrompt = generateDictionaryPrompt(options.customDictionary, options.useDefaultDictionary);

  if (options.profile.provider === 'gemini') {
    const response = await getGeminiClient(options.profile).models.generateContent({
      model: options.profile.model,
      contents: `${options.systemInstruction}
${dictPrompt}
Text to translate: "${options.text}"`,
    });
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
    return {
      text: response.text?.trim() || options.text,
      usage: {
        inputTokens,
        outputTokens,
        requestCount: 1,
        cost: calculateCost(inputTokens, outputTokens),
      },
    };
  }

  const response = await postOpenAIChat(options, `${dictPrompt}\nText to translate: "${options.text}"`);
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  return {
    text: response.choices?.[0]?.message?.content?.trim() || options.text,
    usage: { inputTokens, outputTokens, requestCount: 1, cost: 0 },
  };
};

export const translateBatchWithBrowserProfile = async (
  options: BrowserBatchTranslateOptions,
): Promise<BrowserBatchTranslationResult> => {
  if (options.texts.length === 0) {
    return { translations: [], usage: { inputTokens: 0, outputTokens: 0, requestCount: 0, cost: 0 } };
  }

  const dictPrompt = generateDictionaryPrompt(options.customDictionary, options.useDefaultDictionary);
  const chunks = options.profile.provider === 'gemini'
    ? splitGeminiBatch(options.texts)
    : splitBatchByOpenAICompatibleContext(
      options.texts,
      dictPrompt,
      options.systemInstruction,
      options.profile.maxContextTokens ?? DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS,
    );
  const translations: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const content = buildIndexedBatchContent(chunk, dictPrompt);

    if (options.profile.provider === 'gemini') {
      const response = await getGeminiClient(options.profile).models.generateContent({
        model: options.profile.model,
        contents: `${options.systemInstruction}
${content}`,
      });
      const rawText = response.text?.trim();
      translations.push(...parseIndexedBatchTranslations(rawText, chunk.length, 'Gemini'));
      inputTokens += response.usageMetadata?.promptTokenCount || 0;
      outputTokens += response.usageMetadata?.candidatesTokenCount || 0;
      if (index < chunks.length - 1) {
        await delay(1000);
      }
      continue;
    }

    const response = await postOpenAIChat(options, content);
    const rawText = response.choices?.[0]?.message?.content?.trim();
    translations.push(...parseIndexedBatchTranslations(rawText, chunk.length, 'OpenAI-compatible'));
    inputTokens += response.usage?.prompt_tokens || 0;
    outputTokens += response.usage?.completion_tokens || 0;
  }

  return {
    translations,
    usage: {
      inputTokens,
      outputTokens,
      requestCount: chunks.length,
      cost: options.profile.provider === 'gemini' ? calculateCost(inputTokens, outputTokens) : 0,
    },
  };
};
