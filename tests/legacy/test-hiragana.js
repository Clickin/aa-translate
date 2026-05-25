const hasStandardHiragana = (text) => /[ぁ-ん]/.test(text.replace(/[ゝゞ]/g, ''));

const isDrawingLine = (text) => {
  const hasDrawingLines = /[|│┃｜\/／\\＼]/.test(text);
  const hasHiragana = hasStandardHiragana(text);
  return hasDrawingLines && !hasHiragana;
};

console.log("/芹云ミ ／", isDrawingLine("/芹云ミ ／"));
console.log("魔法使い/戦士", isDrawingLine("魔法使い/戦士"));
console.log("ゝ 丿ｊ│/", isDrawingLine("ゝ 丿ｊ│/"));
