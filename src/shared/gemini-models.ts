export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const retiredDefaultGeminiModels = new Set(['gemini-3-flash-preview']);

export const normalizeGeminiModel = (provider: string, model: string): string => {
  const trimmed = model.trim();
  return provider === 'gemini' && retiredDefaultGeminiModels.has(trimmed) ? DEFAULT_GEMINI_MODEL : trimmed;
};
