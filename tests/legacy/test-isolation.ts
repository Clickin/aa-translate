
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

  if (startIdx === -1) return '';
  return line.substring(startIdx, endIdx);
};

const RE_STRICT_BLANK = /^[\s\u200B]*$/;

const isVerticallyIsolatedAt = (lines: string[], lineIdx: number, colStart: number, colEnd: number, padding: number = 2): boolean => {
  const currentLine = lines[lineIdx];
  const dispStart = getDisplayWidth(currentLine.substring(0, colStart));
  const dispEnd = dispStart + getDisplayWidth(currentLine.substring(colStart, colEnd));

  const checkStart = Math.max(0, dispStart - padding);
  const checkEnd = dispEnd + padding;

  const isEmptyRange = (line: string | undefined, dStart: number, dEnd: number): boolean => {
    if (line === undefined) return true;
    const substr = substringByDisplayCols(line, dStart, dEnd);
    console.log(`  Checking line: "${line}"`);
    console.log(`  Range: [${dStart}, ${dEnd}), Substr: "${substr}"`);
    if (substr.length === 0) return true;
    return RE_STRICT_BLANK.test(substr);
  };

  const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
  const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;

  if (above === undefined && below === undefined) return false;

  const aboveOk = isEmptyRange(above, checkStart, checkEnd);
  const belowOk = isEmptyRange(below, checkStart, checkEnd);
  console.log(`  aboveOk: ${aboveOk}, belowOk: ${belowOk}`);
  return aboveOk && belowOk;
};

const lines = [
  "　　　　　　　　　　　_.......::‐-..､´￣／:::::／／／/ / ,､..../ヽ　＼ヽ　 ヽヽ'''ヽ　￣､｀ﾞ",
  "　　　　　／ _::: -‐-､::::ヽ｛/::;／::/:::/::::/...|　|ﾐﾍ|:i:i:iヽ.　ヽ ＼　ヽヽ　ヽ...;::ヽ",
  "　　　 ／／　　　　　 ＼::/:://::/:::/{:::/!::;:|:::::{ミﾐ彡ソヽ::::ヽ::::ヽ:::ヽ:ヽ:::｝:ヾ､:!",
  "　　 /:/　　 ....:::::‐::::::-...､l:/　|/ |::l　!::! {::!{ ヽ｛　　　　　ヽ:::｝ヽ::!::::|::::!:::::!::::} ｝"
];

const lineIdx = 2;
const part = "ミﾐ彡ソ";
const colStart = lines[lineIdx].indexOf(part);
const colEnd = colStart + part.length;

console.log(`Testing isolation for "${part}" at line ${lineIdx}, cols [${colStart}, ${colEnd})`);
const result = isVerticallyIsolatedAt(lines, lineIdx, colStart, colEnd);
console.log(`Result: ${result}`);
