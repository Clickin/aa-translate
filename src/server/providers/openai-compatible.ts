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

const stripReasoningBlocks = (text: string): string => {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
};

const findBalancedJsonValues = (text: string): unknown[] => {
  const source = stripReasoningBlocks(text).replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const openToClose: Record<string, string> = { '[': ']', '{': '}' };
  const values: unknown[] = [];

  for (let start = 0; start < source.length; start += 1) {
    const opening = source[start];
    const expectedClose = openToClose[opening];
    if (!expectedClose) {
      continue;
    }

    const stack = [expectedClose];
    let inString = false;
    let escaped = false;

    for (let index = start + 1; index < source.length; index += 1) {
      const char = source[index];

      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = inString;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) {
        continue;
      }

      if (openToClose[char]) {
        stack.push(openToClose[char]);
        continue;
      }
      if (char === stack[stack.length - 1]) {
        stack.pop();
        if (stack.length === 0) {
          values.push(JSON.parse(source.slice(start, index + 1)));
          start = index;
          break;
        }
      }
    }
  }

  return values;
};

const parseBatchTranslations = (rawText: string | undefined, expectedLength: number): string[] => {
  if (!rawText) {
    throw new Error('OpenAI-compatible provider returned an empty batch response.');
  }

  const values = findBalancedJsonValues(rawText);
  const candidates = values
    .map((parsed) =>
      Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { translations?: unknown }).translations)
          ? (parsed as { translations: unknown[] }).translations
          : null,
    )
    .filter((value): value is unknown[] => Boolean(value) && value.length === expectedLength);
  const translations = candidates.at(-1);

  if (!translations) {
    throw new Error(
      `OpenAI-compatible provider batch response shape mismatch: expected ${expectedLength} translations.`,
    );
  }

  return translations.map(String);
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
    const rawText = response.choices?.[0]?.message?.content?.trim();
    const chunkTranslations = parseBatchTranslations(rawText, chunk.length);

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
