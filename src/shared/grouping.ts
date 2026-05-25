import type { TextSegment } from '../../types.js';

export interface TranslationGroup {
  ids: string[];
  text: string;
}

const JAPANESE_SCRIPT = /[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
const SENTENCE_END = /[。！？!?」』）)]\s*$/;
const PARTICLE_OR_COPULA = /(です|ます|だ|だった|する|した|して|ない|ある|いる|から|けど|なら|ので|よ|ね|ぞ|ぜ|わ|を|に|が|は|で|と)/;

export const isMeaningfulJapaneseSentence = (text: string): boolean => {
  const normalized = text.replace(/\s+/g, '');
  if (normalized.length < 4 || !JAPANESE_SCRIPT.test(normalized)) {
    return false;
  }

  const jpChars = normalized.match(/[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) ?? [];
  if (jpChars.length < 3) {
    return false;
  }

  return SENTENCE_END.test(normalized) || PARTICLE_OR_COPULA.test(normalized);
};

export const groupSelectedJapaneseSentences = (segments: TextSegment[]): TranslationGroup[] => {
  const groups: TranslationGroup[] = [];
  let current: TranslationGroup | null = null;

  const flush = () => {
    if (current && isMeaningfulJapaneseSentence(current.text)) {
      groups.push(current);
    } else if (current) {
      for (const id of current.ids) {
        const segment = segments.find((item) => item.id === id);
        if (segment) {
          groups.push({ ids: [id], text: segment.text });
        }
      }
    }
    current = null;
  };

  for (const segment of segments) {
    if (!segment.isSelected || !segment.isJapanese || segment.text === '\n') {
      flush();
      continue;
    }

    const candidateText = current ? `${current.text}${segment.text}` : segment.text;
    if (current && !isMeaningfulJapaneseSentence(candidateText) && isMeaningfulJapaneseSentence(current.text)) {
      flush();
    }

    current = current
      ? { ids: [...current.ids, segment.id], text: `${current.text}${segment.text}` }
      : { ids: [segment.id], text: segment.text };

    if (isMeaningfulJapaneseSentence(current.text)) {
      flush();
    }
  }

  flush();
  return groups;
};
