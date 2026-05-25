
const line = "　 　 |ﾆﾆﾆﾆﾆﾆﾆ√ﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆﾆh、　　　　　　　　　 │セイバー（友奈）にスキルを与えました。　　　　　　　　　　　　 　 　 　 　 　 　 　 　 　 │";
const regex = /^(?:.*(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]{1,}│)|│)([^│]+)(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]│|│)[\s\u3000\u00A0\u2000-\u200B]*$/;

const hanjaCount = (text) => (text.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g) || []).length;

const m = line.match(regex);
console.log("Match:", !!m);
if (m) {
    console.log("Content:", m[1]);
    console.log("Hanja Count:", hanjaCount(m[1]));
}
