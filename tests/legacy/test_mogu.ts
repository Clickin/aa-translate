const RE_STRICT_BLANK = /^[\s\u3000\u00A0\u2000-\u200B]*$/;
const isFullWidthChar = (code: number) => {
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
  console.log("dispStart:", dispStart, "dispEnd:", dispEnd, "checkStart:", checkStart, "checkEnd:", checkEnd);
  console.log("Substring up to colStart:", currentLine.substring(0, colStart));
  console.log("Substring up to colStart length:", currentLine.substring(0, colStart).length);
  let w = 0;
  for (let i = 0; i < currentLine.substring(0, colStart).length; i++) {
    const c = currentLine.substring(0, colStart)[i];
    const cw = isFullWidthChar(c.charCodeAt(0)) ? 2 : 1;
    w += cw;
    console.log(`Char: ${c} (code: ${c.charCodeAt(0).toString(16)}) - width: ${cw} - total: ${w}`);
  }


  console.log("Below line length:", getDisplayWidth(lines[2]));
  let col = 0;
  for (let i = 0; i < lines[0].length; i++) {
    const c = lines[0][i];
    const w = isFullWidthChar(c.charCodeAt(0)) ? 2 : 1;
    col += w;
    if (c === '〔') console.log("Found 〔 at col", col);
  }
  col = 0;
  for (let i = 0; i < lines[1].length; i++) {
    const c = lines[1][i];
    const w = isFullWidthChar(c.charCodeAt(0)) ? 2 : 1;
    col += w;
    if (c === '）') console.log("Found ） at col", col);
  }


  const isEmptyRange = (line: string | undefined, dStart: number, dEnd: number) => {
    if (line === undefined) return true;
    const substr = substringByDisplayCols(line, dStart, dEnd);
    console.log(`Checking substr: "${substr}"`);
    if (substr.length === 0) return true;
    return RE_STRICT_BLANK.test(substr);
  };
  const above = lineIdx > 0 ? lines[lineIdx - 1] : undefined;
  const below = lineIdx < lines.length - 1 ? lines[lineIdx + 1] : undefined;
  return isEmptyRange(above, checkStart, checkEnd) && isEmptyRange(below, checkStart, checkEnd);
};

const lines = [
  "　　　　　　 　 　 　 / 〉:. :｀　 　 　 　 　 　 　 　 　 　 '/:.i:i:i:i:}:. :.:|.　 V/i:i:ｉ:V/i:ｉ:〔:. :. :. :.:",
  "　　　　　　　　 　 　 /∧沁、　　　　‐ （　　　 　 　 　 |:.:.i:i:i:√ :.|.　 ｿV/i:i:iV/i:圦:. :. :. : 　　　））　ﾓｸﾞﾓｸﾞ",
  "　　　　　　 　 　 　 　 / 〉:沁、 ´　:.　　　　　　　　　　|.:.:i:i:i√:. :|.／／)V/i:i:丈i:i:i＼:. :.:"
];

const currentLine = lines[1];
const target = "））　ﾓｸﾞﾓｸﾞ";
const colStart = currentLine.indexOf(target);
const colEnd = colStart + target.length;

console.log("colStart:", colStart, "colEnd:", colEnd);
console.log("Result:", isVerticallyIsolatedAt(lines, 1, colStart, colEnd));
