const RE_DISQUALIFIED = /[}｝]/;
const RE_MEANINGFUL_JP = /[\u3041-\u3096\u30a1-\u30f6\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
const RE_STANDARD_HIRAGANA = /[ぁ-ん]/;

const test = (part: string) => {
  const hasHiragana = RE_STANDARD_HIRAGANA.test(part);
  const isAllAAOnly = false; // dummy
  const jpCharsMatch = part.match(/./g) || [];
  
  const isNeverSelectable = RE_DISQUALIFIED.test(part) || !RE_MEANINGFUL_JP.test(part) || (!hasHiragana && isAllAAOnly && jpCharsMatch.length <= 1);
  
  console.log(`Part: "${part}" -> isNeverSelectable: ${isNeverSelectable}`);
};

test("あ}");
test("あ｝");
test("あ");
test("}");
