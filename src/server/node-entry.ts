import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from './app.js';

const port = Number(process.env.AA_TRANSLATOR_PORT || process.env.PORT || 3000);
const hostname = process.env.AA_TRANSLATOR_HOST || '0.0.0.0';
const clientDir = join(process.cwd(), 'dist', 'client');
const app = createApp();

if (existsSync(clientDir)) {
  app.use('/*', serveStatic({ root: clientDir }));
  app.get('*', serveStatic({ path: join(clientDir, 'index.html') }));
}

serve(
  {
    fetch: app.fetch,
    port,
    hostname,
  },
  (info) => {
    console.log(`AA Translator server listening on http://${info.address}:${info.port}`);
  },
);
