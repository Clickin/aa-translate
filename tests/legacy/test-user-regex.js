
const isStrictJapanese = (text) => /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉‘’“”\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワ\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}).+$/.test(text);

const line1 = "傑のスキル発動　傑は呪霊操術を行いました。";
const line2 = "友奈のスキル発動　友奈はマーカーを行いました。";

console.log("Line 1:", isStrictJapanese(line1));
console.log("Line 2:", isStrictJapanese(line2));

// Check if it contains any character from the negative lookahead
const forbidden = /[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉‘’“”\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,]/;

for (let i = 0; i < line1.length; i++) {
    if (forbidden.test(line1[i])) {
        console.log(`Line 1 forbidden char at ${i}: ${line1[i]} (U+${line1.charCodeAt(i).toString(16)})`);
    }
}

for (let i = 0; i < line2.length; i++) {
    if (forbidden.test(line2[i])) {
        console.log(`Line 2 forbidden char at ${i}: ${line2[i]} (U+${line2.charCodeAt(i).toString(16)})`);
    }
}
