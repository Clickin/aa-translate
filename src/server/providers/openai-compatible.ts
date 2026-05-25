import { generateDictionaryPrompt } from '../../shared/prompts.js';
import type {
  ProviderBatchTranslateOptions,
  ProviderBatchTranslationResult,
  ProviderListModelsOptions,
  ProviderModelList,
  ProviderTranslateOptions,
  ProviderTranslationResult,
} from './types.js';

const baseV1Url = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
};

const chatEndpointFor = (baseUrl: string) => {
  return `${baseV1Url(baseUrl)}/chat/completions`;
};

const DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS = 4096;
const RESPONSE_TOKEN_RESERVE = 768;
const CHAT_MESSAGE_OVERHEAD_TOKENS = 32;

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

const postChat = async (options: ProviderTranslateOptions | ProviderBatchTranslateOptions, content: string) => {
  assertPromptFitsContext(options, content);

  const response = await fetch(chatEndpointFor(options.profile.baseUrl), {
    method: 'POST',
    headers: headersFor(options.profile.apiKey),
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
    throw new Error(`OpenAI-compatible provider failed: ${response.status} ${response.statusText}`);
  }

  return await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
};

const contextTokenLimit = (options: ProviderTranslateOptions | ProviderBatchTranslateOptions): number => {
  return options.profile.maxContextTokens ?? DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS;
};

const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 2);
};

const estimatePromptTokens = (
  options: ProviderTranslateOptions | ProviderBatchTranslateOptions,
  content: string,
): number => {
  return estimateTokens(options.systemInstruction) + estimateTokens(content) + CHAT_MESSAGE_OVERHEAD_TOKENS;
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

const buildBatchContent = (texts: string[], dictPrompt: string) => {
  return `Output a valid JSON array of strings with exactly ${texts.length} items.
Maintain input order and do not add explanations.
${dictPrompt}
Input Array: ${JSON.stringify(texts)}`;
};

const splitBatchByContext = (
  options: ProviderBatchTranslateOptions,
  texts: string[],
  dictPrompt: string,
): string[][] => {
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const text of texts) {
    const candidate = [...current, text];
    const candidateContent = buildBatchContent(candidate, dictPrompt);
    const limit = Math.max(256, contextTokenLimit(options) - RESPONSE_TOKEN_RESERVE);
    const estimated = estimatePromptTokens(options, candidateContent);

    if (estimated <= limit) {
      current = candidate;
      continue;
    }

    if (current.length === 0) {
      assertPromptFitsContext(options, buildBatchContent([text], dictPrompt));
    }

    chunks.push(current);
    current = [text];
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
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
    const response = await postChat(options, buildBatchContent(chunk, dictPrompt));
    const rawText = response.choices?.[0]?.message?.content?.trim().replace(/```json|```/g, '').trim();

    let chunkTranslations = chunk;
    try {
      const parsed = rawText ? JSON.parse(rawText) : null;
      if (Array.isArray(parsed) && parsed.length === chunk.length) {
        chunkTranslations = parsed.map(String);
      }
    } catch {
      chunkTranslations = chunk;
    }

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
