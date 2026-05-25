import fs from 'fs';

const workerCode = fs.readFileSync('workers/segmentation.worker.ts', 'utf8');
const extractRegex = (name: string) => {
  const match = workerCode.match(new RegExp(`const ${name} = (/.+?/[a-z]*);`));
  if (match) return eval(match[1]);
  return null;
};

const RE_AA_CHARS = extractRegex('RE_AA_CHARS');

console.log("RE_AA_CHARS.test('ｰ'):", RE_AA_CHARS.test('ｰ'));
console.log("RE_AA_CHARS.test('し'):", RE_AA_CHARS.test('し'));
