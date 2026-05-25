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

const text = `　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　　(ヽ、００　　∩`;

const prefix = text.substring(0, text.indexOf('('));
console.log('prefix width:', getDisplayWidth(prefix));
