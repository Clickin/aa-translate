import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const clientDir = join(process.cwd(), 'dist', 'client');
const outputFile = join(process.cwd(), 'src', 'server', 'generated', 'client-assets.ts');

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.wasm', 'application/wasm'],
]);

const walk = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
};

const files = await walk(clientDir);
const assets: Record<string, { contentType: string; bodyBase64: string }> = {};

for (const file of files) {
  const routePath = `/${relative(clientDir, file).split(sep).join('/')}`;
  assets[routePath] = {
    contentType: contentTypes.get(extname(file).toLowerCase()) || 'application/octet-stream',
    bodyBase64: (await readFile(file)).toString('base64'),
  };
}

await mkdir(join(process.cwd(), 'src', 'server', 'generated'), { recursive: true });
await writeFile(
  outputFile,
  `export interface EmbeddedClientAsset {
  contentType: string;
  bodyBase64: string;
}

export const CLIENT_ASSETS: Record<string, EmbeddedClientAsset> = ${JSON.stringify(assets, null, 2)};
`,
  'utf8',
);

console.log(`Embedded ${files.length} client assets into ${relative(process.cwd(), outputFile)}.`);

