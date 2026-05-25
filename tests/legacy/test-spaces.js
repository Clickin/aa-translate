const isDrawing = (text) => {
  const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  const spacesAndSymbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  
  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => /[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワヽヾ丶〆丿乂爻巛川芹云ゝゞ\uff65-\uff9f]/.test(c));
  
  if (isAllAAChars && (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1)) return true;
  
  return false;
};

console.log("人､ ゝ 丿", isDrawing("人､ ゝ 丿"));
console.log("ファイル", isDrawing("ファイル"));
console.log("大ヒット", isDrawing("大ヒット"));
console.log("芹云ミ､", isDrawing("芹云ミ､"));
