import assert from "node:assert/strict";
import test from "node:test";
import {
  isNaturalJapaneseAutoSelectText,
  isSmartSelectCandidate,
  isStructuralAaFragmentText,
  segmentContentForTest,
} from "../workers/segmentation.worker";

test("natural Japanese auto-select accepts casual dialogue examples", () => {
  assert.equal(isNaturalJapaneseAutoSelectText("ポーランド分割ぅ！ｗ"), true);
  assert.equal(
    isNaturalJapaneseAutoSelectText(
      "やっぱりドラクマは蛮族だなと思ったけどエリスの遮断のせいじゃん",
    ),
    true,
  );
  assert.equal(
    isNaturalJapaneseAutoSelectText("エリス絶許だしそらドラクマは世界情勢から取り残されるよ"),
    true,
  );
  assert.equal(
    isNaturalJapaneseAutoSelectText("攻めで他所から略奪するのは辞めろってことだよ！"),
    true,
  );
  assert.equal(isNaturalJapaneseAutoSelectText("言わせんな恥ずかしいｗ"), true);
});

test("natural Japanese auto-select accepts speaker labels", () => {
  assert.equal(isNaturalJapaneseAutoSelectText("胡喜媚："), true);
  assert.equal(isNaturalJapaneseAutoSelectText("キョン子："), true);
  assert.equal(isNaturalJapaneseAutoSelectText("シオニー：　"), true);
  assert.equal(isNaturalJapaneseAutoSelectText("　マーティン：　"), true);
  assert.equal(isNaturalJapaneseAutoSelectText("　コータ："), true);
});

test("natural Japanese auto-select accepts short questions and long casual lines", () => {
  assert.equal(isNaturalJapaneseAutoSelectText("法治？"), true);
  assert.equal(
    isNaturalJapaneseAutoSelectText(
      "つまりこいつら潜在的な敵ってことか。族滅しなきゃ。になるだろアホか＞他領からの略奪",
    ),
    true,
  );
  assert.equal(isNaturalJapaneseAutoSelectText("他領からの略奪"), true);
});

test("natural Japanese auto-select keeps short AA fragments out", () => {
  assert.equal(isNaturalJapaneseAutoSelectText("人"), false);
  assert.equal(isNaturalJapaneseAutoSelectText("ノ："), false);
  assert.equal(isNaturalJapaneseAutoSelectText("123："), false);
});

test("structural AA fragments are hard negatives for smart selection", () => {
  for (const text of [
    "ﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆ",
    "二二二二二二二二二",
    "¨¨¨¨¨¨¨ﾞ",
    "￣￣￣ﾞ",
    ",ｨ'",
    "竺竺竺竺竺ニ",
    "¨¨¨l弋ﾆﾆﾆﾆﾆﾆﾆアﾍ",
    "^^ｱ⌒寸＾＾",
    "/ﾆﾆﾆﾆﾆﾆﾆﾆｱ元元元元元≦竺竺竺竺",
    "ニニニニ",
    "l V/弋う' /// ヾ",
  ]) {
    assert.equal(isStructuralAaFragmentText(text), true, text);
  }
});

test("structural AA fragment guard keeps real dialogue candidates", () => {
  for (const text of [
    "シオニー：　",
    "　マーティン：　",
    "法治？",
    "他領からの略奪",
    "はい、という訳でこんにちは",
  ]) {
    assert.equal(isStructuralAaFragmentText(text), false, text);
  }
});

test("structural AA fragments are not rendered as selectable Japanese segments", () => {
  const segments =
    segmentContentForTest(`竺竺竺竺竺ニ|¨¨¨l弋ﾆﾆﾆﾆﾆﾆﾆアﾍ 　 ￣|^^ｱ⌒寸＾＾|￣.:.:/ﾆﾆﾆﾆﾆﾆﾆﾆｱ元元元元元≦竺竺竺竺
＾＾＾＾ |^^|]|＾＾＾,| : : :|＾ﾞ|.:.|¨¨¨¨¨~¨~||:::::＼　 | /＿＿_∨｜　 刈.:||￣￣￣ﾞ|| |^^^＾^＾^＾^＾| : |＾＾＾＾＾＾＾＾
二二_|::: |_| | :|｜.:.:.:| :_| |ﾆﾆﾆﾆﾆﾆ|_|::::_|ﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆ|_::::|_|ニニニニ|_|:::ﾄ､|_|￢ー|::::: |ﾆﾆﾆﾆﾆﾆ
　　　　 |　　　　,ｨ'　　　 |　ｶｰﾝ！ｶｰﾝ！`);

  for (const text of [
    "竺竺竺竺竺ニ",
    "¨¨¨l弋ﾆﾆﾆﾆﾆﾆﾆアﾍ",
    "^^ｱ⌒寸＾＾",
    "/ﾆﾆﾆﾆﾆﾆﾆﾆｱ元元元元元≦竺竺竺竺",
    "ニニニニ",
    ",ｨ'",
  ]) {
    const segment = segments.find((item) => item.text.includes(text));
    assert.ok(segment, text);
    assert.equal(segment.isJapanese, false, text);
    assert.equal(isSmartSelectCandidate(segment), false, text);
  }
});

test("plain Japanese dialogue remains selectable after conservative filtering", () => {
  const segments = segmentContentForTest(`はい、という訳でこんにちは
前回で魔王様改めすずかを倒して
やる夫専用のマゾハメ穴にしたやる夫でございます
魔王は倒しましたが資材がまだ残っている！`);

  for (const text of [
    "はい、という訳でこんにちは",
    "前回で魔王様改めすずかを倒して",
    "やる夫専用のマゾハメ穴にしたやる夫でございます",
    "魔王は倒しましたが資材がまだ残っている！",
  ]) {
    const segment = segments.find((item) => item.text === text);
    assert.ok(segment, text);
    assert.equal(segment.isJapanese, true, text);
    assert.equal(isSmartSelectCandidate(segment), true, text);
  }
});

test("meaningful Japanese text remains manually selectable even when not auto-selected", () => {
  const segments = segmentContentForTest(`資材
他領
遮断
世界情勢`);

  for (const text of ["資材", "他領", "遮断", "世界情勢"]) {
    const segment = segments.find((item) => item.text === text);
    assert.ok(segment, text);
    assert.equal(segment.isJapanese, true, text);
    assert.equal(isSmartSelectCandidate(segment), false, text);
  }
});

test("aa-embedded Japanese fragments remain manually selectable but not auto-selected", () => {
  const segments = segmentContentForTest(`/芹云ミ ／
芹云ミ､
人､ ゝ 丿
ゝ 丿ｊ│/
ｶｰﾝ！ｶｰﾝ！`);

  for (const text of ["/芹云ミ", "芹云ミ､", "人､ ゝ 丿", "ゝ 丿ｊ", "ｶｰﾝ！ｶｰﾝ！"]) {
    const segment = segments.find((item) => item.text === text);
    assert.ok(segment, text);
    assert.equal(segment.isJapanese, true, text);
    assert.equal(isSmartSelectCandidate(segment), false, text);
  }
});
