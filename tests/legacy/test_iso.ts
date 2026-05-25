const RE_STRICT_BLANK = /^[\s\u3000\u00A0\u2000-\u200B]*$/;
const RE_JAPANESE_CHAR = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/;
const RE_JAPANESE_CHARS_G = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g;
const RE_STRUCTURAL_REPEAT = /[二三壬]{2,}|[口ロ十]{3,}/;
const RE_LINE_BORDERS = /[|│┃｜_＿￣─━\-\/／\\＼]{2,}/;
const RE_BOUNDARY_DRAWING = /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━][\s\u3000]*$/;
const RE_STANDARD_HIRAGANA = /[ぁ-ん]/;
const RE_GEGE_G = /[ゝゞ]/g;
const RE_DRAWING_MARKS = /[ヽヾ丶〆丿乂爻巛川]/;
const RE_AA_CHARS = /[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリル레와시アイウエオカ키쿠케코사시스세소타치츠테토나니누네노하히후헤호마미무메모야유요라릴레로완ー―つっぅヽヾ丶〆丿乂爻巛川芹云ゝゞ冖宀冂广廴廾彐彳忄扌氵犭纟艹辶阝丈乃亅卜匕个丫儿厂厶ヲ\uff65-\uff9fA-Za-z0-9Ａ-Ｚａ-ｚ０-９＿￣]/;
const RE_NON_JP_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g;
const RE_SYMBOLS_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e\s]/g;

const isDrawing = (text: string) => {
  if (RE_STRUCTURAL_REPEAT.test(text)) return true;
  if (RE_LINE_BORDERS.test(text)) return true;

  const hasBoundaryDrawingLines = RE_BOUNDARY_DRAWING.test(text);
  const hasStdHiragana = RE_STANDARD_HIRAGANA.test(text.replace(RE_GEGE_G, ''));
  if (hasBoundaryDrawingLines && !hasStdHiragana) return true;

  const jpChars = text.match(RE_JAPANESE_CHARS_G) || [];
  const symbols = text.match(RE_SYMBOLS_G) || [];

  if (jpChars.length > 0 && symbols.length > jpChars.length * 1.5) return true;

  if (jpChars.length > 0 && jpChars.every(c => RE_DRAWING_MARKS.test(c))) return true;

  if (jpChars.length === 1 && RE_AA_CHARS.test(jpChars[0]) && text.length <= 3) return true;

  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => RE_AA_CHARS.test(c));
  if (isAllAAChars) {
    const spacesAndSymbols = text.match(RE_NON_JP_G) || [];
    if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
  }

  return false;
};

const part1 = "乂＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿ノ";
const part2 = "ｻﾞｱｱｱｱｱｱｱｱｱ";

console.log("part1 isDrawing:", isDrawing(part1));
console.log("part2 isDrawing:", isDrawing(part2));

const isFullWidthChar = (code: number) => {
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
const getDisplayWidth = (str: string) => {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    w += isFullWidthChar(str.charCodeAt(i)) ? 2 : 1;
  }
  return w;
};
const substringByDisplayCols = (line: string, dispStart: number, dispEnd: number) => {
  let col = 0;
  let startIdx = -1;
  let endIdx = line.length;
  for (let i = 0; i < line.length; i++) {
    if (startIdx === -1 && col >= dispStart) startIdx = i;
    col += isFullWidthChar(line.charCodeAt(i)) ? 2 : 1;
    if (startIdx !== -1 && col >= dispEnd) {
      endIdx = i + 1;
      break;
    }
  }
  if (startIdx === -1) return '';
  return line.substring(startIdx, endIdx);
};
const isVerticallyIsolatedAt = (lines: string[], lineIdx: number, colStart: number, colEnd: number, padding = 8) => {
  const currentLine = lines[lineIdx];
  const dispStart = getDisplayWidth(currentLine.substring(0, colStart));
  const dispEnd = dispStart + getDisplayWidth(currentLine.substring(colStart, colEnd));
  const checkStart = Math.max(0, dispStart - padding);
  const checkEnd = dispEnd + padding;
  const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
  const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;

  console.log("dispStart:", dispStart, "dispEnd:", dispEnd, "checkStart:", checkStart, "checkEnd:", checkEnd);
  console.log("Line above length:", above ? getDisplayWidth(above) : 0);
  if (above) {
    let col = 0;
    for (let i = 0; i < above.length; i++) {
      if (above[i] === '〉') {
        console.log("Found 〉 at disp col:", col);
      }
      if (above[i] === '|') {
        console.log("Found | at disp col:", col);
      }
      col += isFullWidthChar(above.charCodeAt(i)) ? 2 : 1;
    }
  }
  if (currentLine) {
    let col = 0;
    for (let i = 0; i < currentLine.length; i++) {
      if (currentLine[i] === '}') {
        console.log("Found } at disp col:", col);
      }
      if (currentLine[i] === '乂') {
        console.log("Found 乂 at disp col:", col);
      }
      col += isFullWidthChar(currentLine.charCodeAt(i)) ? 2 : 1;
    }
  }

  const isEmptyRange = (line: string | undefined, dStart: number, dEnd: number) => {
    if (line === undefined) return true;
    const substr = substringByDisplayCols(line, dStart, dEnd);
    console.log(`Checking substr: "${substr}"`);
    if (substr.length === 0) return true;
    return RE_STRICT_BLANK.test(substr);
  };

  return isEmptyRange(above, checkStart, checkEnd) && isEmptyRange(below, checkStart, checkEnd);
};


const lines = [
  ". 　 　 　 　 /:√:. .: .i:i:i:i:ｉ:ｉ|:. :. i:,′ i:'/:. :. :.ｉ:ｉ}i:i:i. た:. :. /i:i:'/:. :'/i:i:i.:.i:ｉ:寸L:. :. :. :. :|:./ 〉　　　　　 |　　　　　　　　　　　　　　　　　　　　　　　　　　 　 　 　 　 　 |",
  "　　　　　 ,ｲ:.√:. :. :.i:i:i:i:i:ｉ:|:. :ｉ:ｉ,}:. :.i:i:'/:. :. i:iﾘ＼/i:i:. :.:/i:i:i:i:'/:. :'/i:i:i:i:.i:i:ｉ寸L:. :. :.:.:|:. :.: }　　　　　 乂＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿ノ",
  "　　　　／:. :〈:. :. :. :. i:i:i:i:i:i|:. i:,' }:. i:i:/}:. :i:i:i/　}i:i:iｿ:.:, ':|i:i:i:ｉ:ｉ'/:. :'/i:i:i:i:i:i:i:i:i寸L:. :.:.:|:. :.: }"
];

const targetLine = lines[1];
const targetPart = "乂＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿ノ";
const colStart = targetLine.indexOf(targetPart);
const colEnd = colStart + targetPart.length;

console.log("colStart:", colStart, "colEnd:", colEnd);
console.log("Result:", isVerticallyIsolatedAt(lines, 1, colStart, colEnd));
console.log("isDrawing:", isDrawing(targetPart));
