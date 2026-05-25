import { createApp } from './app.js';
import { CLIENT_ASSETS } from './generated/client-assets.js';

const port = Number(process.env.AA_TRANSLATOR_PORT || process.env.PORT || 3000);
const hostname = process.env.AA_TRANSLATOR_HOST || '127.0.0.1';

const app = createApp();

app.get('*', (c) => {
  const path = new URL(c.req.url).pathname;
  const asset = CLIENT_ASSETS[path] || CLIENT_ASSETS['/index.html'];
  if (!asset) {
    return c.notFound();
  }
  return new Response(Buffer.from(asset.bodyBase64, 'base64'), {
    headers: {
      'content-type': asset.contentType,
      'cache-control': path === '/index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    },
  });
});

export default {
  port,
  hostname,
  fetch: app.fetch,
};

console.log(`AA Translator SFX listening on http://${hostname}:${port}`);
