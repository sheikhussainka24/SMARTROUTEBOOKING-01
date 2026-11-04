import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '==============================================================');
console.log('\x1b[36m%s\x1b[0m', '  SMART ROUTE — Integrated Commercial Mobility Platform');
console.log('\x1b[36m%s\x1b[0m', '  Official Web:  https://smartroutebooking.com');
console.log('\x1b[32m%s\x1b[0m', '  Local Web UI:  http://localhost:5173');
console.log('\x1b[34m%s\x1b[0m', '  Backend API:   http://localhost:5001');
console.log('\x1b[36m%s\x1b[0m', '==============================================================\n');

const processes = [];

function startProcess(name, colorCode, command, args, cwd) {
  const proc = spawn(command, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  processes.push(proc);

  const prefix = `${colorCode}[${name}]\x1b[0m `;

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${prefix}${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${prefix}\x1b[31m${line}\x1b[0m`);
      }
    });
  });

  proc.on('close', (code) => {
    console.log(`${prefix}Process exited with code ${code}`);
  });

  return proc;
}

// 1. Start Backend on port 5001
const backendProc = startProcess(
  'BACKEND:5001',
  '\x1b[34m',
  'node',
  ['src/server.js'],
  path.join(rootDir, 'BACKEND')
);

// 2. Start Frontend on port 5173
const frontendProc = startProcess(
  'FRONTEND:5173',
  '\x1b[35m',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'FRONTEND')
);

// Graceful shutdown handling
function cleanShutdown() {
  console.log('\n\x1b[33mShutting down SMART ROUTE development services...\x1b[0m');
  processes.forEach((proc) => {
    try {
      proc.kill('SIGTERM');
    } catch (e) {
      // Ignore
    }
  });
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanShutdown);
process.on('SIGTERM', cleanShutdown);
