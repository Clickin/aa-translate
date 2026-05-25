const text = `|/芹云ミ ／　　　 芹云ミ､
　 人､ ゝ 丿　　　　　　ゝ 丿ｊ│/`;

const lines = text.split('\n');
lines.forEach(line => {
  const isBoxedLine = /^[\s\u3000\u00A0\u2000-\u200B]*[|│┃｜].*[|│┃｜][\s\u3000\u00A0\u2000-\u200B]*$/.test(line);
  console.log(`Line: "${line}" -> isBoxedLine: ${isBoxedLine}`);
});
