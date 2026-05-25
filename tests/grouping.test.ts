import assert from "node:assert/strict";
import test from "node:test";
import type { TextSegment } from "../types";
import {
  groupSelectedJapaneseSentences,
  isMeaningfulJapaneseSentence,
} from "../src/shared/grouping";

const segment = (id: string, text: string, selected = true, translated = false): TextSegment => ({
  id,
  text,
  original: text,
  isJapanese: true,
  isSelected: selected,
  isTranslated: translated,
});

test("meaningful Japanese sentence rule accepts sentence-like dialogue", () => {
  assert.equal(isMeaningfulJapaneseSentence("今日はいい天気ですね。"), true);
  assert.equal(isMeaningfulJapaneseSentence("人"), false);
});

test("groups selected Japanese text for request-time batching", () => {
  const groups = groupSelectedJapaneseSentences([
    segment("a", "今日は"),
    segment("b", "いい天気ですね。"),
    segment("c", "\n", false),
    segment("d", "人"),
  ]);

  assert.deepEqual(groups, [
    { ids: ["a", "b"], text: "今日はいい天気ですね。" },
    { ids: ["d"], text: "人" },
  ]);
});

test("skips already translated selected segments when building translation groups", () => {
  const groups = groupSelectedJapaneseSentences([
    segment("a", "翻訳済みです。", true, true),
    segment("b", "\n", false),
    segment("c", "未翻訳です。"),
  ]);

  assert.deepEqual(groups, [{ ids: ["c"], text: "未翻訳です。" }]);
});
