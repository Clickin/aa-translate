export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

const retiredDefaultGeminiModels = new Set(['gemini-3-flash-preview', 'gemini-2.5-flash']);

export const normalizeGeminiModel = (provider: string, model: string): string => {
  const trimmed = model.trim();
  return provider === 'gemini' && retiredDefaultGeminiModels.has(trimmed) ? DEFAULT_GEMINI_MODEL : trimmed;
};
