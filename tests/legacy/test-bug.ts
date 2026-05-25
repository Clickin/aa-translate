
const RE_JAPANESE_CHAR = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
const RE_JAPANESE_CHARS_G = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g;
const RE_STRICT_JAPANESE = /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉''""\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワしー―つっぅ\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}|(?=[\s\S]*[ぁ-ん])(?=[\s\S]*[一-龯])(?:[\s\S]*[ぁ-ん一-龯]){3,}).+$/;
const RE_STRUCTURAL_REPEAT = /[二三壬]{2,}|[口ロ十]{3,}/;
const RE_LINE_BORDERS = /[|│┃｜_＿￣─━\-\/／\\＼]{2,}/;
const RE_BOUNDARY_DRAWING = /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━][\s\u3000]*$/;
const RE_STANDARD_HIRAGANA = /[ぁ-ん]/;
const RE_GEGE_G = /[ゝゞ]/g;
const RE_DRAWING_MARKS = /[ヽヾ丶〆丿乂爻巛川]/;
const RE_AA_CHARS = /[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワしー―つっぅヽヾ丶〆丿乂爻巛川芹云ゝゞ\uff65-\uff9f]/;
const RE_NON_JP_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g;
const RE_HALFWIDTH_PUNCT = /[\uff61-\uff65]/;
const RE_HW_DAKUTEN = /[\uff9e\uff9f]/;

const isDrawing = (text) => {
  if (RE_STRUCTURAL_REPEAT.test(text)) return true;
  if (RE_LINE_BORDERS.test(text)) return true;

  const hasBoundaryDrawingLines = RE_BOUNDARY_DRAWING.test(text);
  const hasStdHiragana = RE_STANDARD_HIRAGANA.test(text.replace(RE_GEGE_G, ''));
  if (hasBoundaryDrawingLines && !hasStdHiragana) return true;

  const jpChars = text.match(RE_JAPANESE_CHARS_G) || [];
  const spacesAndSymbols = text.match(RE_NON_JP_G) || [];

  if (jpChars.length > 0 && jpChars.every(c => RE_DRAWING_MARKS.test(c))) return true;

  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => RE_AA_CHARS.test(c));
  if (isAllAAChars) {
    if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
    if (RE_HALFWIDTH_PUNCT.test(text)) return true;
    if (jpChars.some(c => RE_DRAWING_MARKS.test(c))) return true;
  }

  if (jpChars.length >= 4) {
    const aaCount = jpChars.filter(c => RE_AA_CHARS.test(c)).length;
    if (aaCount / jpChars.length >= 0.6 && !RE_HW_DAKUTEN.test(text)) return true;
  }

  return false;
};

const testText = "ミﾐ彡ソ";
console.log("Text:", testText);
console.log("isDrawing:", isDrawing(testText));
console.log("isStrictJapaneseText:", RE_STRICT_JAPANESE.test(testText));

const testText2 = "{ミﾐ彡ソヽ";
console.log("Text:", testText2);
console.log("isDrawing:", isDrawing(testText2));
console.log("isStrictJapaneseText:", RE_STRICT_JAPANESE.test(testText2));

const testText3 = "ミﾐ彡ソヽ::::ヽ::::ヽ:::ヽ:ヽ:::｝:ヾ､:!";
console.log("Text:", testText3);
console.log("isDrawing:", isDrawing(testText3));
console.log("isStrictJapaneseText:", RE_STRICT_JAPANESE.test(testText3));
