import { spawn } from 'node:child_process';
import { join } from 'node:path';

const command = process.argv[2] === 'dev' ? 'dev' : 'build';
const args = command === 'dev'
  ? ['dev', '--mode', 'pages', '--port=3001', '--host=localhost']
  : ['build', '--mode', 'pages', '--base=./'];

const viteBin = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
const child = spawn(process.execPath, [viteBin, ...args], {
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
