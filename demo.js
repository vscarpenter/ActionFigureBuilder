#!/usr/bin/env node

// Simple demo script to start the server and open browser
import { spawn } from 'child_process';
import { platform } from 'os';

console.log('🚀 Starting Action Figure Builder Demo...\n');

// Start the server
const server = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });

// Wait a moment for server to start, then open browser
setTimeout(() => {
  console.log('\n🌐 Opening browser at http://localhost:3000\n');

  const url = 'http://localhost:3000';
  let cmd;

  switch (platform()) {
    case 'darwin':
      cmd = 'open';
      break;
    case 'win32':
      cmd = 'start';
      break;
    default:
      cmd = 'xdg-open';
  }

  spawn(cmd, [url], { detached: true, stdio: 'ignore' });

  console.log('Demo Tips:');
  console.log('• Upload a photo from the samples/ folder');
  console.log('• Enter a name for the action figure packaging');
  console.log('• Click "Generate My Action Figure"');
  console.log('• Press Ctrl+C to stop the server\n');
}, 3000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n👋 Stopping demo server...');
  server.kill();
  process.exit(0);
});