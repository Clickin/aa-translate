const isDrawing = (text) => {
  if (/[二三壬]{2,}|[口ロ十]{3,}/.test(text)) return true;
  if (/[|│┃｜_＿￣─━\-\/／\\＼]{2,}/.test(text)) return true;
  
  const hasBoundaryDrawingLines = /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━\-]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━\-][\s\u3000]*$/.test(text);
  const hasStandardHiragana = /[ぁ-ん]/.test(text.replace(/[ゝゞ]/g, ''));
  if (hasBoundaryDrawingLines && !hasStandardHiragana) return true;
  
  const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  const spacesAndSymbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  
  if (jpChars.length > 0 && jpChars.every(c => /[ヽヾ丶〆丿乂爻巛川]/.test(c))) return true;
  
  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => /[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワヽヾ丶〆丿乂爻巛川芹云ゝゞ\uff65-\uff9f]/.test(c));
  
  if (isAllAAChars) {
    if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
    const hasKatakana = /[\u30a0-\u30ff\uff66-\uff9f]/.test(text);
    if (hasKatakana && !hasStandardHiragana) return true;
  }
  
  return false;
};

console.log("/芹云ミ ／", isDrawing("/芹云ミ ／"));
console.log("芹云ミ､", isDrawing("芹云ミ､"));
console.log("人､ ゝ 丿", isDrawing("人､ ゝ 丿"));
console.log("ゝ 丿ｊ│/", isDrawing("ゝ 丿ｊ│/"));
console.log("攻撃力/防御力", isDrawing("攻撃力/防御力"));
console.log("魔法使い/戦士", isDrawing("魔法使い/戦士"));
console.log("三人", isDrawing("三人"));
console.log("生ゴミ", isDrawing("生ゴミ"));
