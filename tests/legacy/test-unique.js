const text = "ゝ 丿ｊ│/";
const jpCharsMatch = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
const uniqueJpChars = new Set(jpCharsMatch);
console.log(uniqueJpChars.size);
