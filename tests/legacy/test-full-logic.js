const lines = [
    "│傑のスキル発動　傑は呪霊操術を行いました。　　　  │\r",
    "　 │友奈のスキル発動　友奈はマーカーを行いました。　 │\r"
];

const hasJapaneseChar = (text) => /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
const isStrictJapanese = (text) => /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉‘’“”\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワ\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}).+$/.test(text);
const gapRegex = /([\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*)/;

lines.forEach((line, lineIdx) => {
    const isDrawing = (text) => {
        if (/[二三壬]{2,}|[口ロ十]{3,}/.test(text)) return true;
        if (/[|│┃｜_＿￣─━\-\/／\\＼]{2,}/.test(text)) return true;
        const hasBoundaryDrawingLines = /^[\s\u3000\u00A0\u2000-\u200B]*[|│┃｜\/／\\＼_＿￣─━]|[|│┃｜\/／\\＼_＿￣─━][\s\u3000\u00A0\u2000-\u200B]*$/.test(text);
        const hasStandardHiragana = /[ぁ-ん]/.test(text.replace(/[ゝゞ]/g, ''));
        if (hasBoundaryDrawingLines && !hasStandardHiragana) return true;
        const jpChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
        const spacesAndSymbols = text.match(/[^\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
        if (jpChars.length > 0 && jpChars.every(c => /[ヽヾ丶〆丿乂爻巛川]/.test(c))) return true;
        const isAllAAChars = jpChars.length > 0 && jpChars.every(c => /[二三彡ニメ八人入ヌノト一へヘ大イムくミシツテ了心ハフソィッェァォュョエ工乀乁口ロ日目回凵凹凸匚コ丁十小山マヒリルレワヽヾ丶〆丿乂爻巛川芹云ゝゞ\uff65-\uff9f]/.test(c));
        if (isAllAAChars) {
          if (spacesAndSymbols.length >= jpChars.length || jpChars.length === 1) return true;
          if (/[\uff61-\uff65]/.test(text)) return true;
        }
        return false;
    };

    const isBoxedLine = /^[\s\u3000\u00A0\u2000-\u200B]*[|│┃｜].*[\u3040-\u9faf].*[|│┃｜][\s\u3000\u00A0\u2000-\u200B]*$/.test(line);
    console.log(`Line ${lineIdx} isBoxedLine:`, isBoxedLine);

    const parts = line.split(gapRegex);
    parts.forEach((part, partIdx) => {
        if (part === "") return;
        const isSeparator = /^[\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*$/.test(part);
        const isJp = !isSeparator && hasJapaneseChar(part);
        const hasLeadingLargeGap = partIdx > 0 && /^[\s\u3000\u00A0\u2000-\u200B]{2,}$/.test(parts[partIdx-1]);
        const isAtStartWithGap = partIdx === 0 && line.startsWith('  '); 
        const isIsolatedByGap = hasLeadingLargeGap || isAtStartWithGap;
        const isTouchingBarLeft = partIdx > 0 && /[|│┃｜]$/.test(parts[partIdx-1]);
        const isTouchingBarRight = partIdx < parts.length - 1 && /^[|│┃｜]/.test(parts[partIdx+1]);
        const isTouchingBar = isTouchingBarLeft || isTouchingBarRight;
        const jpCharsMatch = part.match(/[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/g) || [];
        const uniqueJpChars = new Set(jpCharsMatch);
        const requiredDistinctChars = isIsolatedByGap ? 2 : 3;
        const hasEnoughDistinctJpChars = uniqueJpChars.size >= requiredDistinctChars;

        const isStrict = isJp && !isDrawing(part) && hasEnoughDistinctJpChars && 
                        (isBoxedLine || (isStrictJapanese(part) && !isTouchingBar));
        
        console.log(`Part: '${part}'`);
        console.log(`  isJp: ${isJp}`);
        console.log(`  !isDrawing: ${!isDrawing(part)}`);
        console.log(`  hasEnoughDistinctJpChars: ${hasEnoughDistinctJpChars}`);
        console.log(`  isBoxedLine: ${isBoxedLine}`);
        console.log(`  isStrictJapanese: ${isStrictJapanese(part)}`);
        console.log(`  isTouchingBar: ${isTouchingBar}`);
        console.log(`  isStrict: ${isStrict}`);
    });
});
