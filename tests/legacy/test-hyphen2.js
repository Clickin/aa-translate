const hasBoundaryDrawingLines = (text) => /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━][\s\u3000]*$/.test(text);
console.log("/芹云ミ ／", hasBoundaryDrawingLines("/芹云ミ ／"));
console.log("ゝ 丿ｊ│/", hasBoundaryDrawingLines("ゝ 丿ｊ│/"));
console.log("- 攻撃力", hasBoundaryDrawingLines("- 攻撃力"));
