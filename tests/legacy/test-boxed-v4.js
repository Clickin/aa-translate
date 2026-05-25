
const hanjaCount = (text) => (text.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g) || []).length;

const line = "/　　|　　l　 　 _　 i! ＿ . . . . . . . . . ..＼ ＿＿　　　　　　　 //　 /　　　 │セイバー（友奈）のスキル　セイバー（友奈）は約束された勝利の剣を行いました。  │";

const regex = /(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]{1,}│)(.*)(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]│)[\s\u3000\u00A0\u2000-\u200B]*$/;

const match = line.match(regex);
console.log("Match found:", !!match);
if (match) {
    console.log("Content:", match[1]);
    console.log("Hanja Count:", hanjaCount(match[1]));
} else {
    // Debugging why it failed
    console.log("Line length:", line.length);
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const code = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
        if (char === '│') {
            console.log(`Found │ at index ${i}, char code: U+${code}`);
        }
    }
}
