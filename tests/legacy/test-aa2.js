const isAllAAChars = (text) => {
  const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  if (jpChars.length === 0) return false;
  return jpChars.every(c => /[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワヽヾ丶〆丿乂爻巛川芹云ゝゞ\uff65-\uff9f]/.test(c));
};

const hasStandardHiragana = (text) => /[ぁ-ん]/.test(text.replace(/[ゝゞ]/g, ''));
const hasKatakana = (text) => /[\u30a0-\u30ff\uff66-\uff9f]/.test(text);

const isAA = (text) => {
  if (!isAllAAChars(text)) return false;
  
  const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  const spacesAndSymbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  
  if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
  
  if (hasKatakana(text) && !hasStandardHiragana(text)) return true;
  
  return false;
};

console.log("芹云ミ､", isAA("芹云ミ､"));
console.log("三人", isAA("三人"));
console.log("生ゴミ", isAA("生ゴミ"));
console.log("人､ ゝ 丿", isAA("人､ ゝ 丿"));
