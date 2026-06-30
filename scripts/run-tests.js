const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const testsDir = path.join(__dirname, '..', 'src', 'lib', '__tests__');
const files = fs.readdirSync(testsDir);

const testFiles = files
  .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
  .map(file => `"${path.join(testsDir, file)}"`);

if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

console.log(`Found ${testFiles.length} test files to run...`);

// Use npx.cmd on Windows, npx on Unix
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const args = ['tsx', '--test', ...testFiles];

console.log(`Running: ${npxCmd} ${args.join(' ')}`);

const cmdLine = `${npxCmd} ${args.join(' ')}`;
const child = spawn(cmdLine, { stdio: 'inherit', shell: true });

child.on('close', (code) => {
  process.exit(code);
});
