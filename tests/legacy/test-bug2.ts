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

const text = `　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　(ヽ、００　　∩
　　　　　　　　　　　　　　　　　　　　　　　　　　　 　 　 　 　 　 　 　 　 ＿　　-tぅ　　　　　　　　　　　　　　　　⊂ニ、ﾆ⊃　⊂　⊃
　　　　　　　　　　　　　　　　　　　　　 　 　 　 _rｧr_┐　　＿　　-　　⌒￣　　　　　　　　　　　　　　　　　　　　,, -‐- ＼　　　| |／⌒ヽ`;

const lines = text.split('\n');
const line2 = lines[2];
console.log('line2:', line2);
console.log('line2 width:', getDisplayWidth(line2));

const prefix2 = line2.substring(0, line2.indexOf('⌒￣') + 2);
console.log('prefix2:', prefix2);
console.log('prefix2 width:', getDisplayWidth(prefix2));

const line1 = lines[1];
const prefix1 = line1.substring(0, line1.indexOf('-tぅ'));
console.log('prefix1:', prefix1);
console.log('prefix1 width:', getDisplayWidth(prefix1));
