
const line = ",、..::''\"ﾟ~~~~~~~ﾟ\"''～､　　　　　 　 　 　 　 　 　 　 　 ＞　使う度に居なくなる仲間っ！！　　　　　　　　　 　 　 ＜";
const arrowMatch = line.match(/^(?:.*(?:[\s\u3000\u00A0\u2000-\u200B]＞[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]{1,}＞)|＞)([^＜]+)(?:[\s\u3000\u00A0\u2000-\u200B]＜[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]＜|＜)[\s\u3000\u00A0\u2000-\u200B]*$/);

console.log("Match:", !!arrowMatch);
if (arrowMatch) {
    console.log("Content:", arrowMatch[1]);
}
