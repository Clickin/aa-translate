import { GoogleGenAI } from '@google/genai';
import { generateDictionaryPrompt } from '../../shared/prompts.js';
import type {
  ProviderBatchTranslateOptions,
  ProviderBatchTranslationResult,
  ProviderListModelsOptions,
  ProviderModelList,
  ProviderTranslateOptions,
  ProviderTranslationResult,
} from './types.js';

const COST_PER_1M_INPUT_TOKENS = 0.5;
const COST_PER_1M_OUTPUT_TOKENS = 3.0;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateCost = (input: number, output: number): number => {
  return (input / 1_000_000) * COST_PER_1M_INPUT_TOKENS + (output / 1_000_000) * COST_PER_1M_OUTPUT_TOKENS;
};

const getClient = (apiKey?: string) => {
  const key = apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key) {
    throw new Error('Gemini API key is not configured for this profile.');
  }
  return new GoogleGenAI({ apiKey: key });
};

export const translateWithGemini = async (options: ProviderTranslateOptions): Promise<ProviderTranslationResult> => {
  const ai = getClient(options.profile.apiKey);
  const dictPrompt = generateDictionaryPrompt(options.customDictionary, options.useDefaultDictionary);
  const response = await ai.models.generateContent({
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
};

export const listGeminiModels = async (options: ProviderListModelsOptions): Promise<ProviderModelList> => {
  const ai = getClient(options.profile.apiKey);
  const pager = await ai.models.list();
  const models: ProviderModelList = [];

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
};

export const translateBatchWithGemini = async (
  options: ProviderBatchTranslateOptions,
): Promise<ProviderBatchTranslationResult> => {
  if (options.texts.length === 0) {
    return { translations: [], usage: { inputTokens: 0, outputTokens: 0, requestCount: 0, cost: 0 } };
  }

  const ai = getClient(options.profile.apiKey);
  const dictPrompt = generateDictionaryPrompt(options.customDictionary, options.useDefaultDictionary);
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentChunkLength = 0;

  for (const text of options.texts) {
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

  const translations: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let chunkResult: string[] | null = null;

    for (let attempts = 0; attempts < 3 && chunkResult === null; attempts++) {
      if (attempts > 0) {
        await delay(2000 * 2 ** attempts);
      }

      try {
        const response = await ai.models.generateContent({
          model: options.profile.model,
          contents: `${options.systemInstruction}
TECHNICAL CONSTRAINT: Output must be a valid JSON array of strings.
CRITICAL: The output array must have exactly ${chunk.length} items. Do not skip any items.
Maintain the exact order of the input array.
${dictPrompt}
Input Array: ${JSON.stringify(chunk)}`,
        });

        const jsonText = response.text?.trim().replace(/```json|```/g, '').trim();
        const parsed = jsonText ? JSON.parse(jsonText) : null;
        if (!Array.isArray(parsed) || parsed.length !== chunk.length) {
          throw new Error('Gemini batch response shape mismatch.');
        }

        chunkResult = parsed.map(String);
        inputTokens += response.usageMetadata?.promptTokenCount || 0;
        outputTokens += response.usageMetadata?.candidatesTokenCount || 0;
      } catch {
        chunkResult = attempts === 2 ? chunk : null;
      }
    }

    translations.push(...(chunkResult ?? chunk));
    if (i < chunks.length - 1) {
      await delay(1000);
    }
  }

  return {
    translations,
    usage: {
      inputTokens,
      outputTokens,
      requestCount: chunks.length,
      cost: calculateCost(inputTokens, outputTokens),
    },
  };
};
