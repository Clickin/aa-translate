const lines = [
    "│傑のスキル発動　傑は呪霊操術を行いました。　　　  │\r",
    "　 │友奈のスキル発動　友奈はマーカーを行いました。　 │\r"
];

const gapRegex = /([\s\u3000\u00A0\u2000-\u200B]*(?:[|│┃｜]+|[\s\u3000\u00A0\u2000-\u200B]{2,})[\s\u3000\u00A0\u2000-\u200B]*)/;

lines.forEach((line, lineIdx) => {
    const isBoxedLine = /^[\s\u3000\u00A0\u2000-\u200B]*[|│┃｜].*[\u3040-\u9faf].*[|│┃｜][\s\u3000\u00A0\u2000-\u200B]*$/.test(line);
    console.log(`Line ${lineIdx} isBoxedLine:`, isBoxedLine);
});
