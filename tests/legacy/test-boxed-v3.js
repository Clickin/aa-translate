
const hanjaCount = (text) => (text.match(/[\u4e00-\u9faf\u3400-\u4dbf]/g) || []).length;

// Case: 1 space on left, nothing on right of right │
const line = "  │傑のスキル発動　傑は呪霊操術を行いました。　　　  │"; 

// Current regex (with 3+ spaces)
const currentRegex = /(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]{3,}│)(.*)(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]│)[\s\u3000\u00A0\u2000-\u200B]*$/;

// Proposed regex (with 1+ spaces)
const proposedRegex = /(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]{1,}│)(.*)(?:[\s\u3000\u00A0\u2000-\u200B]│[\s\u3000\u00A0\u2000-\u200B]|[\s\u3000\u00A0\u2000-\u200B]│)[\s\u3000\u00A0\u2000-\u200B]*$/;

console.log("Current Regex Match:", !!line.match(currentRegex));
console.log("Proposed Regex Match:", !!line.match(proposedRegex));

const match = line.match(proposedRegex);
if (match) {
    console.log("Content:", match[1]);
    console.log("Hanja Count:", hanjaCount(match[1]));
}
