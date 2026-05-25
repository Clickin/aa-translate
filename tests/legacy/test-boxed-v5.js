
const line1 = "│box1│ ... │box2│";
const line2 = "  │セイバー（友奈）のスキル　セイバー（友奈）は約束された勝利의 剣を行いました。  │";
const line3 = "/　　|　　l　 　 _　 i! ＿ . . . . . . . . . ..＼ ＿＿　　　　　　　 //　 /　　　 │セイバー（友奈）のスキル　セイバー（友奈）は約束された勝利의 剣を行いました。  │";

const regex = /.*(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]{1,}│)([^│]+)(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]│)[\s\u3000\u00A0\u2000-\u200B]*$/;

[line1, line2, line3].forEach((l, i) => {
    const m = l.match(regex);
    console.log(`Line ${i+1} match:`, !!m);
    if (m) console.log(`Line ${i+1} content:`, m[1]);
});
