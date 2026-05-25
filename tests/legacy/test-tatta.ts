
const RE_JAPANESE_CHARS_G = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g;
const RE_STRUCTURAL_REPEAT = /[二三壬]{2,}|[口ロ十]{3,}/;
const RE_LINE_BORDERS = /[|│┃｜_＿￣─━\-\/／\\＼]{2,}/;
const RE_AA_EFFECTS = /．・｀ｰ"|｀ｰ"/;
const RE_BOUNDARY_DRAWING = /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━][\s\u3000]*$/;
const RE_STANDARD_HIRAGANA = /[ぁ-ん]/;
const RE_GEGE_G = /[ゝゞ]/g;
const RE_SYMBOLS_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e\s]/g;
const RE_DRAWING_MARKS = /[ヽヾ丶〆丿乂爻巛川]/;
const RE_AA_CHARS = /[二三七彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山마히릴레와시アイウエ오카키쿠케코사시스세소타치츠테토나니누네노하히후헤호마미무메모야유요라릴레로완ー―つっぅヽヾ丶〆丿乂爻巛川芹云ゝゞ冖宀冂广廴廾彐彳忄扌氵犭纟艹辶阝丈乃亅卜匕个丫儿厂厶ヲ\uff65-\uff9fA-Za-z0-9Ａ-Ｚａ-ｚ０-９＿￣．・｀"”]/;
const RE_NON_JP_G = /[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/g;

const isDrawing = (text: string) => {
  if (RE_STRUCTURAL_REPEAT.test(text)) return true;
  if (RE_LINE_BORDERS.test(text)) return true;
  if (RE_AA_EFFECTS.test(text)) return true;

  const hasBoundaryDrawingLines = RE_BOUNDARY_DRAWING.test(text);
  const hasStdHiragana = RE_STANDARD_HIRAGANA.test(text.replace(RE_GEGE_G, ''));
  if (hasBoundaryDrawingLines && !hasStdHiragana) return true;

  const jpChars = text.match(RE_JAPANESE_CHARS_G) || [];
  const symbols = text.match(RE_SYMBOLS_G) || [];

  if (jpChars.length > 0 && symbols.length > jpChars.length * 1.5) return true;

  if (jpChars.length > 0 && jpChars.every(c => RE_DRAWING_MARKS.test(c))) return true;

  if (jpChars.length === 1 && RE_AA_CHARS.test(jpChars[0]) && text.length <= 3) return true;

  const isAllAAChars = jpChars.length > 0 && jpChars.every(c => RE_AA_CHARS.test(c));
  if (isAllAAChars) {
    const spacesAndSymbols = text.match(RE_NON_JP_G) || [];
    if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
  }

  return false;
};

console.log("isDrawing('ﾀｯﾀｯﾀ'):", isDrawing("ﾀｯﾀｯﾀ"));
