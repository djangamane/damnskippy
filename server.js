import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the frontend development server
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Start the backend server
const backend = spawn('node', ['--loader', 'ts-node/esm', '--experimental-specifier-resolution=node', './server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, TS_NODE_PROJECT: './tsconfig.server.json' }
});

// Handle process termination
process.on('SIGINT', () => {
  frontend.kill();
  backend.kill();
  process.exit();
}); 