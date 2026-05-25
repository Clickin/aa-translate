import type {
  ProviderBatchTranslateOptions,
  ProviderBatchTranslationResult,
  ProviderListModelsOptions,
  ProviderModelList,
  ProviderTranslateOptions,
  ProviderTranslationResult,
} from './types.js';
import { listGeminiModels, translateBatchWithGemini, translateWithGemini } from './gemini.js';
import {
  listOpenAICompatibleModels,
  translateBatchWithOpenAICompatible,
  translateWithOpenAICompatible,
} from './openai-compatible.js';

export const translateWithProvider = async (options: ProviderTranslateOptions): Promise<ProviderTranslationResult> => {
  switch (options.profile.provider) {
    case 'gemini':
      return translateWithGemini(options);
    case 'openai-compatible':
      return translateWithOpenAICompatible(options);
    default:
      throw new Error(`Unsupported provider: ${options.profile.provider satisfies never}`);
  }
};

export const listModelsWithProvider = async (options: ProviderListModelsOptions): Promise<ProviderModelList> => {
  switch (options.profile.provider) {
    case 'gemini':
      return listGeminiModels(options);
    case 'openai-compatible':
      return listOpenAICompatibleModels(options);
    default:
      throw new Error(`Unsupported provider: ${options.profile.provider satisfies never}`);
  }
};

export const translateBatchWithProvider = async (
  options: ProviderBatchTranslateOptions,
): Promise<ProviderBatchTranslationResult> => {
  switch (options.profile.provider) {
    case 'gemini':
      return translateBatchWithGemini(options);
    case 'openai-compatible':
      return translateBatchWithOpenAICompatible(options);
    default:
      throw new Error(`Unsupported provider: ${options.profile.provider satisfies never}`);
  }
};
