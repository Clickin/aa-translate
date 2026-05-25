// Web Worker for text segmentation (runs off the main UI thread)
// All regex patterns and pure helper functions are duplicated here
// because Web Workers run in a separate context with no shared memory.

// --- Pre-compiled regex patterns ---
const RE_JAPANESE_CHAR = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/;
const RE_JAPANESE_CHARS_G = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g;
const RE_STRICT_JAPANESE = /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉''""\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワしー―つっぅ冖宀冂广廴廾彐彳忄扌氵犭纟艹辶阝丈乃亅卜匕个丫儿厂厶ヲ\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}|(?=[\s\S]*[ぁ-ん])(?=[\s\S]*[一-龯])(?:[\s\S]*[ぁ-ん一-龯]){3,}).+$/;
const RE_GAP = /([\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜＞＜\u2500-\u257F／＼\[\]｛｝［］★◆:.]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*)/;
const RE_SEPARATOR = /^[\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜＞＜\u2500-\u257F／＼\[\]｛｝［］★◆:.]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*$/;
const RE_WHITESPACE_GAP = /^[\s\u3000\u00A0\u2000-\u200B]{2,}$/;
const RE_BAR_END = /[|│┃｜＞＜／＼\[\]｛｝［］\u2500-\u257F★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x':.]$/;
const RE_BAR_START = /^[|│┃｜＞＜／＼\[\]｛｝［］\u2500-\u257F★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x':.]/;
const RE_BAR_CHAR = /[|│┃｜＞＜\u2500-\u257F／＼\[\]｛｝［］★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x':.]/;
// Directional arrow constraints for box detection: ＞ content ＜ is a valid box, ＜ content ＞ is not.
// Left border allows ＞ (points right/inward toward content), excludes ＜.
// Right border allows ＜ (points left/inward toward content), excludes ＞.
const RE_BOX_PIPE_CHAR_LEFT = /[|│┃｜＞\u2500-\u257F]/;
const RE_BOX_PIPE_CHAR_RIGHT = /[|│┃｜＜\u2500-\u257F]/;
const RE_ARROW_BOX_START = /[>＞|｜]/;
const RE_ARROW_BOX_END = /[<＜|｜]/;
const RE_EDGE_BLANK = /^[\s\u200B\u3000\u00A0\u2000-\u200B│┃|｜＞＜／＼\u2500-\u257F人从⌒YWV^‐―＝≡   ´｀ヽヾ乂ノﾚﾉ]*$/;
const RE_AUTO_SELECTED = /ﾀｯﾀｯﾀ/;

const RE_STRUCTURAL_REPEAT = /[二三壬]{2,}|[口ロ十]{3,}/;
const RE_REPEATED_STRUCTURAL_TEXT = /^(?:ﾆ|二|三|竺|Ｚ|Z|¨|￣|＿|_|=|＝|-|─|━|兀|乂|圭|ﾞ|ﾟ|[|│┃｜])+$/;
const RE_AA_STRUCTURAL_CHARS_G = /[ｱﾍﾆ二三ニ竺元弋寸ＺZ¨￣＿_=＝\-─━兀乂圭|│┃｜/／\\＼,，'’`´｀ﾞﾟ^＾⌒≦＜＞<>A-Za-z]/g;
const RE_AA_STROKE_CHARS_G = /[A-Za-z/／\\＼'’`´｀ヽヾ丶〆丿乂爻弋Vv]/g;
const RE_LINE_BORDERS = /[|│┃｜_＿￣─━\-\/／\\＼]{2,}/;
const RE_BOUNDARY_DRAWING = /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━][\s\u3000]*$/;
const RE_STANDARD_HIRAGANA = /[ぁ-ん]/;
const RE_GEGE_G = /[ゝゞ]/g;
const RE_DRAWING_MARKS = /[ヽヾ丶〆丿乂爻巛川]/;
const RE_AA_CHARS = /[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリル레와시アイウエオカ키쿠케코사시스세소타치츠테토나니누네노하히후헤호마미무메모야유요라릴레로완ー―つっぅヽヾ丶〆丿乂爻巛川芹云ゝゞ冖宀冂广廴廾彐彳忄扌氵犭纟艹辶阝丈乃亅卜匕个丫儿厂厶ヲ\uff65-\uff9fA-Za-z0-9Ａ-Ｚａ-ｚ０-９＿￣]/;
const RE_NON_JP_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g;
const RE_SYMBOLS_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e\s]/g;
const RE_HALFWIDTH_PUNCT = /[\uff61-\uff65]/;
const RE_THREAD_NAME = /^\s*\d+\s*[:：].*?(?:◆|ID[:：]\w|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
// Box border chars: horiz ─━ (U+2500-01), vert │┃ (U+2502-03), dashed (U+2504-05,2508-09), corners/intersections (U+250C-254D), double (U+2550,2552-2573), ASCII/fullwidth pipes (|｜)
const RE_BOX_HORIZONTAL_BORDER = /^[\s\u200B￣＿\u2500-\u2503\u2504\u2505\u2508\u2509\u250C-\u254D\u2550\u2552-\u2573\-|｜]*$/;
const RE_BOX_BORDER_ANY = /^[\s\u200B\u3000\u00A0\u2000-\u200B￣＿\-\u2500-\u257F｜|＞＜／＼人从⌒YWV^‐―＝≡   \[\]｛｝［］★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x'´｀ヽヾ乂ノﾚﾉ:.]*$/;
const RE_STRICT_BLANK = /^[\s\u3000\u00A0\u2000-\u200B]*$/;
// A real box border separator has 1 or more pipe/arrow/box chars with optional whitespace
const RE_HW_DAKUTEN = /[\uff9e\uff9f]/;
const RE_DISQUALIFIED = /[}｝]/;
const RE_VERTICAL_PIPES_G = /[|│┃｜]/g;
const RE_JAPANESE_SCRIPT = /[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
const RE_JAPANESE_SCRIPT_G = /[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g;
const RE_MEANINGFUL_JP = /[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
const RE_SPEAKER_LABEL = /^[\s\u3000]*[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf々〆ヵヶー・]{2,24}[：:][\s\u3000]*$/;
const RE_CASUAL_SENTENCE_END = /[。！？!?ｗw♪…」』）)]\s*$/;
const RE_JP_GRAMMAR_CUE = /(です|ます|だ|だった|じゃん|だし|けど|から|ので|って|こと|やっぱり|思った|する|した|して|ない|ある|いる|される|れる|られる|ろ|な|よ|ね|ぞ|ぜ|わ|を|に|が|は|で|と|の|も|か|へ)/;

// --- Display width helpers (full-width chars = 2 columns, half-width = 1) ---
const isFullWidthChar = (code: number): boolean => {
  return (
    (code >= 0x1100 && code <= 0x115F) ||
    (code >= 0x2010 && code <= 0x203B) ||
    (code >= 0x2100 && code <= 0x27BF) ||
    (code >= 0x2E80 && code <= 0x303E) ||
    (code >= 0x3041 && code <= 0x33BF) ||
    (code >= 0x3400 && code <= 0x4DBF) ||
    (code >= 0x4E00 && code <= 0x9FFF) ||
    (code >= 0xF900 && code <= 0xFAFF) ||
    (code >= 0xFE30 && code <= 0xFE6F) ||
    (code >= 0xFF01 && code <= 0xFF60) ||
    (code >= 0xFFE0 && code <= 0xFFE6)
  );
};

const getDisplayWidth = (str: string): number => {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    w += isFullWidthChar(str.charCodeAt(i)) ? 2 : 1;
  }
  return w;
};

// Extract substring covering display columns [dispStart, dispEnd)
const substringByDisplayCols = (line: string, dispStart: number, dispEnd: number): string => {
  let col = 0;
  let startIdx = -1;
  let endIdx = line.length;

  for (let i = 0; i < line.length; i++) {
    if (startIdx === -1 && col >= dispStart) {
      startIdx = i;
    }
    col += isFullWidthChar(line.charCodeAt(i)) ? 2 : 1;
    if (startIdx !== -1 && col >= dispEnd) {
      endIdx = i + 1;
      break;
    }
  }

  if (startIdx === -1) return '';
  return line.substring(startIdx, endIdx);
};

// --- Helper functions ---
const isVerticallyIsolatedAt = (lines: string[], lineIdx: number, colStart: number, colEnd: number, padding: number = 8): boolean => {
  // Convert string positions to display column positions
  const currentLine = lines[lineIdx];
  const dispStart = getDisplayWidth(currentLine.substring(0, colStart));
  const dispEnd = dispStart + getDisplayWidth(currentLine.substring(colStart, colEnd));

  const checkStart = Math.max(0, dispStart - padding);
  const checkEnd = dispEnd + padding;

  const isEmptyRange = (line: string | undefined, dStart: number, dEnd: number): boolean => {
    if (line === undefined) return true;
    const substr = substringByDisplayCols(line, dStart, dEnd);
    if (substr.length === 0) return true;
    return RE_STRICT_BLANK.test(substr);
  };

  const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
  const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;

  if (above === undefined && below === undefined) return false;

  return isEmptyRange(above, checkStart, checkEnd) && isEmptyRange(below, checkStart, checkEnd);
};

// Stricter isolation check used for the relaxed "all 4 sides blank" path.
// Uses wider padding (4 display columns each side) to avoid false positives on AA art fragments.
const isStrictlyIsolatedAt = (lines: string[], lineIdx: number, colStart: number, colEnd: number): boolean => {
  const currentLine = lines[lineIdx];
  const dispStart = getDisplayWidth(currentLine.substring(0, colStart));
  const dispEnd = dispStart + getDisplayWidth(currentLine.substring(colStart, colEnd));

  const padding = 4;
  const checkStart = Math.max(0, dispStart - padding);
  const checkEnd = dispEnd + padding;

  const isEmptyRange = (line: string | undefined, dStart: number, dEnd: number): boolean => {
    if (line === undefined) return true;
    const substr = substringByDisplayCols(line, dStart, dEnd);
    if (substr.length === 0) return true;
    return RE_STRICT_BLANK.test(substr);
  };

  const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
  const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;

  // Require at least one neighbor to exist
  if (above === undefined && below === undefined) return false;

  // Both above AND below must be blank (stricter than normal isolation)
  return isEmptyRange(above, checkStart, checkEnd) && isEmptyRange(below, checkStart, checkEnd);
};

const hasBoxBorderOrBlankNearby = (lines: string[], lineIdx: number, colStart: number, colEnd: number): boolean => {
  // Convert string positions to display column positions
  const currentLine = lines[lineIdx];
  const dispStart = getDisplayWidth(currentLine.substring(0, colStart));
  const dispEnd = dispStart + getDisplayWidth(currentLine.substring(colStart, colEnd));

  const checkStart = Math.max(0, dispStart - 1);
  const checkEnd = dispEnd + 1;

  const matchesBoxBorder = (line: string | undefined, dStart: number, dEnd: number): boolean => {
    if (line === undefined) return true;
    const substr = substringByDisplayCols(line, dStart, dEnd);
    if (substr.length === 0) return true;
    return RE_BOX_BORDER_ANY.test(substr);
  };

  const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
  const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;

  if (above === undefined && below === undefined) return false;

  const aboveOk = matchesBoxBorder(above, checkStart, checkEnd);
  const belowOk = matchesBoxBorder(below, checkStart, checkEnd);
  return aboveOk && belowOk;
};

// Check if vertical context (above/below) is "safe" for auto-selection.
// A text block is safe if the area above AND below (within column range ± padding)
// contains blank space, horizontal box borders (＿￣─━-), or normal continuous Japanese text.
// Text blocks embedded in AA art (where above/below is drawing content) are excluded.
const hasSafeVerticalContext = (lines: string[], lineIdx: number, colStart: number, colEnd: number, padding: number = 3): boolean => {
  const currentLine = lines[lineIdx];
  const dispStart = getDisplayWidth(currentLine.substring(0, colStart));
  const dispEnd = dispStart + getDisplayWidth(currentLine.substring(colStart, colEnd));

  const checkStart = Math.max(0, dispStart - padding);
  const checkEnd = dispEnd + padding;

  const isSafeRange = (line: string | undefined, dStart: number, dEnd: number): boolean => {
    if (line === undefined) return true;
    const substr = substringByDisplayCols(line, dStart, dEnd);
    if (substr.length === 0) return true;
    // 1. Blank/whitespace
    if (RE_STRICT_BLANK.test(substr)) return true;
    // 2. Box border characters (horizontal ─━, vertical │┃, pipes |｜, corners, etc.)
    if (RE_BOX_HORIZONTAL_BORDER.test(substr)) return true;
    // 3. Box border/decoration characters (pipes, corners, decorations like ﾚﾉ)
    if (RE_BOX_BORDER_ANY.test(substr)) return true;
    // 4. Normal Japanese text (not AA art/drawing) = continuous text
    if (hasJapaneseChar(substr) && !isDrawing(substr)) return true;
    return false;
  };

  const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
  const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;

  return (above === undefined || isSafeRange(above, checkStart, checkEnd)) && (below === undefined || isSafeRange(below, checkStart, checkEnd));
};

const hasJapaneseChar = (text: string) => RE_JAPANESE_CHAR.test(text);
const isStrictJapaneseText = (text: string) => RE_STRICT_JAPANESE.test(text);

export const isStructuralAaFragmentText = (text: string): boolean => {
  const normalized = text.replace(/[\s\u3000\u00A0\u2000-\u200B]+/g, '');
  if (!normalized) {
    return false;
  }

  if (RE_SPEAKER_LABEL.test(normalized)) {
    return false;
  }

  if (RE_REPEATED_STRUCTURAL_TEXT.test(normalized)) {
    return true;
  }

  const scriptChars = normalized.match(RE_JAPANESE_SCRIPT_G) || [];
  if (scriptChars.length === 0) {
    return false;
  }

  const strokeChars = normalized.match(RE_AA_STROKE_CHARS_G) || [];
  const hasStrokeDominatedShape = normalized.length >= 4 && strokeChars.length / normalized.length >= 0.45;

  const hiragana = normalized.match(/[ぁ-ん]/g) || [];
  if (hiragana.length > 0 && !hasStrokeDominatedShape) {
    return false;
  }

  const structuralChars = normalized.match(RE_AA_STRUCTURAL_CHARS_G) || [];
  return (
    (normalized.length <= 4 && structuralChars.length >= normalized.length - 1) ||
    (normalized.length >= 4 && structuralChars.length / normalized.length >= 0.7)
  );
};

export const isNaturalJapaneseAutoSelectText = (text: string): boolean => {
  const normalized = text.trim();
  if (!normalized || RE_DISQUALIFIED.test(normalized) || RE_THREAD_NAME.test(normalized)) {
    return false;
  }

  const scriptChars = normalized.match(RE_JAPANESE_SCRIPT_G) || [];
  if (scriptChars.length === 0) {
    return false;
  }

  if (RE_SPEAKER_LABEL.test(normalized)) {
    return true;
  }

  if (scriptChars.length < 2) {
    return false;
  }

  if (RE_CASUAL_SENTENCE_END.test(normalized)) {
    return true;
  }

  return scriptChars.length >= 5 && RE_JP_GRAMMAR_CUE.test(normalized);
};

const RE_AA_EFFECTS = /．・｀ｰ"|｀ｰ"/;

const isDrawing = (text: string) => {
  if (isStructuralAaFragmentText(text)) return true;
  if (RE_STRUCTURAL_REPEAT.test(text)) return true;
  if (RE_LINE_BORDERS.test(text)) return true;
  if (RE_AA_EFFECTS.test(text)) return true;

  const hasBoundaryDrawingLines = RE_BOUNDARY_DRAWING.test(text);
  const hasStdHiragana = RE_STANDARD_HIRAGANA.test(text.replace(RE_GEGE_G, ''));
  if (hasBoundaryDrawingLines && !hasStdHiragana) return true;

  const jpChars = text.match(RE_JAPANESE_CHARS_G) || [];
  const symbols = text.match(RE_SYMBOLS_G) || [];

  // If symbols significantly outnumber Japanese characters, it's likely a drawing
  if (jpChars.length > 0 && symbols.length > jpChars.length * 1.5) return true;

  if (jpChars.length > 0 && jpChars.every(c => RE_DRAWING_MARKS.test(c))) return true;

  // Aggressively reject single-character AA fragments (like 'j', 'i', 'v' in drawings)
  if (jpChars.length === 1 && RE_AA_CHARS.test(jpChars[0]) && text.length <= 3) return true;

  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => RE_AA_CHARS.test(c));
  if (isAllAAChars) {
    const spacesAndSymbols = text.match(RE_NON_JP_G) || [];
    if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
    if (RE_HALFWIDTH_PUNCT.test(text)) return true;
    if (jpChars.some(c => RE_DRAWING_MARKS.test(c))) return true;
  }

  // Ratio-based check: if AA chars dominate (≥50%) and enough total, likely drawing
  // 50% threshold catches borderline cases where roughly half the chars are AA structural chars
  // Exclude fullwidth digits (０-９) from AA count since they commonly appear in status tables / normal text
  if (jpChars.length >= 3) {
    const aaCount = jpChars.filter(c => RE_AA_CHARS.test(c) && !/[\uff10-\uff19]/.test(c)).length;
    if (aaCount / jpChars.length >= 0.5 && !RE_HW_DAKUTEN.test(text)) return true;
  }

  return false;
};

// --- Segment interface (plain object, no imports needed) ---
interface WorkerTextSegment {
  id: string;
  text: string;
  original: string;
  isJapanese: boolean;
  isStrictJapanese?: boolean;
  isAutoSelected?: boolean;
  isBoxedDialogue?: boolean;
  isContextDialogue?: boolean;
  isArrowBox?: boolean;
  isVerticalBox?: boolean;
  isIndentedDialogue?: boolean;
  isIsolatedDialogue?: boolean;
  isSelected: boolean;
  isTranslated: boolean;
}

export const isSmartSelectCandidate = (segment: {
  isStrictJapanese?: boolean;
  isAutoSelected?: boolean;
  isBoxedDialogue?: boolean;
  isContextDialogue?: boolean;
  isArrowBox?: boolean;
  isVerticalBox?: boolean;
  isIndentedDialogue?: boolean;
  isIsolatedDialogue?: boolean;
}): boolean => {
  return Boolean(
    segment.isStrictJapanese ||
    segment.isAutoSelected ||
    segment.isBoxedDialogue ||
    segment.isContextDialogue ||
    segment.isArrowBox ||
    segment.isVerticalBox ||
    segment.isIndentedDialogue ||
    segment.isIsolatedDialogue
  );
};

// --- Main segmentation function ---
export function segmentContentForTest(content: string): WorkerTextSegment[] {
  const lines = content.split('\n');
  const newSegments: WorkerTextSegment[] = [];

  lines.forEach((line, lineIdx) => {
    // --- Fast path: skip per-part processing for lines with no Japanese and no auto-select keywords ---
    if (!hasJapaneseChar(line) && !RE_AUTO_SELECTED.test(line)) {
      if (line.length > 0) {
        newSegments.push({
          id: `seg-${lineIdx}-0`,
          text: line,
          original: line,
          isJapanese: false,
          isSelected: false,
          isTranslated: false
        });
      }
      newSegments.push({
        id: `seg-${lineIdx}-newline`,
        text: '\n',
        original: '\n',
        isJapanese: false,
        isSelected: false,
        isTranslated: false
      });
      return;
    }

    const isThreadNameLine = RE_THREAD_NAME.test(line);

    const parts = line.split(RE_GAP);
    let currentOffset = 0;

    parts.forEach((part, partIdx) => {
      if (part === "") return;

      const isSeparator = RE_SEPARATOR.test(part);
      const isJp = !isSeparator && hasJapaneseChar(part);

      const hasLeadingLargeGap = partIdx > 0 && RE_WHITESPACE_GAP.test(parts[partIdx-1]);
      const isAtStartWithGap = partIdx === 0 && line.startsWith('  ');
      const isIsolatedByGap = hasLeadingLargeGap || isAtStartWithGap;

      const isTouchingBarLeft = partIdx > 0 && RE_BAR_END.test(parts[partIdx-1]);
      const isTouchingBarRight = partIdx < parts.length - 1 && RE_BAR_START.test(parts[partIdx+1]);
      const isTouchingBar = isTouchingBarLeft || isTouchingBarRight;

      const jpCharsMatch = part.match(RE_JAPANESE_CHARS_G) || [];
      const uniqueJpChars = new Set(jpCharsMatch);

      const hasNoAAChars = jpCharsMatch.length > 0 && jpCharsMatch.every(c => !RE_AA_CHARS.test(c));

      const requiredDistinctChars = hasNoAAChars ? 1 : (isIsolatedByGap ? 2 : 3);
      const hasEnoughDistinctJpChars = uniqueJpChars.size >= requiredDistinctChars;

      // If line above is a thread name header, relax vertical isolation (only check below)
      const isAboveThreadName = lineIdx > 0 && RE_THREAD_NAME.test(lines[lineIdx - 1]);

      // --- Lazy computation: expensive functions computed only when needed ---
      let _isDrawingCached: boolean | undefined;
      const getIsDrawing = (): boolean => {
        if (_isDrawingCached === undefined) _isDrawingCached = isDrawing(part);
        return _isDrawingCached;
      };

      let _isVertIsolated: boolean | undefined;
      const getVertIsolated = (): boolean => {
        if (_isVertIsolated === undefined) _isVertIsolated = isVerticallyIsolatedAt(lines, lineIdx, currentOffset, currentOffset + part.length);
        return _isVertIsolated;
      };

      let _isStrictlyIsolated: boolean | undefined;
      const getStrictlyIsolated = (): boolean => {
        if (_isStrictlyIsolated === undefined) _isStrictlyIsolated = isStrictlyIsolatedAt(lines, lineIdx, currentOffset, currentOffset + part.length);
        return _isStrictlyIsolated;
      };

      // Find the closest borders specifically around this part
      let leftBorderIdx = -1;
      for (let i = currentOffset - 1; i >= 0; i--) {
        if (RE_BAR_CHAR.test(line[i])) {
          leftBorderIdx = i;
          break;
        }
      }
      let rightBorderIdx = -1;
      for (let i = currentOffset + part.length; i < line.length; i++) {
        if (RE_BAR_CHAR.test(line[i])) {
          rightBorderIdx = i;
          break;
        }
      }

      // Box isolation check: borders must be surrounded by whitespace on their outer side
      const isLeftBorderStrictlyClean = leftBorderIdx === -1 || 
                                        leftBorderIdx === 0 || 
                                        RE_STRICT_BLANK.test(line[leftBorderIdx - 1]);
      const isRightBorderStrictlyClean = rightBorderIdx === -1 || 
                                         rightBorderIdx === line.length - 1 || 
                                         RE_STRICT_BLANK.test(line[rightBorderIdx + 1]);

      const isLeftBorderClean = leftBorderIdx === -1 || 
                                leftBorderIdx === 0 || 
                                RE_STRICT_BLANK.test(line[leftBorderIdx - 1]) ||
                                RE_BAR_CHAR.test(line[leftBorderIdx - 1]);
      const isRightBorderClean = rightBorderIdx === -1 || 
                                 rightBorderIdx === line.length - 1 || 
                                 RE_STRICT_BLANK.test(line[rightBorderIdx + 1]) ||
                                 RE_BAR_CHAR.test(line[rightBorderIdx + 1]);
      const isBoxIsolated = isLeftBorderClean && isRightBorderClean;

      let _hasCleanBoxCtx: boolean | undefined;
      const getCleanBoxCtx = (): boolean => {
        if (_hasCleanBoxCtx === undefined) {
          const prevLine = lineIdx > 0 ? lines[lineIdx - 1] : "";
          const nextLine = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : "";
          
          // 1. Check for immediate horizontal border lines (top/bottom of a box)
          const isTopOrBottom = RE_BOX_BORDER_ANY.test(prevLine) || RE_BOX_BORDER_ANY.test(nextLine);
          
          // 2. Check for vertical continuity: neighbors have borders at the same positions (with tolerance)
          const checkBorder = (l: string, idx: number) => {
            if (!l || idx === -1) return false;
            for (let i = idx - 1; i <= idx + 1; i++) {
              if (i >= 0 && i < l.length && RE_BAR_CHAR.test(l[i])) return true;
            }
            return false;
          };
          
          const hasUpperBorder = checkBorder(prevLine, leftBorderIdx) || checkBorder(prevLine, rightBorderIdx);
          const hasLowerBorder = checkBorder(nextLine, leftBorderIdx) || checkBorder(nextLine, rightBorderIdx);
                                 
          _hasCleanBoxCtx = isTopOrBottom || (hasUpperBorder && hasLowerBorder);
        }
        return _hasCleanBoxCtx;
      };

      // For left-border-only detection, require the border to be an actual box pipe (│┃|｜＞ or box drawing),
      // not just any bar-like char (★ etc.) which commonly appear in AA art.
      // Arrow direction: ＞ is valid only as left border (points inward), ＜ only as right border.
      const leftBorderIsBoxPipe = leftBorderIdx !== -1 && RE_BOX_PIPE_CHAR_LEFT.test(line[leftBorderIdx]);
      const rightBorderIsBoxPipe = rightBorderIdx !== -1 && RE_BOX_PIPE_CHAR_RIGHT.test(line[rightBorderIdx]);
      const hasBothBordersWithPipe = (leftBorderIsBoxPipe || rightBorderIsBoxPipe) && leftBorderIdx !== -1 && rightBorderIdx !== -1;
      // Guard: lines with many vertical pipe characters are AA art structures, not real dialogue boxes
      // Real boxes have 2-3 pipes (left border, right border, maybe divider); AA art has many more
      const verticalPipesInLine = (line.match(RE_VERTICAL_PIPES_G) || []).length;
      const isAAStructureLine = verticalPipesInLine > 4;
      const isInsideBox = !isAAStructureLine && isBoxIsolated && (hasBothBordersWithPipe || (leftBorderIsBoxPipe && getCleanBoxCtx()));

      let _hasVertBoxCtx: boolean | undefined;
      const getVertBoxCtx = (): boolean => {
        if (_hasVertBoxCtx === undefined) _hasVertBoxCtx = hasBoxBorderOrBlankNearby(lines, lineIdx, currentOffset, currentOffset + part.length);
        return _hasVertBoxCtx;
      };

      let _hasSafeVertCtx: boolean | undefined;
      const getSafeVertCtx = (): boolean => {
        if (_hasSafeVertCtx === undefined) _hasSafeVertCtx = hasSafeVerticalContext(lines, lineIdx, currentOffset, currentOffset + part.length);
        return _hasSafeVertCtx;
      };

      // isAllSidesBlank: uses stricter isolation (wider padding) to avoid false positives on AA art fragments
      const isAllSidesBlank = isJp && RE_STRICT_BLANK.test(line.substring(0, currentOffset)) && RE_STRICT_BLANK.test(line.substring(currentOffset + part.length)) && getStrictlyIsolated();

      // Guard: when all sides are blank but text is entirely AA chars and short (≤6), it's likely an AA art fragment
      // Threshold of 6 covers most AA fragments while preserving legitimate short sound effects
      const isAllAAOnly = jpCharsMatch.length > 0 && jpCharsMatch.every(c => RE_AA_CHARS.test(c));
      // Guard: segments with no real Japanese script content are never selectable in any path
      // Real Japanese = hiragana, katakana (\u30a0-\u30ff), kanji (\u4e00-\u9faf) — not just fullwidth ASCII (\uff01-\uff5e)
      // Blocks: single AA art chars (人,ノ), fullwidth punctuation only (（）), special chars
      // Allows: hiragana (お,え〜), katakana sound effects, kanji text
      const hasHiragana = RE_STANDARD_HIRAGANA.test(part);
      const isNeverSelectable = RE_DISQUALIFIED.test(part) || !RE_MEANINGFUL_JP.test(part) || isStructuralAaFragmentText(part) || (!hasHiragana && isAllAAOnly && jpCharsMatch.length <= 1);
      const isAllSidesBlankQualified = isAllSidesBlank && !isNeverSelectable;

      // Relaxed path first (isAllSidesBlank already computed) to short-circuit the expensive strict regex
      // When all 4 sides are blank (isAllSidesBlankQualified), skip isDrawing: truly isolated text is likely a sound effect / annotation
      const isStrict = !isThreadNameLine && !isNeverSelectable && isJp && hasEnoughDistinctJpChars && (!isTouchingBar || hasNoAAChars) && (
        isAllSidesBlankQualified || (getSafeVertCtx() && !getIsDrawing() && isStrictJapaneseText(part) && (isAboveThreadName || getVertIsolated()))
      );

      // Edge position: outer sides of the segment contain only whitespace/border chars
      const isAtLeftEdge = RE_EDGE_BLANK.test(line.substring(0, currentOffset));
      const isAtRightEdge = RE_EDGE_BLANK.test(line.substring(currentOffset + part.length));
      const isEdgePositioned = isAtLeftEdge || isAtRightEdge;

      const leftPart = partIdx > 0 ? parts[partIdx - 1] : "";
      const rightPart = partIdx < parts.length - 1 ? parts[partIdx + 1] : "";

      const hasCleanOuterEdge = (leftPart && (RE_SEPARATOR.test(leftPart) || RE_STRICT_BLANK.test(leftPart))) &&
                                (rightPart && (RE_SEPARATOR.test(rightPart) || RE_STRICT_BLANK.test(rightPart)));
      
      const isLongJp = jpCharsMatch.length >= 5;
      
      // Guard: reject text where non-JP symbols outnumber or equal JP chars (likely AA art fragments like ".!丈zﾘ")
      const symbolCount = (part.match(RE_SYMBOLS_G) || []).filter(c => !/[0-9]/.test(c)).length;
      const hasExcessiveSymbols = symbolCount >= jpCharsMatch.length && jpCharsMatch.length > 0;
      
      // Guard: single AA-char segments with only a left border are likely AA art decoration, not dialogue
      const isLeftBorderOnlySingleAA = !hasBothBordersWithPipe && isAllAAOnly && jpCharsMatch.length <= 1;
      // Guard: short (≤2 chars) AA-only segments classified as drawing are AA art fragments, not dialogue
      // Exception: pure fullwidth digits (０-９) which are legitimate data values in boxes/tables
      const isShortDrawingAA = isAllAAOnly && jpCharsMatch.length <= 2 && getIsDrawing() && !jpCharsMatch.every(c => /[\uff10-\uff19]/.test(c));
      // Guard: segments composed entirely of fullwidth structural/border chars (＿ ＝) are never dialogue
      const isAllStructuralBorder = jpCharsMatch.length > 0 && jpCharsMatch.every(c => /[＿＝]/.test(c));

      const isBoxedDialogue = !isThreadNameLine && !isNeverSelectable && isInsideBox && isJp && !hasExcessiveSymbols && !isAllStructuralBorder && getSafeVertCtx() && isStrictJapaneseText(part) && (
        (getCleanBoxCtx() && !isLeftBorderOnlySingleAA && !isShortDrawingAA) || 
        (!getIsDrawing() && (
          isLongJp || 
          hasCleanOuterEdge ||
          (isEdgePositioned && (hasNoAAChars || uniqueJpChars.size >= 3)) ||
          (isTouchingBar && (uniqueJpChars.size >= 3 || hasNoAAChars))
        ))
      );

      const isNaturalJapaneseAutoSelected = !isThreadNameLine &&
                                            !isNeverSelectable &&
                                            isJp &&
                                            !isTouchingBar &&
                                            !hasExcessiveSymbols &&
                                            isNaturalJapaneseAutoSelectText(part) &&
                                            (RE_SPEAKER_LABEL.test(part.trim()) || !getIsDrawing());
      const isAutoSelected = RE_AUTO_SELECTED.test(part) || isNaturalJapaneseAutoSelected;

      const hasSomeNonAAChars = jpCharsMatch.some(c => !RE_AA_CHARS.test(c));
      const hasHwDakuten = RE_HW_DAKUTEN.test(part);

      const kanaMatch = part.match(/[ぁ-んァ-ン\uff66-\uff9f]/g) || [];
      const uniqueKanaCount = new Set(kanaMatch).size;

      const isArrowBox = !RE_DISQUALIFIED.test(part) &&
                         hasJapaneseChar(part) &&
                         // Support vertical writing: allow shorter parts if they are clearly inside an arrow box
                         (part.length >= 3 ? uniqueKanaCount >= 2 : true) &&
                         isLeftBorderStrictlyClean && isRightBorderStrictlyClean &&
                         getSafeVertCtx() && (getVertIsolated() || !getIsDrawing()) &&
                         (
                           ((leftBorderIdx !== -1 && RE_ARROW_BOX_START.test(line[leftBorderIdx])) &&
                            (rightBorderIdx !== -1 && RE_ARROW_BOX_END.test(line[rightBorderIdx]))) ||
                           ((leftBorderIdx !== -1 && line[leftBorderIdx] === ':') &&
                            (rightBorderIdx !== -1 && (line[rightBorderIdx] === ':' || line[rightBorderIdx] === '.')))
                         ) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009:.]*$/.test(line.substring(leftBorderIdx + 1, currentOffset)) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009:.]*$/.test(line.substring(currentOffset + part.length, rightBorderIdx)) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009:.]*$/.test(line.substring(rightBorderIdx + 1));

      const isVerticalBox = !RE_DISQUALIFIED.test(part) &&
                         RE_JAPANESE_SCRIPT.test(part) &&
                         leftBorderIdx !== -1 && rightBorderIdx !== -1 &&
                         (
                           ((line[leftBorderIdx] === '|' || line[leftBorderIdx] === '｜') && (line[rightBorderIdx] === '|' || line[rightBorderIdx] === '｜')) ||
                           ((line[leftBorderIdx] === '>' || line[leftBorderIdx] === '＞') && (line[rightBorderIdx] === '<' || line[rightBorderIdx] === '＜'))
                         ) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009]*$/.test(line.substring(leftBorderIdx + 1, currentOffset)) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009]*$/.test(line.substring(currentOffset + part.length, rightBorderIdx)) &&
                         (() => {
                           const prevLine = lineIdx > 0 ? lines[lineIdx - 1] : "";
                           const nextLine = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : "";
                           const checkBorder = (l: string, idx: number, char: string) => {
                             if (!l || idx === -1) return false;
                             const isPipe = char === '|' || char === '｜';
                             const isArrowLeft = char === '>' || char === '＞';
                             const isArrowRight = char === '<' || char === '＜';
                             
                             for (let i = idx - 1; i <= idx + 1; i++) {
                               if (i >= 0 && i < l.length) {
                                 const c = l[i];
                                 if (isPipe && (c === '|' || c === '｜' || c === '│' || c === '┃')) return true;
                                 if (isArrowLeft && (c === '>' || c === '＞')) return true;
                                 if (isArrowRight && (c === '<' || c === '＜')) return true;
                               }
                             }
                             return false;
                           };
                           const leftChar = line[leftBorderIdx];
                           const rightChar = line[rightBorderIdx];
                           const hasUpper = checkBorder(prevLine, leftBorderIdx, leftChar) && checkBorder(prevLine, rightBorderIdx, rightChar);
                           const hasLower = checkBorder(nextLine, leftBorderIdx, leftChar) && checkBorder(nextLine, rightBorderIdx, rightChar);
                           return hasUpper || hasLower;
                         })();

      const leftContent = line.substring(0, currentOffset);
      const trailingSpacesMatch = leftContent.match(/[\s\u3000\u00A0\u2000-\u200B]+$/);
      const trailingSpaces = trailingSpacesMatch ? trailingSpacesMatch[0] : "";

      const hiraganaMatch = part.match(/[ぁ-ん]/g) || [];
      const uniqueHiraganaCount = new Set(hiraganaMatch).size;

      const isIndentedDialogue = !RE_DISQUALIFIED.test(part) &&
                                 hasJapaneseChar(part) && !getIsDrawing() &&
                                 part.length >= 5 && uniqueHiraganaCount >= 2 &&
                                 getDisplayWidth(trailingSpaces) >= 6 &&
                                 RE_STRICT_BLANK.test(line.substring(currentOffset + part.length));

      const rightContent = line.substring(currentOffset + part.length);

      const isIsolatedDialogue = !RE_DISQUALIFIED.test(part) &&
                                 /[ぁ-んァ-ン\uff66-\uff9f]/.test(part) &&
                                 (!getIsDrawing() || !isDrawing(part)) &&
                                 getDisplayWidth(trailingSpaces) >= 2 &&
                                 RE_STRICT_BLANK.test(rightContent) &&
                                 (getVertIsolated() || (getDisplayWidth(trailingSpaces) >= 4 && isVerticallyIsolatedAt(lines, lineIdx, currentOffset, currentOffset + part.length, 4)));

      const isContextDlg = !isThreadNameLine && !isNeverSelectable && !isStrict && !isBoxedDialogue && isJp && !getIsDrawing()
        && !isTouchingBar
        && (hasNoAAChars || (hasSomeNonAAChars && uniqueJpChars.size >= 2) || hasHwDakuten)
        // Horizontal check: at edge of line OR near vertical box context (lenient, one side enough)
        && (isEdgePositioned || getVertBoxCtx())
        // Vertical check: BOTH above AND below must be blank at the segment's position
        && getVertIsolated()
        // Additional check: If not strict Japanese, BOTH lines above AND below should be entirely blank
        // to avoid selecting segments embedded in dense AA art blocks.
        && (RE_STRICT_BLANK.test(lineIdx > 0 ? lines[lineIdx - 1] : "") && RE_STRICT_BLANK.test(lineIdx < lines.length - 1 ? lines[lineIdx + 1] : ""))
        // Reject if surrounded by drawings on both sides
        && !(lineIdx > 0 && lineIdx < lines.length - 1 && isDrawing(lines[lineIdx - 1]) && isDrawing(lines[lineIdx + 1]));

      const isSmartCandidate =
        !isNeverSelectable &&
        (isStrict ||
          isAutoSelected ||
          isBoxedDialogue ||
          isContextDlg ||
          isArrowBox ||
          isVerticalBox ||
          isIndentedDialogue ||
          isIsolatedDialogue);

      const isManuallySelectableJapanese = !isThreadNameLine && !isNeverSelectable && isJp;

      const isJapanese = isSmartCandidate || isManuallySelectableJapanese;

      newSegments.push({
        id: `seg-${lineIdx}-${currentOffset}`,
        text: part,
        original: part,
        isJapanese,
        isStrictJapanese: isStrict,
        isAutoSelected: isAutoSelected,
        isBoxedDialogue: isBoxedDialogue,
        isContextDialogue: isContextDlg,
        isArrowBox: isArrowBox,
        isVerticalBox: isVerticalBox,
        isIndentedDialogue: isIndentedDialogue,
        isIsolatedDialogue: isIsolatedDialogue,
        isSelected: false,
        isTranslated: false
      });

      currentOffset += part.length;
    });

    newSegments.push({
      id: `seg-${lineIdx}-newline`,
      text: '\n',
      original: '\n',
      isJapanese: false,
      isSelected: false,
      isTranslated: false
    });
  });

  // Remove trailing newline segment (matches original behavior)
  const result = newSegments.slice(0, -1);

  // Merge consecutive non-interactive segments to reduce DOM node count.
  // Only non-Japanese, non-newline segments are merged; Japanese segments
  // and newlines remain individually addressable for selection and line structure.
  const merged: WorkerTextSegment[] = [];
  for (const seg of result) {
    if (!seg.isJapanese && seg.text !== '\n') {
      const prev = merged[merged.length - 1];
      if (prev && !prev.isJapanese && prev.text !== '\n') {
        prev.text += seg.text;
        prev.original += seg.original;
        continue;
      }
    }
    merged.push(seg);
  }

  return merged;
}

function segmentContent(content: string, requestId: number): void {
  self.postMessage({ type: 'result', requestId, segments: segmentContentForTest(content) });
}

// --- Message handler ---
if (typeof self !== 'undefined') {
  self.onmessage = (e: MessageEvent<{ type: string; content: string; requestId: number }>) => {
    if (e.data.type === 'segment') {
      segmentContent(e.data.content, e.data.requestId);
    }
  };
}
