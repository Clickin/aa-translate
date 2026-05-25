const isDrawing = (text) => {
  const hasBoundaryDrawingLines = /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━\-]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━\-][\s\u3000]*$/.test(text);
  const hasStandardHiragana = /[ぁ-ん]/.test(text.replace(/[ゝゞ]/g, ''));
  if (hasBoundaryDrawingLines && !hasStandardHiragana) return true;
  return false;
};
console.log("攻撃力 -", isDrawing("攻撃力 -"));
console.log("- 攻撃力", isDrawing("- 攻撃力"));
