const part = "傑のスキル発動　傑は呪霊操術を行いました。";

const jpChars = part.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
const spacesAndSymbols = part.match(/[\s\u3000\u00A0\u2000-\u200B\u3001\u3002\uff01\uff1f!?'"()（）「」『』【】<〈>〉]/g) || [];

console.log("jpChars:", jpChars.length);
console.log("spacesAndSymbols:", spacesAndSymbols.length);

const isAllAAChars = jpChars.length > 0 && jpChars.every(char => 
    /[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワヽヾ丶〆丿乂爻巛川芹云ゝゞ\uff65-\uff9f]/.test(char)
);
console.log("isAllAAChars:", isAllAAChars);

const hasBoundaryDrawingLines = /^[\s\u3000\u00A0\u2000-\u200B]*[|│┃｜\/／\\＼_＿￣─━]|[|│┃｜\/／\\＼_＿￣─━][\s\u3000\u00A0\u2000-\u200B]*$/.test(part);
const hasStandardHiragana = /[ぁ-ん]/.test(part.replace(/[ゝゞ]/g, ''));
console.log("hasBoundaryDrawingLines:", hasBoundaryDrawingLines);
console.log("hasStandardHiragana:", hasStandardHiragana);

const isDrawing = (jpChars.length <= spacesAndSymbols.length * 2) || isAllAAChars || (hasBoundaryDrawingLines && !hasStandardHiragana);
console.log("isDrawing:", isDrawing);
