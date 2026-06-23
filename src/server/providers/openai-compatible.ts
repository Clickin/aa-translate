import { generateDictionaryPrompt } from '../../shared/prompts.js';
import {
  baseV1Url,
  buildIndexedBatchContent,
  chatEndpointFor,
  DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS,
  estimatePromptTokens as estimatePromptTokensForMessages,
  parseIndexedBatchTranslations,
  RESPONSE_TOKEN_RESERVE,
  splitBatchByOpenAICompatibleContext,
} from '../../shared/provider-utils.js';
import type {
  ProviderBatchTranslateOptions,
  ProviderBatchTranslationResult,
  ProviderListModelsOptions,
  ProviderModelList,
  ProviderTranslateOptions,
  ProviderTranslationResult,
} from './types.js';

const headersFor = (apiKey?: string): Record<string, string> => {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (apiKey?.trim()) {
    headers.authorization = `Bearer ${apiKey.trim()}`;
  }
  return headers;
};

const isGenerationModelId = (id: string): boolean => {
  const normalized = id.toLowerCase();
  return !/(^|[-_/])(embed|embedding|rerank|re-rank|moderation|whisper|tts|stt)([-_/]|$)/.test(normalized);
};

const indexedBatchResponseFormat = (length: number) => ({
  type: 'json_schema',
  json_schema: {
    name: 'indexed_batch_translations',
    strict: true,
    schema: {
      type: 'object',
      properties: Object.fromEntries(
        Array.from({ length }, (_, index) => [
          String(index),
          {
            type: 'string',
            description: `Korean translation for input item ${index}.`,
          },
        ]),
      ),
      required: Array.from({ length }, (_, index) => String(index)),
      additionalProperties: false,
    },
  },
});

const postChat = async (
  options: ProviderTranslateOptions | ProviderBatchTranslateOptions,
  content: string,
  responseFormat?: unknown,
) => {
  assertPromptFitsContext(options, content);

  const post = (includeResponseFormat: boolean) => fetch(chatEndpointFor(options.profile.baseUrl), {
    method: 'POST',
    headers: headersFor(options.profile.apiKey),
    body: JSON.stringify({
      model: options.profile.model,
      messages: [
        { role: 'system', content: options.systemInstruction },
        { role: 'user', content },
      ],
      temperature: responseFormat ? 0 : 0.2,
      ...(includeResponseFormat ? { response_format: responseFormat } : {}),
    }),
  });

  let response = await post(Boolean(responseFormat));
  if (!response.ok && responseFormat && [400, 422].includes(response.status)) {
    response = await post(false);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = payload && typeof payload === 'object' && 'error' in payload
      ? (payload as { error?: { message?: unknown } }).error
      : undefined;
    const message = typeof error?.message === 'string' ? error.message : response.statusText;
    throw new Error(`OpenAI-compatible provider failed: ${response.status} ${message}`);
  }

  return await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
};

const contextTokenLimit = (options: ProviderTranslateOptions | ProviderBatchTranslateOptions): number => {
  return options.profile.maxContextTokens ?? DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS;
};

const estimatePromptTokens = (
  options: ProviderTranslateOptions | ProviderBatchTranslateOptions,
  content: string,
): number => {
  return estimatePromptTokensForMessages(options.systemInstruction, content);
};

const assertPromptFitsContext = (
  options: ProviderTranslateOptions | ProviderBatchTranslateOptions,
  content: string,
) => {
  const limit = contextTokenLimit(options);
  const promptLimit = Math.max(256, limit - RESPONSE_TOKEN_RESERVE);
  const estimated = estimatePromptTokens(options, content);
  if (estimated > promptLimit) {
    throw new Error(
      `Request is too large for ${options.profile.name} (${estimated} estimated prompt tokens, ${limit} context tokens). Increase the profile context tokens, select fewer segments, or use a larger-context model.`,
    );
  }
};

const splitBatchByContext = (
  options: ProviderBatchTranslateOptions,
  texts: string[],
  dictPrompt: string,
): string[][] => {
  return splitBatchByOpenAICompatibleContext(
    texts,
    dictPrompt,
    options.systemInstruction,
    contextTokenLimit(options),
  );
};

export const listOpenAICompatibleModels = async (options: ProviderListModelsOptions): Promise<ProviderModelList> => {
  const response = await fetch(`${baseV1Url(options.profile.baseUrl)}/models`, {
    headers: headersFor(options.profile.apiKey),
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
};

export const translateWithOpenAICompatible = async (
  options: ProviderTranslateOptions,
): Promise<ProviderTranslationResult> => {
  const dictPrompt = generateDictionaryPrompt(options.customDictionary, options.useDefaultDictionary);
  const response = await postChat(options, `${dictPrompt}\nText to translate: "${options.text}"`);
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  return {
    text: response.choices?.[0]?.message?.content?.trim() || options.text,
    usage: { inputTokens, outputTokens, requestCount: 1, cost: 0 },
  };
};

export const translateBatchWithOpenAICompatible = async (
  options: ProviderBatchTranslateOptions,
): Promise<ProviderBatchTranslationResult> => {
  if (options.texts.length === 0) {
    return { translations: [], usage: { inputTokens: 0, outputTokens: 0, requestCount: 0, cost: 0 } };
  }

  const dictPrompt = generateDictionaryPrompt(options.customDictionary, options.useDefaultDictionary);
  const chunks = splitBatchByContext(options, options.texts, dictPrompt);
  const translations: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (const chunk of chunks) {
    const response = await postChat(options, buildIndexedBatchContent(chunk, dictPrompt), indexedBatchResponseFormat(chunk.length));
    const rawText = response.choices?.[0]?.message?.content?.trim();
    const chunkTranslations = parseIndexedBatchTranslations(rawText, chunk.length, 'OpenAI-compatible');

    translations.push(...chunkTranslations);
    inputTokens += response.usage?.prompt_tokens || 0;
    outputTokens += response.usage?.completion_tokens || 0;
  }

  return {
    translations,
    usage: {
      inputTokens,
      outputTokens,
      requestCount: chunks.length,
      cost: 0,
    },
  };
};
