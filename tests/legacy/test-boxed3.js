const line1 = "│傑のスキル発動　傑は呪霊操術を行いました。　　　  │";
const line2 = "　 │友奈のスキル発動　友奈はマーカーを行いました。　 │";

const isBoxedLineRegex = /^[\s\u3000\u00A0\u2000-\u200B]*[|│┃｜].*[\u3040-\u9faf].*[|│┃｜][\s\u3000\u00A0\u2000-\u200B]*$/;

console.log("line1 isBoxedLine:", isBoxedLineRegex.test(line1));
console.log("line2 isBoxedLine:", isBoxedLineRegex.test(line2));

const gapRegex = /([\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*)/;

const parts1 = line1.split(gapRegex);
console.log("parts1:", parts1);

const parts2 = line2.split(gapRegex);
console.log("parts2:", parts2);
