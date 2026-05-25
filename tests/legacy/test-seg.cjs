const fs = require('fs');

const text = `　　　　　　　　　　　　　　　　　　　　　 　 　 　 _. -／::::::::::／:::_::-:::::´::xｰ-:::::_::::::::ﾍ..､
　　　　　　　　　　　 　 　 　 　 　 　 　 　 ＞:"｣LL｣_ノ::／::／:::::＞／:::::::＞:´:::｀ヾ::::ヾヽ　　　　　　　　　　　　 ::.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.: : .
　　　　　　　　　　　　　　　　　　 　 　 　 }:::::/|::::::::/::::/::／::::r::´:::/:::::::::/::::::::::::::::::::::::::::::::V/　　　　　　　　　 : :　　　　　　　　　　　　　　　　　　　　　 : : .
　　　　　　　　　　　　　　　　　　 　 　 　 |::/:::|:::::::|::::/;:"::::::::{::::::::|:::::::::/::::::::::::::::::::::::::|::::::｀ヽ.　　　　　　　　　 : :　　　　　　　　　　　　　　　　　　　　　 : : .
　　　　　　　　　　　　　　　　　　 　 　 　 |'::::: |:::::::|:::|:::/:::爪::::::::: !::::::/:::::::::r:::::::::::::::: |::::::::\`i::'/　　　　　　　　 : :　　良いわねっ！！　　　　　　　　　  : : .
　　　　　　　　　　　　　　　　　　　 　 　 /::::|: |:::::::|:::xｰ､_|:::::|::::::: !:::/:／| /|::::::::::::::::: !::::::::::|::::'/　　　　　　　  : :　　　　　　　분かったわねっ！！　　: : .
　　　　　　　　　　　 　 　 　 　 　 　 　 /:::|: !: !::::: |:{ /'7. !::: |::::::: !/"｀丶､ ::::|::::::::::::: |:::::::V:::::::'/　　　　　　　 : :　　　　　　　　　　　　　　　　　　　　　 : : .
　　　　　　　　　　　　　　　　 　 　 　 /::::::|: !: !:::::::|ﾍヽ　 !::: |::::::::/气ミx.､ ＼:::::::::::::::|:::::::::V::|､:'/　　　　　　  : :　　　　　　　　　　　　　　　　　　　　　 : : .
　　　　　　　　 　 　 　 　 　 　 　 　 /::::::: |: !: !:::::::|::::＼\`'!::: |:::::/|　Vう刈k　.!::::::::::::::|:::::::::::V　}!　　　　　　　 : ::.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.:.: : :
　　　　　　　　 　 　 　 　 　 　 　 ／::::::: /|: !: !:::::::|:::／ . !::: | /　! ヽ｀¨´　　 !::::::::/|::|:::::::/|::}　'
　　　　　 　 　 　 　 　 　 　 　 ／::::::::::::/: !::|: |:::::: !"　　..|:::::|/　　　　　　 　 |:::／,/ノ::::/...|::|
　　　　　　　　　　　　 　 　 ／::::/:::::::;:/:::::|: !: !:::::::|､　　 .|:::::|　u　　　　　　 "{.圦"::::::/ ....|/
　　　 　 　 　 　 　 　 　 ／:::::／::::／/:: /.|: !:::::::::::| ﾍ　 /:::: |　　　　　　 　 　 ゝ/／|/　 ./
　　　　　　　　　　　　／:::::／::::／ﾆ/::::/ﾆ|:::::::::|::: |x. ﾍ |:::::: !　　　　r‐ _ , "´::/´　 |
　　　　 　 　 　 ＞''ﾞ:::::::／::::::/-=／:／ﾆﾆV/:: |::: |ﾆ＼_!:::::::|＼　　 .ｨi〔::::::/:::/
　 　 　 　 ＞''ﾞ::::::::＞''ﾞ:/::::::/=／'"´ﾆﾆヘﾆV/:|::: |ﾆﾆﾆ|:::::: !f´ ｀¨´:::::|::::/:::/|
　　　....／:::／:::／　/::/:::: /"~´ﾆﾆﾆﾆﾆﾆﾆ\`|::: !::: !ﾆﾆﾆ!:::::/ヽ､\`>､|:::::|:/:::/| |
　　..／:::／:::::/　　/::/:::: /ﾆﾆ､-===ﾆﾆﾆﾆﾆ!::::|::: |ヾ=ﾆ|:::::|=-//_ﾆ!::: |':::/: | |
. 　/:::／::::::::/　　/::/::::::/-==ﾆ＼-=ﾆﾆﾆﾆﾆ|::: !::: !=-＼:::: !=//_==|:::::|:/::　| |　　　　　　　ﾀｯﾀｯﾀ
.../:::/:::::::::::/　　/::/::::::/ﾆﾆﾆﾆﾆﾆV/-=ﾆﾆﾆ|::: !::: !ﾆﾆﾆ|::: |┴'=ﾆﾆ!::: |':　　| |`;

const lines = text.split('\n');

const RE_GAP = /([\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜＞＜\u2500-\u257F／＼\[\]｛｝［］★◆:.]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*)/;
const RE_SEPARATOR = /^[\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜＞＜\u2500-\u257F／＼\[\]｛｝［］★◆:.]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*$/;
const RE_BAR_CHAR = /[|│┃｜＞＜\u2500-\u257F／＼\[\]｛｝［］★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x':.]/;
const RE_STRICT_JAPANESE = /^(?![\s\S]*[|│┃｜\/／\\＼_＿￣─━\-−≦≧=＝<＜>＞:：;；´｀¨'"`+＋*＊\^{}\[\]｛｝［］丶ヽヾ〆丿乂爻巛川〒A-Za-zＡ-Ｚａ-ｚ!?∫∬~从亻Ⅰ-ⅿ()（）《》〈〉''""\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2200-\u22FF\u2190-\u21FF\u2010-\u2015\u0370-\u03FF\u0400-\u04FF\.\,])(?![\s\S]*(?:[二三七彡ニメ八人入ヌ노토一へヘ大イムく미시츠테료심하후소잇엣앗옷윳욧에공불삐구로히리루레와\uff66-\uff9f][\s\.\,・]*){5,})(?=(?:[\s\S]*[ぁ-ん]){3,}|(?:[\s\S]*[ァ-ン\uff66-\uff9f]){3,}|(?:[\s\S]*[一-龯]){3,}|(?=[\s\S]*[！？。「」『』【】…、，])(?:[\s\S]*[ぁ-んァ-ン一-龯]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ぁ-ん]){2,}|(?=[\s\S]*ー)(?:[\s\S]*[ァ-ン\uff66-\uff9f]){2,}|(?=[\s\S]*[ぁ-ん])(?=[\s\S]*[一-龯])(?:[\s\S]*[ぁ-ん一-龯]){3,}).+$/;
const RE_JAPANESE_CHAR = /[\u3040-\u309f\u30a0-\u30ff\uff66-\uff9f\u4e00-\u9faf\u3400-\u4dbf\uff01-\uff5e]/;
const RE_DISQUALIFIED = /[}｝]/;
const RE_ARROW_BOX_START = /[>＞|｜]/;
const RE_ARROW_BOX_END = /[<＜|｜]/;

const hasJapaneseChar = (text) => RE_JAPANESE_CHAR.test(text);

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  if (!line.includes("良いわねっ！！")) continue;

  const parts = line.split(RE_GAP);
  let currentOffset = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (RE_SEPARATOR.test(part) || part === "") {
      currentOffset += part.length;
      continue;
    }

    if (part.includes("良いわねっ！！")) {
      console.log("Found part: " + part);
      
      const isJp = RE_STRICT_JAPANESE.test(part);
      console.log("isJp: " + isJp);

      let leftBorderIdx = -1;
      for (let j = currentOffset - 1; j >= 0; j--) {
        if (RE_BAR_CHAR.test(line[j])) {
          leftBorderIdx = j;
          break;
        }
      }
      let rightBorderIdx = -1;
      for (let j = currentOffset + part.length; j < line.length; j++) {
        if (RE_BAR_CHAR.test(line[j])) {
          rightBorderIdx = j;
          break;
        }
      }

      console.log("leftBorderIdx: " + leftBorderIdx + ", char: '" + line[leftBorderIdx] + "'");
      console.log("rightBorderIdx: " + rightBorderIdx + ", char: '" + line[rightBorderIdx] + "'");
      
      const leftSub = line.substring(leftBorderIdx + 1, currentOffset);
      const rightSub = line.substring(currentOffset + part.length, rightBorderIdx);
      const rightSub2 = line.substring(rightBorderIdx + 1);

      console.log("leftSub: '" + leftSub + "'");
      console.log("rightSub: '" + rightSub + "'");
      console.log("rightSub2: '" + rightSub2 + "'");

      const RE_AA_GAP = /^[ \u3000\u00A0\u2000-\u200B\u2009|│┃｜＞＜\u2500-\u257F／＼\[\]｛｝［］★◆■□●○◎◇△▽▲▼＋＊*#+\-_=f,x':.]*$/;

      const isArrowBox = !RE_DISQUALIFIED.test(part) &&
                         hasJapaneseChar(part) &&
                         part.length >= 3 &&
                         (
                           ((leftBorderIdx !== -1 && RE_ARROW_BOX_START.test(line[leftBorderIdx])) &&
                            (rightBorderIdx !== -1 && RE_ARROW_BOX_END.test(line[rightBorderIdx]))) ||
                           ((leftBorderIdx !== -1 && line[leftBorderIdx] === ':') &&
                            (rightBorderIdx !== -1 && (line[rightBorderIdx] === ':' || line[rightBorderIdx] === '.')))
                         ) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009:.]*$/.test(leftSub) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009:.]*$/.test(rightSub) &&
                         /^[ \u3000\u00A0\u2000-\u200B\u2009:.]*$/.test(rightSub2);
      
      console.log("isArrowBox: " + isArrowBox);
    }
    currentOffset += part.length;
  }
}
