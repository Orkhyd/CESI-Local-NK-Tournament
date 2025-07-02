const { spawn } = require('child_process');

console.log('🔧 Starting custom build process...');

// Set environment variables
process.env.ELECTRON = 'true';
process.env.NODE_ENV = 'production';
process.env.CI = 'false';
process.env.FORCE_COLOR = '0';

// Run vite build directly
const vite = spawn('npx', ['vite', 'build', '--mode', 'production'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

vite.on('close', (code) => {
  console.log(`Build process exited with code ${code}`);
  process.exit(code);
});

vite.on('error', (error) => {
  console.error('Build process error:', error);
  process.exit(1);
});

// Kill process after 5 minutes if it hangs
setTimeout(() => {
  console.log('Build process timed out, killing...');
  vite.kill('SIGTERM');
  process.exit(1);
}, 5 * 60 * 1000);
