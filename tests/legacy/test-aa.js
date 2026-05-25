const text = `|/芹云ミ ／　　　 芹云ミ､
　 人､ ゝ 丿　　　　　　ゝ 丿ｊ│/`;

const isDrawing = (text) => {
  const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  const symbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\s]/g) || [];
  const spacesAndSymbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
  
  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => /[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワヽヾ丶〆丿乂爻巛川\uff65-\uff9f]/.test(c));
  
  console.log(`Text: "${text}"`);
  console.log(`  jpChars: ${jpChars.length}`);
  console.log(`  symbols: ${symbols.length}`);
  console.log(`  spacesAndSymbols: ${spacesAndSymbols.length}`);
  console.log(`  isAllAAChars: ${isAllAAChars}`);
  
  if (isAllAAChars && (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1)) return true;
  return false;
};

console.log(isDrawing("人､ ゝ 丿"));
console.log(isDrawing("/芹云ミ ／"));
