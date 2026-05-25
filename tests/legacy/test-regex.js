const text = `|/芹云ミ ／　　　 芹云ミ､
　 人､ ゝ 丿　　　　　　ゝ 丿ｊ│/`;

const gapRegex = /([\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*)/;
const lines = text.split('\n');

const hasJapaneseChar = (text) => /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);

const isStrictJapaneseRegex = (text) => /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉‘’“”\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワ\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}).+$/.test(text);

const isDrawing = (text) => {
  if (/[二三壬]{2,}|[口ロ十]{3,}/.test(text)) return true;
  if (/[|│┃｜_＿￣─━\-\/／\\＼]{2,}/.test(text)) return true;
  const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  const symbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\s]/g) || [];
  if (jpChars.length > 0 && jpChars.every(c => /[ヽヾ丶〆丿乂爻巛川]/.test(c))) return true;
  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => /[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワヽヾ丶〆丿乂爻巛川\uff65-\uff9f]/.test(c));
  if (isAllAAChars && (symbols.length >= jpChars.length || jpChars.length === 1)) return true;
  return false;
};

lines.forEach((line, lineIdx) => {
  const isBoxedLine = /^[\s\u3000\u00A0\u2000-\u200B]*[|│┃｜].*[|│┃｜][\s\u3000\u00A0\u2000-\u200B]*$/.test(line);
  const parts = line.split(gapRegex);
  parts.forEach((part) => {
    if (part === "") return;
    const isSeparator = /^[\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*$/.test(part);
    const isJp = !isSeparator && hasJapaneseChar(part);
    
    const jpCharsMatch = part.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
    const uniqueJpChars = new Set(jpCharsMatch);
    const hasEnoughDistinctJpChars = uniqueJpChars.size >= 3;
    
    const strictJp = isStrictJapaneseRegex(part);
    const drawing = isDrawing(part);
    const isStrict = isJp && !drawing && hasEnoughDistinctJpChars && (strictJp || isBoxedLine);
    
    console.log(`Part: "${part}"`);
    console.log(`  isSeparator: ${isSeparator}`);
    console.log(`  isJp: ${isJp}`);
    console.log(`  hasEnoughDistinctJpChars: ${hasEnoughDistinctJpChars} (size: ${uniqueJpChars.size})`);
    console.log(`  strictJp: ${strictJp}`);
    console.log(`  isBoxedLine: ${isBoxedLine}`);
    console.log(`  isDrawing: ${drawing}`);
    console.log(`  => isStrict: ${isStrict}`);
  });
});
