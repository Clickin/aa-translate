
const isStrictJapanese = (text) => /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉‘’“”\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三彡ニメ八人入ヌ노토一へヘ大イムくミ시츠테료심하후소잇엣앗옷윳욧에공불삐구로히리루레와\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}).+$/.test(text);

const hanjaCount = (text) => (text.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g) || []).length;

const line = "/ﾆ{,イﾆﾆﾆﾆﾄ､.　　　　 　 　 　 　 ,'니리.　 　 ,이니아''\"´　 마니니니,'　　　　　　　　 │傑のスキル発動　傑は呪霊操術を行いました。　　　  │";

const proposedRegex = /(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]{3,}│)(.*)(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]│)[\s\u3000\u00A0\u2000-\u200B]*$/;

const match = line.match(proposedRegex);
if (match) {
    console.log("Content:", match[1]);
    console.log("Hanja Count:", hanjaCount(match[1]));
    console.log("Is Strict Japanese:", isStrictJapanese(match[1].trim()));
}
