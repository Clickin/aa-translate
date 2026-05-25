import { spawn } from 'node:child_process';
import { join } from 'node:path';

const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
const child = spawn(process.execPath, [viteBin, 'build', '--mode', 'pages', '--base=./'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_DEPLOY_TARGET: 'browser',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
