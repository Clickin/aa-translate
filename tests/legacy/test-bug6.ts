import fs from 'fs';

const getDisplayWidth = (text: string): number => {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0000 && code <= 0x001F) {
      continue;
    } else if (code >= 0x0020 && code <= 0x007E) {
      width += 1;
    } else if (code >= 0xFF61 && code <= 0xFF9F) {
      width += 1;
    } else {
      width += 2;
    }
  }
  return width;
};

const text = `　　　　　　　　　　　　　　　　　　　　　　　　　　　 　 　 　 　 　 　 　 　 ＿　　-tぅ　　　　　　　　　　　　　　　　⊂ニ、ﾆ⊃　⊂　⊃
　　　　　　　　　　　　　　　　　　　　　 　 　 　 _rｧr_┐　　＿　　-　　⌒￣　　　　　　　　　　　　　　　　　　　　,, -‐- ＼　　　| |／⌒ヽ
　　　　　　　　　　　　＿　　　　　 　 　 　 r-=_L{し^ }-　⌒￣　 　 ﾉ|　　　　　　 　 _　　　　　　　　　　　　　　 （ ⊂ニニ　　 /　／⌒) ）　　　(ヽ、００　　∩
　　 　 　 　 　 　 　 ( （__　　　 　_　-― _　⌒７ーﾍ〈 　 ノｉ} 　 　 /i:i| 　∧ 　､丶\`⌒＼、　　　　　　　　.　　　 　 ｰ――'′　し∪　 （ノ　　⊂ニ、ﾆ⊃　⊂　⊃`;

const lines = text.split('\n');
const lineIdx = 3;
const part = "ｰ――'′　し∪";
const colStart = lines[lineIdx].indexOf(part);
const colEnd = colStart + part.length;

console.log('part:', part);
console.log('colStart:', colStart, 'colEnd:', colEnd);

const currentLine = lines[lineIdx];
const dispStart = getDisplayWidth(currentLine.substring(0, colStart));
const dispEnd = dispStart + getDisplayWidth(currentLine.substring(colStart, colEnd));

console.log('dispStart:', dispStart, 'dispEnd:', dispEnd);

const padding = 2;
const checkStart = Math.max(0, dispStart - padding);
const checkEnd = dispEnd + padding;

const above = lines[lineIdx - 1];
const below = lines[lineIdx + 1] || '';

const substringByDisplayCols = (text: string, startCol: number, endCol: number): string => {
  let result = '';
  let currentCol = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charWidth = getDisplayWidth(char);
    if (currentCol >= endCol) break;
    if (currentCol >= startCol) {
      result += char;
    }
    currentCol += charWidth;
  }
  return result;
};

console.log('above:', JSON.stringify(substringByDisplayCols(above, checkStart, checkEnd)));
console.log('below:', JSON.stringify(substringByDisplayCols(below, checkStart, checkEnd)));
