const part = "傑のスキル発動　傑は呪霊操術を行いました。";
const jpChars = part.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
const spacesAndSymbols = part.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
console.log("jpChars:", jpChars.length);
console.log("spacesAndSymbols:", spacesAndSymbols.length);
