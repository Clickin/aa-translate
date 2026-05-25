const hasBoundaryDrawingLines = (text) => /^[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━\-]|[\s\u3000]*[|│┃｜\/／\\＼_＿￣─━\-][\s\u3000]*$/.test(text);

console.log("/芹云ミ ／", hasBoundaryDrawingLines("/芹云ミ ／"));
console.log("ゝ 丿ｊ│/", hasBoundaryDrawingLines("ゝ 丿ｊ│/"));
console.log("攻撃力/防御力", hasBoundaryDrawingLines("攻撃力/防御力"));
console.log("魔法使い/戦士", hasBoundaryDrawingLines("魔法使い/戦士"));
