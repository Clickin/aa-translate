import type { DictionaryEntry } from '../../types.js';

export const DEFAULT_DICTIONARY: DictionaryEntry[] = [
  { id: 'def-1', original: 'やる夫', translated: '야루오' },
  { id: 'def-2', original: 'やらない夫', translated: '야라나이오' },
  { id: 'def-3', original: 'できない子', translated: '데키나이코' },
  { id: 'def-4', original: 'できる夫', translated: '데키루오' },
  { id: 'def-5', original: 'できる子', translated: '데키루코' },
  { id: 'def-6', original: 'やらない子', translated: '야라나이코' },
  { id: 'def-7', original: 'きらない夫', translated: '키라나이오' },
  { id: 'def-8', original: 'ドクオ', translated: '도쿠오' },
  { id: 'def-9', original: '独男', translated: '도쿠오' },
  { id: 'def-10', original: 'ショボーン', translated: '쇼본' },
  { id: 'def-11', original: '荒巻スカルチノフ', translated: '아라마키 스칼치노프' },
  { id: 'def-12', original: 'モナー', translated: '모나' },
  { id: 'def-13', original: 'ギコ猫', translated: '기코네코' },
  { id: 'def-14', original: 'ギコ', translated: '기코' },
  { id: 'def-15', original: 'しぃ', translated: '시이' },
];

export const DEFAULT_SYSTEM_PROMPT = `You are a specialized translator for Japanese ASCII Art (AA) / Shift-JIS Art context.
Translate the text into natural, concise Korean suitable for internet communities.
Handle internet slang, onomatopoeia, and character dialogue appropriately.
Do not add filler text or explanations.`;

export const generateDictionaryPrompt = (
  customDict: DictionaryEntry[] = [],
  useDefault: boolean = true,
): string => {
  const terms = [
    ...(useDefault ? DEFAULT_DICTIONARY : []),
    ...customDict,
  ].map((entry) => `${entry.original} -> ${entry.translated}`);

  if (terms.length === 0) {
    return '';
  }

  return `\nTERMINOLOGY RULES (Apply strictly):\n${terms.join('\n')}\n`;
};
