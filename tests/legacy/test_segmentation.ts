const RE_JAPANESE_CHAR = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/;
const RE_JAPANESE_CHARS_G = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g;
const RE_STRICT_JAPANESE = /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉''""\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワしアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワンー―つっぅ冖宀冂广廴廾彐彳忄扌氵犭纟艹辶阝丈乃亅卜匕个丫儿厂厶ヲ\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}|(?=[\s\S]*[ぁ-ん])(?=[\s\S]*[一-龯])(?:[\s\S]*[ぁ-ん一-龯]){3,}).+$/;
const RE_GAP = /([\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜＞＜\u2500-\u257F／＼\/\\\[\]｛｝［］★◆]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*)/;
const RE_SEPARATOR = /^[\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜＞＜\u2500-\u257F／＼\/\\\[\]｛｝［］★◆]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*$/;
const RE_WHITESPACE_GAP = /^[\s\u3000\u00A0\u2000-\u200B]{2,}$/;
const RE_BAR_END = /[|│┃｜＞＜／＼\/\\\[\]｛｝［］\u2500-\u257F★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x']$/;
const RE_BAR_START = /^[|│┃｜＞＜／＼\/\\\[\]｛｝［］\u2500-\u257F★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x']/;
const RE_BAR_CHAR = /[|│┃｜＞＜\u2500-\u257F／＼\/\\\[\]｛｝［］★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x']/;
const RE_BOX_PIPE_CHAR_LEFT = /[|│┃｜＞\u2500-\u257F\/\\／＼]/;
const RE_BOX_PIPE_CHAR_RIGHT = /[|│┃｜＜\u2500-\u257F\/\\／＼]/;
const RE_STRICT_BLANK = /^[\s\u3000\u00A0\u2000-\u200B]*$/;
const RE_BOX_BORDER_ANY = /^[\s\u200B\u3000\u00A0\u2000-\u200B￣＿\-\u2500-\u257F｜|＞＜／＼\/\\人从⌒YWV^‐―＝≡   \[\]｛｝［］★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x'´｀ヽヾ乂ノﾚﾉ]*$/;
const RE_VERTICAL_PIPES_G = /[|│┃｜]/g;
const RE_AA_CHARS = /[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワしアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワンー―つっぅ冖宀冂广廴廾彐彳忄扌氵犭纟艹辶阝丈乃亅卜匕个丫儿厂厶ヲ\uff66-\uff9fA-Za-z0-9Ａ-Ｚａ-ｚ０-９]/;
const RE_SYMBOLS_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e\s]/g;
const RE_MEANINGFUL_JP = /[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
const RE_STANDARD_HIRAGANA = /[ぁ-ん]/;

const isFullWidthChar = (code: number): boolean => {
  return (
    (code >= 0x1100 && code <= 0x115F) ||
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

  if (startIdx === -1) return "";
  return line.substring(startIdx, endIdx);
};

const lines = [
  "＼人_从人人_从人人_从人人_从人人_／",
  "＞　　　　　　　　　　　　　　　　　＜",
  "＞　　神の復活を招いた魔導国を許すなーーっ！！　　  ＜",
  "＞　　　　　　　　　　　　　　　　　＜",
  "／YWY YWY YWY YWY YWY YWY ＼"
];

const lineIdx = 2;
const line = lines[lineIdx];
const parts = line.split(RE_GAP);

let currentOffset = 0;
parts.forEach((part, partIdx) => {
  if (part === "") return;
  const isSeparator = RE_SEPARATOR.test(part);
  if (isSeparator) {
    currentOffset += part.length;
    return;
  }

  console.log("Part:", part);
  
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

  console.log("leftBorderIdx:", leftBorderIdx, "char:", line[leftBorderIdx]);
  console.log("rightBorderIdx:", rightBorderIdx, "char:", line[rightBorderIdx]);

  const isLeftBorderClean = leftBorderIdx === -1 || 
                            leftBorderIdx === 0 || 
                            RE_STRICT_BLANK.test(line[leftBorderIdx - 1]) ||
                            RE_BAR_CHAR.test(line[leftBorderIdx - 1]);
  const isRightBorderClean = rightBorderIdx === -1 || 
                             rightBorderIdx === line.length - 1 || 
                             RE_STRICT_BLANK.test(line[rightBorderIdx + 1]) ||
                             RE_BAR_CHAR.test(line[rightBorderIdx + 1]);
  const isBoxIsolated = isLeftBorderClean && isRightBorderClean;
  console.log("isBoxIsolated:", isBoxIsolated);

  const leftBorderIsBoxPipe = leftBorderIdx !== -1 && RE_BOX_PIPE_CHAR_LEFT.test(line[leftBorderIdx]);
  const rightBorderIsBoxPipe = rightBorderIdx !== -1 && RE_BOX_PIPE_CHAR_RIGHT.test(line[rightBorderIdx]);
  const hasBothBordersWithPipe = (leftBorderIsBoxPipe || rightBorderIsBoxPipe) && leftBorderIdx !== -1 && rightBorderIdx !== -1;
  console.log("hasBothBordersWithPipe:", hasBothBordersWithPipe);

  const isBorderOrBlankSegment = (l: string, start: number, end: number) => {
    if (!l || start === -1 || end === -1) return false;
    const dispStart = getDisplayWidth(line.substring(0, start));
    const dispEnd = dispStart + getDisplayWidth(line.substring(start, end + 1));
    const substr = substringByDisplayCols(l, dispStart, dispEnd);
    return RE_BOX_BORDER_ANY.test(substr) || RE_STRICT_BLANK.test(substr);
  };

  const prevLine = lines[lineIdx - 1];
  const nextLine = lines[lineIdx + 1];
  const isTopOrBottom = isBorderOrBlankSegment(prevLine, leftBorderIdx, rightBorderIdx) || 
                        isBorderOrBlankSegment(nextLine, leftBorderIdx, rightBorderIdx);
  console.log("getCleanBoxCtx (isTopOrBottom):", isTopOrBottom);

  const isInsideBox = isBoxIsolated && (hasBothBordersWithPipe || (leftBorderIsBoxPipe && isTopOrBottom));
  console.log("isInsideBox:", isInsideBox);

  const isStrict = RE_STRICT_JAPANESE.test(part);
  console.log("isStrictJapaneseText:", isStrict);

  const jpCharsMatch = part.match(RE_JAPANESE_CHARS_G) || [];
  const symbolCount = (part.match(RE_SYMBOLS_G) || []).filter(c => !/[0-9]/.test(c)).length;
  const hasExcessiveSymbols = symbolCount >= jpCharsMatch.length && jpCharsMatch.length > 0;
  console.log("hasExcessiveSymbols:", hasExcessiveSymbols);

  const isAllStructuralBorder = jpCharsMatch.length > 0 && jpCharsMatch.every(c => /[＿＝]/.test(c));
  console.log("isAllStructuralBorder:", isAllStructuralBorder);

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
      if (RE_STRICT_BLANK.test(substr)) return true;
      if (/^[\s\u200B￣＿\u2500-\u2503\u2504\u2505\u2508\u2509\u250C-\u254D\u2550\u2552-\u2573\-|｜]*$/.test(substr)) return true;
      if (RE_BOX_BORDER_ANY.test(substr)) return true;
      if (RE_JAPANESE_CHAR.test(substr) && !isDrawing(substr)) return true;
      return false;
    };

    const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
    const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;

    return (above === undefined || isSafeRange(above, checkStart, checkEnd)) && (below === undefined || isSafeRange(below, checkStart, checkEnd));
  };

  const isDrawing = (text: string) => {
    if (/[二三壬]{2,}|[口ロ十]{3,}/.test(text)) return true;
    if (/[|│┃｜_＿￣─━\-\/／\\＼]{2,}/.test(text)) return true;

    const hasBoundaryDrawingLines = /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━][\s\u3000]*$/.test(text);
    const hasStdHiragana = RE_STANDARD_HIRAGANA.test(text.replace(/[ゝゞ]/g, ''));
    if (hasBoundaryDrawingLines && !hasStdHiragana) return true;

    const jpChars = text.match(RE_JAPANESE_CHARS_G) || [];
    const symbols = text.match(RE_SYMBOLS_G) || [];

    if (jpChars.length > 0 && symbols.length > jpChars.length * 1.5) return true;
    if (jpChars.length > 0 && jpChars.every(c => /[ヽヾ丶〆丿乂爻巛川]/.test(c))) return true;
    if (jpChars.length === 1 && RE_AA_CHARS.test(jpChars[0]) && text.length <= 3) return true;

    const isAllAAChars = jpChars.length > 0 && jpChars.every(c => RE_AA_CHARS.test(c));
    if (isAllAAChars) {
      const spacesAndSymbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g) || [];
      if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
      if (/[\uff61-\uff65]/.test(text)) return true;
      if (jpChars.some(c => /[ヽヾ丶〆丿乂爻巛川]/.test(c))) return true;
    }

    if (jpChars.length >= 3) {
      const aaCount = jpChars.filter(c => RE_AA_CHARS.test(c) && !/[\uff10-\uff19]/.test(c)).length;
      if (aaCount / jpChars.length >= 0.5 && !/[\uff9e\uff9f]/.test(text)) return true;
    }

    return false;
  };

  const safeVertCtx = hasSafeVerticalContext(lines, lineIdx, currentOffset, currentOffset + part.length);
  console.log("getSafeVertCtx:", safeVertCtx);
  console.log("isDrawing:", isDrawing(part));

  currentOffset += part.length;
});
