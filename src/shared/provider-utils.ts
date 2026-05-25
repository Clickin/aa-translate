export const DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS = 4096;
export const RESPONSE_TOKEN_RESERVE = 768;
export const CHAT_MESSAGE_OVERHEAD_TOKENS = 32;
export const MAX_OPENAI_COMPATIBLE_BATCH_ITEMS = 32;
export const GEMINI_BATCH_MAX_CHARACTERS = 3000;
export const GEMINI_BATCH_MAX_ITEMS = 8;

export const baseV1Url = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
};

export const chatEndpointFor = (baseUrl: string) => {
  return `${baseV1Url(baseUrl)}/chat/completions`;
};

export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 2);
};

export const estimatePromptTokens = (
  systemInstruction: string,
  content: string,
): number => {
  return estimateTokens(systemInstruction) + estimateTokens(content) + CHAT_MESSAGE_OVERHEAD_TOKENS;
};

export const buildIndexedBatchContent = (texts: string[], dictPrompt: string) => {
  return `Output one valid JSON object only.
Use zero-based string keys from "0" to "${texts.length - 1}".
Each value must be the translation for the input item at the same index.
Do not add explanations.
${dictPrompt}
Input Array: ${JSON.stringify(texts)}`;
};

export const stripReasoningBlocks = (text: string): string => {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
};

export const findBalancedJsonValues = (text: string): unknown[] => {
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

export const parseIndexedBatchTranslations = (
  rawText: string | undefined,
  expectedLength: number,
  providerName: string,
): string[] => {
  if (!rawText) {
    throw new Error(`${providerName} provider returned an empty batch response.`);
  }

  const values = findBalancedJsonValues(rawText);
  const candidates = values
    .map((parsed) => {
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      const object = parsed as Record<string, unknown> & { translations?: unknown };
      if (Array.isArray(object.translations)) {
        return object.translations;
      }

      const indexed = Array.from({ length: expectedLength }, (_, index) => object[String(index)]);
      return indexed.every((value) => value !== undefined) ? indexed : null;
    })
    .filter((value): value is unknown[] => Boolean(value) && value.length === expectedLength);
  const translations = candidates.at(-1);

  if (!translations) {
    throw new Error(`${providerName} provider batch response shape mismatch: expected ${expectedLength} translations.`);
  }

  return translations.map(String);
};

export const splitBatchByOpenAICompatibleContext = (
  texts: string[],
  dictPrompt: string,
  systemInstruction: string,
  maxContextTokens: number = DEFAULT_OPENAI_COMPATIBLE_CONTEXT_TOKENS,
): string[][] => {
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const text of texts) {
    const candidate = [...current, text];
    const candidateContent = buildIndexedBatchContent(candidate, dictPrompt);
    const promptLimit = Math.max(256, maxContextTokens - RESPONSE_TOKEN_RESERVE);
    const estimated = estimatePromptTokens(systemInstruction, candidateContent);

    if (estimated <= promptLimit && candidate.length <= MAX_OPENAI_COMPATIBLE_BATCH_ITEMS) {
      current = candidate;
      continue;
    }

    if (current.length === 0) {
      chunks.push([text]);
      current = [];
      continue;
    }

    chunks.push(current);
    current = [text];
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
};

export const splitBatchByCharacterBudget = (
  texts: string[],
  maxCharacters: number,
  maxItems: number,
): string[][] => {
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const text of texts) {
    if (current.length > 0 && (currentLength + text.length > maxCharacters || current.length >= maxItems)) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(text);
    currentLength += text.length;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
};

export const splitBatchForGemini = (texts: string[]): string[][] => {
  return splitBatchByCharacterBudget(texts, GEMINI_BATCH_MAX_CHARACTERS, GEMINI_BATCH_MAX_ITEMS);
};
